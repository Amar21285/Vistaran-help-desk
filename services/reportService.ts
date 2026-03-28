import fs from 'fs';
import path from 'path';
import cron, { ScheduledTask } from 'node-cron';
import * as xlsx from 'xlsx';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

// Paths to data files
const dataDir = path.join(process.cwd(), 'data');
const reportDir = path.join(dataDir, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

interface ReportSettings {
    enabled: boolean;
    time: string; // HH:mm format
    recipients: string[];
    includeTickets: boolean;
    includeAttendance: boolean;
    includeInventory: boolean;
}

const defaultSettings: ReportSettings = {
    enabled: false,
    time: "20:00",
    recipients: ["ITsupport@vistaran.in"],
    includeTickets: true,
    includeAttendance: true,
    includeInventory: true
};

export class ReportService {
    private cronJob: ScheduledTask | null = null;

    constructor() {
        this.initializeCron();
    }

    private getSettings(): ReportSettings {
        const settingsPath = path.join(dataDir, 'notification-settings.json');
        try {
            if (fs.existsSync(settingsPath)) {
                const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                return { ...defaultSettings, ...(data.dailyReport || {}) };
            }
        } catch (e) {
            console.error('Error reading report settings:', e);
        }
        return defaultSettings;
    }

    public updateSettings(newSettings: Partial<ReportSettings>) {
        const settingsPath = path.join(dataDir, 'notification-settings.json');
        try {
            let data: any = {};
            if (fs.existsSync(settingsPath)) {
                data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            data.dailyReport = { ...(data.dailyReport || defaultSettings), ...newSettings };
            fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
            this.initializeCron(); // Re-initialize cron with new time
            return { success: true };
        } catch (e) {
            console.error('Error saving report settings:', e);
            return { success: false, error: (e as Error).message };
        }
    }

    public initializeCron() {
        const settings = this.getSettings();
        if (this.cronJob) {
            this.cronJob.stop();
        }

        if (settings.enabled && settings.time) {
            const [hour, minute] = settings.time.split(':');
            const cronTime = `${minute} ${hour} * * *`;
            console.log(`Scheduling daily report for ${settings.time} (Cron: ${cronTime})`);
            this.cronJob = cron.schedule(cronTime, () => {
                console.log('Running scheduled daily report...');
                this.generateAndSendReport();
            });
        }
    }

    private getData(collection: string): any[] {
        const filePath = path.join(dataDir, `${collection}.json`);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error(`Error reading ${collection} data:`, e);
        }
        return [];
    }

    public async generateAndSendReport(manualRecipients?: string[]) {
        const today = new Date().toISOString().split('T')[0];
        const settings = this.getSettings();
        const recipients = manualRecipients || settings.recipients;

        if (recipients.length === 0) {
            console.error('No recipients defined for daily report.');
            return { success: false, error: 'No recipients' };
        }

        // 1. Collect Data
        const tickets = this.getData('tickets').filter(t => t.dateCreated.startsWith(today));
        const attendance = this.getData('attendance').filter(a => a.date === today);
        const inventory = this.getData('inventory');
        const lowStock = inventory.filter(i => i.quantity <= (i.minStock || 0));

        // 2. Generate Excel
        const excelPath = path.join(reportDir, `DSR_${today}.xlsx`);
        this.createExcelReport(excelPath, tickets, attendance, lowStock);

        // 3. Generate PDF
        const pdfPath = path.join(reportDir, `DSR_${today}.pdf`);
        await this.createPDFReport(pdfPath, tickets, attendance, lowStock, today);

        // 4. Send Email
        const mailResult = await this.sendEmail(recipients, today, [excelPath, pdfPath]);

        return { 
            success: mailResult.success, 
            reportDate: today, 
            stats: {
                ticketsToday: tickets.length,
                attendanceToday: attendance.length,
                lowStockCount: lowStock.length
            }
        };
    }

    private createExcelReport(filePath: string, tickets: any[], attendance: any[], lowStock: any[]) {
        const wb = xlsx.utils.book_new();

        // Tickets Sheet
        const ticketRows = tickets.map(t => ({
            ID: t.id,
            Description: t.description,
            Department: t.department,
            Priority: t.priority,
            Status: t.status,
            Created: t.dateCreated
        }));
        const wsTickets = xlsx.utils.json_to_sheet(ticketRows);
        xlsx.utils.book_append_sheet(wb, wsTickets, 'Daily Tickets');

        // Attendance Sheet
        const attendanceRows = attendance.map(a => ({
            Name: a.userName,
            Status: a.status,
            CheckIn: a.checkIn,
            CheckOut: a.checkOut || 'N/A'
        }));
        const wsAttendance = xlsx.utils.json_to_sheet(attendanceRows);
        xlsx.utils.book_append_sheet(wb, wsAttendance, 'Daily Attendance');

        // Low Stock Sheet
        const stockRows = lowStock.map(i => ({
            ID: i.id,
            Name: i.name,
            Category: i.category,
            CurrentQty: i.quantity,
            MinQty: i.minStock,
            Status: 'Critical'
        }));
        const wsStock = xlsx.utils.json_to_sheet(stockRows);
        xlsx.utils.book_append_sheet(wb, wsStock, 'Low Stock Assets');

        xlsx.writeFile(wb, filePath);
    }

    private createPDFReport(filePath: string, tickets: any[], attendance: any[], lowStock: any[], date: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fillColor('#0f172a').fontSize(25).text('Vistaran IT Daily Status Report', { align: 'center' });
            doc.fontSize(10).text(`Date: ${date}`, { align: 'center' });
            doc.moveDown();
            doc.strokeColor('#e2e2e2').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Summary Section
            doc.fillColor('#1e293b').fontSize(16).text('Executive Summary', { underline: true });
            doc.fontSize(12).moveDown(0.5);
            doc.text(`- Total Tickets Created: ${tickets.length}`);
            doc.text(`- Staff Punches Recorded: ${attendance.length}`);
            doc.text(`- Critical Assets (Low Stock): ${lowStock.length}`);
            doc.moveDown();

            // Tickets Section
            if (tickets.length > 0) {
                doc.fontSize(16).text('Daily Support Tickets', { underline: true });
                doc.fontSize(10).moveDown(0.5);
                tickets.forEach((t, i) => {
                    doc.text(`${i + 1}. [${t.priority}] ${t.id} - ${t.description.substring(0, 50)}... (${t.status})`);
                });
                doc.moveDown();
            }

            // Attendance Section
            if (attendance.length > 0) {
                doc.fontSize(16).text('Attendance Log', { underline: true });
                doc.fontSize(10).moveDown(0.5);
                attendance.forEach((a, i) => {
                    doc.text(`${i + 1}. ${a.userName} - ${a.status} (In: ${new Date(a.checkIn).toLocaleTimeString()})`);
                });
                doc.moveDown();
            }

            // Footer
            doc.fontSize(8).fillColor('#94a3b8').text('Generated automatically by Vistaran Help Desk Report System', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', (err) => reject(err));
        });
    }

    private async sendEmail(recipients: string[], date: string, attachments: string[]) {
        try {
            // Read email config from env or fallback to common setup
            // For now, I'll use placeholders. In a real scenario, the user provides SMTP.
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Common for small setups
                auth: {
                    user: process.env.EMAIL_USER || 'it.vistaran@gmail.com',
                    pass: process.env.EMAIL_PASS || 'placeholder_pass'
                }
            });

            const mailOptions = {
                from: '"Vistaran Auto Bot" <it.vistaran@gmail.com>',
                to: recipients.join(', '),
                subject: `IT Daily Status Report (DSR) - ${date}`,
                text: `Please find attached the IT Daily Status Report for ${date}.\n\nThis is an automated message.`,
                attachments: attachments.map(p => ({ filename: path.basename(p), path: p }))
            };

            // If no credentials, we just log it and simulate success for the demo
            if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'placeholder_pass') {
                console.log('Skipping actual email send (no credentials). Report files generated in data/reports/');
                return { success: true, simulated: true };
            }

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            return { success: true };
        } catch (e) {
            console.error('Error sending email:', e);
            // Even if email fails, we generated the files
            return { success: false, error: (e as Error).message };
        }
    }
}

export const reportService = new ReportService();
