const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');

// Paths to data files
const dataDir = path.join(__dirname, '..', 'data');
const reportDir = path.join(dataDir, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

const defaultSettings = {
    enabled: false,
    time: "20:00",
    recipients: ["itsupport@vistaran.in"],
    includeTickets: true,
    includeAttendance: true,
    includeInventory: true,
    lastSentDate: ""
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
            console.warn('Error reading DSR settings:', e);
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
            return { success: true, settings: data.dailyReport };
        } catch (e) {
            console.error('Error saving DSR settings:', e);
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
            console.log(`[DSR] Automation Active (CJS): Scheduled for ${settings.time} Daily (Cron: ${cronTime})`);
            
            this.cronJob = cron.schedule(cronTime, () => {
                console.log('[DSR] Running scheduled daily report trigger (CJS)...');
                this.generateAndSendReport();
            });

            // Missed Run Check (Catch-up)
            setTimeout(() => {
                const istOffset = 5.5 * 60 * 60 * 1000;
                const istNow = new Date(Date.now() + istOffset);
                const todayIST = istNow.toISOString().split('T')[0];
                
                const [targetHour, targetMinute] = settings.time.split(':').map(Number);
                const nowMinutes = (istNow.getUTCHours() + 5) * 60 + (istNow.getUTCMinutes() + 30);
                const targetMinutes = targetHour * 60 + targetMinute;

                if (settings.lastSentDate !== todayIST && nowMinutes >= targetMinutes) {
                    console.log(`[DSR] Missed Run Detected (Today: ${todayIST}, Scheduled: ${settings.time}). Initializing catch-up report...`);
                    this.generateAndSendReport();
                }
            }, 10000); // Wait 10 seconds after startup
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

    async generateAndSendReport(manualRecipients = null, optionalRange = null) {
        let startDate, endDate, label;
        
        // IST date calculation
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(Date.now() + istOffset);
        const todayIST = istNow.toISOString().split('T')[0];

        if (optionalRange && optionalRange.start && optionalRange.end) {
            startDate = optionalRange.start;
            endDate = optionalRange.end;
            label = `Range_${startDate}_to_${endDate}`;
        } else {
            startDate = todayIST;
            endDate = startDate;
            label = startDate;
        }

        console.log(`[DSR] Processing Report (CJS) [${label}]`);
        const settings = this.getSettings();
        const recipients = manualRecipients || settings.recipients;

        if (!recipients || recipients.length === 0) {
            console.error('[DSR] No recipients found.');
            return { success: false, error: 'No recipients' };
        }

        try {
            // 1. Collect Data
            const allTickets = this.getData('tickets');
            const tickets = allTickets.filter(t => {
                const ticketDate = (t.dateCreated || t.createdAt || "").split('T')[0];
                return ticketDate >= startDate && ticketDate <= endDate;
            });

            const allAttendance = this.getData('attendance');
            const attendance = allAttendance.filter(a => {
                const punchDate = (a.date || "").split('T')[0];
                return punchDate >= startDate && punchDate <= endDate;
            });

            const inventory = this.getData('inventory');
            const lowStock = inventory.filter(i => {
                const q = Number(i.quantity) || 0;
                const m = Number(i.minStock) || 0;
                return m > 0 && q <= m;
            });

            // 2. Generate Files
            const excelPath = path.join(reportDir, `DSR_${label}.xlsx`);
            this.createExcelReport(excelPath, tickets, attendance, lowStock);

            const pdfPath = path.join(reportDir, `DSR_${label}.pdf`);
            await this.createPDFReport(pdfPath, tickets, attendance, lowStock, label);

            // 3. Send Email
            const mailResult = await this.sendEmail(recipients, label, [excelPath, pdfPath]);

            // 4. Update lastSentDate persistently
            if (!manualRecipients) {
                this.updateSettings({ lastSentDate: todayIST });
            }

            // 5. Record Audit
            this.recordAuditLog({
                action: mailResult.simulated ? 'DSR Generated (Simulated Email)' : 'DSR Sent successfully',
                details: `${manualRecipients ? 'MANUAL' : 'AUTOMATED'} | Range: ${startDate} to ${endDate}, Tickets: ${tickets.length}, Attendance: ${attendance.length}`,
                status: mailResult.success ? "Success" : "Failed"
            });

            return { 
                success: mailResult.success, 
                simulated: mailResult.simulated,
                reportDate: label,
                error: mailResult.error,
                stats: {
                    ticketsToday: tickets.length,
                    attendanceToday: attendance.length,
                    lowStockCount: lowStock.length
                }
            };
        } catch (e) {
            console.error('[DSR] Fatal report generation error (CJS):', e);
            return { success: false, error: e.message };
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
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey || apiKey === 'placeholder_key') {
            console.log('Skipping actual email send (no RESEND_API_KEY). Report files generated in data/reports/');
            return { success: true, simulated: true };
        }

        try {
            const resendAttachments = attachments.map(p => ({
                filename: path.basename(p),
                content: fs.readFileSync(p).toString('base64')
            }));

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    from: 'Vistaran Reports <onboarding@resend.dev>',
                    to: recipients,
                    subject: `IT Daily Status Report (DSR) - ${date}`,
                    html: `<strong>Vistaran Help Desk</strong><br/><br/>Please find attached the IT Daily Status Report for ${date}.<br/><br/>This is an automated message.`,
                    attachments: resendAttachments
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`[DSR] Email sent via Resend to ${recipients.join(', ')}`);
                return { success: true };
            } else {
                console.error('[DSR] Resend API Error:', result);
                return { success: false, error: result.message || 'API Error' };
            }
        } catch (e) {
            console.error('[DSR] Resend Fetch Error:', e.message);
            return { success: false, error: e.message };
        }
    }
}

module.exports = {
    reportService: new ReportService()
};
