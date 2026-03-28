const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// Paths to data files
const dataDir = path.join(process.cwd(), 'data');
const reportDir = path.join(dataDir, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

const defaultSettings = {
    enabled: false,
    time: "20:00",
    recipients: ["ITsupport@vistaran.in"],
    includeTickets: true,
    includeAttendance: true,
    includeInventory: true
};

class ReportService {
    constructor() {
        this.cronJob = null;
        this.initializeCron();
    }

    getSettings() {
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

    updateSettings(newSettings) {
        const settingsPath = path.join(dataDir, 'notification-settings.json');
        try {
            let data = {};
            if (fs.existsSync(settingsPath)) {
                data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            data.dailyReport = { ...(data.dailyReport || defaultSettings), ...newSettings };
            fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
            this.initializeCron(); // Re-initialize cron with new time
            return { success: true };
        } catch (e) {
            console.error('Error saving report settings:', e);
            return { success: false, error: e.message };
        }
    }

    initializeCron() {
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

    getData(collection) {
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

    async generateAndSendReport(manualRecipients) {
        const today = new Date().toISOString().split('T')[0];
        const settings = this.getSettings();
        const recipients = manualRecipients || settings.recipients;

        if (recipients.length === 0) {
            console.error('No recipients defined for daily report.');
            return { success: false, error: 'No recipients' };
        }

        // 1. Collect Data
        const tickets = this.getData('tickets').filter(t => t.dateCreated && t.dateCreated.startsWith(today));
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

    createExcelReport(filePath, tickets, attendance, lowStock) {
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

    createPDFReport(filePath, tickets, attendance, lowStock, date) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            doc.fillColor('#0f172a').fontSize(25).text('Vistaran IT Daily Status Report', { align: 'center' });
            doc.fontSize(10).text(`Date: ${date}`, { align: 'center' });
            doc.moveDown();
            doc.strokeColor('#e2e2e2').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            doc.fillColor('#1e293b').fontSize(16).text('Executive Summary', { underline: true });
            doc.fontSize(12).moveDown(0.5);
            doc.text(`- Total Tickets Created: ${tickets.length}`);
            doc.text(`- Staff Punches Recorded: ${attendance.length}`);
            doc.text(`- Critical Assets (Low Stock): ${lowStock.length}`);
            doc.moveDown();

            if (tickets.length > 0) {
                doc.fontSize(16).text('Daily Support Tickets', { underline: true });
                doc.fontSize(10).moveDown(0.5);
                tickets.forEach((t, i) => {
                    doc.text(`${i + 1}. [${t.priority}] ${t.id} - ${t.description.substring(0, 50)}... (${t.status})`);
                });
                doc.moveDown();
            }

            if (attendance.length > 0) {
                doc.fontSize(16).text('Attendance Log', { underline: true });
                doc.fontSize(10).moveDown(0.5);
                attendance.forEach((a, i) => {
                    doc.text(`${i + 1}. ${a.userName} - ${a.status} (${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'})`);
                });
                doc.moveDown();
            }

            doc.fontSize(8).fillColor('#94a3b8').text('Generated automatically by Vistaran Help Desk Report System', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', (err) => reject(err));
        });
    }

    async sendEmail(recipients, date, attachments) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
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

            if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'placeholder_pass') {
                console.log('Skipping actual email send (no credentials). Report files generated in data/reports/');
                return { success: true, simulated: true };
            }

            const info = await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (e) {
            console.error('Error sending email:', e);
            return { success: false, error: e.message };
        }
    }
}

module.exports = {
    reportService: new ReportService()
};
