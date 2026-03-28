const dns = require('dns');

// Force IPv4 as the primary result order for all DNS lookups in this service
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

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

    async generateAndSendReport(manualRecipients, optionalRange = null) {
        let startDate, endDate, label;
        
        if (optionalRange && optionalRange.start && optionalRange.end) {
            startDate = optionalRange.start;
            endDate = optionalRange.end;
            label = `Range_${startDate}_to_${endDate}`;
            console.log(`[DSR] --- STARTING CUSTOM RANGE REPORT (${label}) ---`);
        } else {
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(now.getTime() + istOffset);
            startDate = istDate.toISOString().split('T')[0];
            endDate = startDate;
            label = startDate;
            console.log(`[DSR] --- STARTING DAILY REPORT (${label}) ---`);
        }

        const settings = this.getSettings();
        const recipients = manualRecipients || settings.recipients;

        if (recipients.length === 0) {
            console.error('[DSR] No recipients found.');
            return { success: false, error: 'No recipients' };
        }

        try {
            // 1. Collect Data
            const allTickets = this.getData('tickets');
            const tickets = allTickets.filter(t => {
                const d = (t.dateCreated || "").split('T')[0];
                return d >= startDate && d <= endDate;
            });

            const allAttendance = this.getData('attendance');
            const attendance = allAttendance.filter(a => a.date >= startDate && a.date <= endDate);

            const inventory = this.getData('inventory');
            const lowStock = inventory.filter(i => {
                const q = Number(i.quantity) || 0;
                const m = Number(i.minStock) || 0;
                return m > 0 && q <= m;
            });

            console.log(`[DSR] Stats for ${label}: Tickets=${tickets.length}, Attendance=${attendance.length}, LowStock=${lowStock.length}`);

            // 2. Generate Files
            const excelPath = path.join(reportDir, `DSR_${label}.xlsx`);
            this.createExcelReport(excelPath, tickets, attendance, lowStock);

            const pdfPath = path.join(reportDir, `DSR_${label}.pdf`);
            await this.createPDFReport(pdfPath, tickets, attendance, lowStock, label);

            // 3. Send Email
            const mailResult = await this.sendEmail(recipients, label, [excelPath, pdfPath]);
            
            // 4. Record in Audit Logs
            this.recordAuditLog({
                action: mailResult.simulated ? `DSR Generated (Simulated) [${label}]` : `DSR Sent [${label}]`,
                details: `Range: ${startDate} to ${endDate}, Tickets: ${tickets.length}, Attendance: ${attendance.length}`,
                status: mailResult.success ? "Success" : "Failed"
            });

            return { 
                success: mailResult.success, 
                simulated: mailResult.simulated,
                reportDate: label,
                error: mailResult.error,
                stats: { ticketsToday: tickets.length, attendanceToday: attendance.length, lowStockCount: lowStock.length }
            };
        } catch (error) {
            console.error('[DSR] Fatal Error:', error);
            return { success: false, error: error.message };
        }
    }

    recordAuditLog(logEntry) {
        const auditLogPath = path.join(dataDir, 'audit-logs.json');
        try {
            let logs = [];
            if (fs.existsSync(auditLogPath)) {
                logs = JSON.parse(fs.readFileSync(auditLogPath, 'utf8'));
            }
            const newLog = {
                id: `DSR_${Date.now()}`,
                userId: "SYSTEM",
                userName: "DSR Automation",
                action: logEntry.action,
                details: logEntry.details,
                timestamp: new Date().toISOString(),
                status: logEntry.status
            };
            logs.unshift(newLog); // Add to beginning
            fs.writeFileSync(auditLogPath, JSON.stringify(logs.slice(0, 1000), null, 2));
        } catch (e) {
            console.error('[DSR] Error recording audit log:', e);
        }
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
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass || pass === 'placeholder_pass') {
            console.log('Skipping actual email send (no credentials). Report files generated in data/reports/');
            return { success: true, simulated: true };
        }

        try {
            const transporter = nodemailer.createTransport({
                host: '74.125.130.108', // Force use of smtp.gmail.com IPv4 address
                port: 465,
                secure: true, // Port 465 is secure by default
                auth: {
                    user: user,
                    pass: pass
                },
                tls: {
                    servername: 'smtp.gmail.com',
                    rejectUnauthorized: false
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 15000
            });

            const mailOptions = {
                from: `"Vistaran Auto Bot" <${user}>`,
                to: recipients.join(', '),
                subject: `IT Daily Status Report (DSR) - ${date}`,
                text: `Please find attached the IT Daily Status Report for ${date}.\n\nThis is an automated message.`,
                attachments: attachments.map(p => ({ filename: path.basename(p), path: p }))
            };

            await transporter.sendMail(mailOptions);
            console.log(`[DSR] Email sent successfully to ${recipients.join(', ')}`);
            return { success: true };
        } catch (e) {
            console.error('[DSR] SMTP Error:', e.message);
            return { success: false, error: e.message };
        }
    }
}

module.exports = {
    reportService: new ReportService()
};
