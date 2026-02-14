import emailjs from '@emailjs/browser';
import { Ticket, User, Technician, Vendor, InventoryItem, ReceivingChallan, Invoice } from '../types';
import { EmailTemplateSettings } from '../hooks/useSettings';

// This file now uses the EmailJS browser SDK, imported via importmap in index.html

/**
 * Sends an email using the EmailJS client-side SDK.
 */
export const sendEmail = async (
    serviceId: string, 
    publicKey: string, 
    templateId: string, 
    templateParams: Record<string, unknown>
): Promise<{ success: boolean, message?: string }> => {
    if (!serviceId || !publicKey) {
        const errorMessage = "EmailJS Service ID or Public Key is not configured. Please configure them in App Settings > Email.";
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('EmailJS Success:', response);
        return { success: true };
    } catch (error: any) {
        let rawMessage = 'An unknown error occurred while sending the email.';
        let detailedMessage = 'An unknown error occurred. Please check the browser console for more details.';

        if (typeof error === 'object' && error !== null && 'text' in error) {
            rawMessage = error.text as string;
            const lowerMessage = rawMessage.toLowerCase();

            if (lowerMessage.includes('public key is invalid')) {
                detailedMessage = "The Public Key (API Key) you entered appears to be incorrect. Please double-check it on your EmailJS Account page.";
            } else if (lowerMessage.includes('service id is invalid')) {
                detailedMessage = "The Service ID you entered appears to be incorrect. Please verify it on your EmailJS Email Services page.";
            } else if (lowerMessage.includes('template id')) {
                detailedMessage = `The template ID '${templateId}' was not found. Please ensure you have created a template with this exact ID in your EmailJS dashboard as per the setup instructions.`;
            } else if (lowerMessage.includes('blocked')) {
                detailedMessage = "Your EmailJS service has been temporarily blocked, likely due to spam prevention. Please check your EmailJS dashboard for more details or try creating a new service.";
            } else {
                detailedMessage = `An unexpected error occurred. Raw error: ${rawMessage}`;
            }

        } else if (error instanceof Error) {
            detailedMessage = error.message;
        }
        
        console.error('EmailJS Error:', detailedMessage);
        return { success: false, message: detailedMessage };
    }
};

// --- HTML Email Body Generators ---

const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #2c3e50; padding: 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #2c3e50; margin-top: 0; }
        .content p { line-height: 1.6; margin: 10px 0; }
        .item-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .item-table th { background-color: #f8f9fa; border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        .item-table td { border: 1px solid #e2e8f0; padding: 10px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">${content}</div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} Vistaran Inc. All rights reserved.</p></div>
    </div>
</body>
</html>
`;

const processTemplate = (templateString: string, context: Record<string, any>): string => {
    return templateString.replace(/{([^{}]+)}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value: any = context;
        try {
            for (const k of keys) {
                value = value[k];
            }
            if (value === null || value === undefined) return '';
            return String(value);
        } catch (e) {
            return match;
        }
    });
};

const generateItemTableHtml = (items: any[]) => {
    const rows = items.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${item.description}</td>
            <td align="right">${item.quantity} ${item.unit}</td>
        </tr>
    `).join('');

    return `
        <table class="item-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Description of Goods</th>
                    <th align="right">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
};

export const generateNewTicketAdminEmail = (ticket: Ticket, user: User, admin: User, templates: EmailTemplateSettings) => {
    const template = templates.adminOnNewTicket;
    const context = { ticket, user, admin };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk | Admin Alert', content), to_email: admin.email, to_name: admin.name };
};

export const generateResolvedTicketAdminEmail = (ticket: Ticket, user: User, admin: User, resolver: User, templates: EmailTemplateSettings) => {
    const template = templates.adminOnTicketResolved;
    const context = { ticket, user, admin, resolver };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk | Admin Alert', content), to_email: admin.email, to_name: admin.name };
};

export const generateNewTicketUserEmail = (ticket: Ticket, user: User, templates: EmailTemplateSettings) => {
    const template = templates.userOnNewTicket;
    const context = { ticket, user };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk', content), to_email: user.email, to_name: user.name };
};

export const generateResolvedTicketUserEmail = (ticket: Ticket, user: User, resolver: User, templates: EmailTemplateSettings) => {
    const template = templates.userOnTicketResolved;
    const context = { ticket, user, resolver };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk', content), to_email: user.email, to_name: user.name };
};

export const generateStatusUpdateUserEmail = (ticket: Ticket, user: User, updater: User, templates: EmailTemplateSettings) => {
    const template = templates.userOnTicketStatusChanged;
    const context = { ticket, user, updater };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk', content), to_email: user.email, to_name: user.name };
};

export const generateAssignedTicketTechEmail = (ticket: Ticket, tech: Technician, user: User, assigner: User, templates: EmailTemplateSettings) => {
    const template = templates.techOnTicketAssigned;
    const context = { ticket, user, tech, assigner };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Vistaran Help Desk | New Assignment', content), to_email: tech.email, to_name: tech.name };
};

export const generateStockRequestEmail = (item: InventoryItem, vendor: Vendor, requestedQty: number, admin: User, notes?: string) => {
    const subject = `Purchase Requirement: ${item.name} - Vistaran Inc.`;
    const content = `
        <p>Dear ${vendor.contactPerson || vendor.name},</p>
        <p>We would like to place a requirement for the following inventory item:</p>
        <div style="border-left: 4px solid #3498db; padding-left: 15px; margin: 20px 0; font-size: 14px; background-color: #f8f9fa;">
            <p><strong>Item Name:</strong> ${item.name}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Requested Quantity:</strong> ${requestedQty} ${item.unit}</p>
        </div>
        ${notes ? `<p><strong>Additional Notes:</strong><br/>${notes}</p>` : ''}
        <p>Please provide a quotation or confirm the availability of this stock at your earliest convenience.</p>
        <p>Thank you,</p>
        <p><strong>${admin.name}</strong><br/>Vistaran Inc. Office</p>
    `;
    return { subject, body: baseEmailTemplate('Stock Requirement Request', content), to_email: vendor.email, to_name: vendor.name };
};

export const generateReceivingChallanEmail = (challan: ReceivingChallan, vendor: Vendor, receiver: User, templates: EmailTemplateSettings) => {
    const template = templates.receivingChallan;
    const context = { 
        challan: {
            id: challan.id,
            date: new Date(challan.dateReceived).toLocaleString(),
            notes: challan.notes || 'None'
        },
        vendor,
        receiver,
        items: {
            table: generateItemTableHtml(challan.items)
        }
    };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Receiving Challan Acknowledgement', content), to_email: vendor.email, to_name: vendor.name };
};

export const generateOutwardInvoiceEmail = (invoice: Invoice, vendor: Vendor, issuer: User, templates: EmailTemplateSettings) => {
    const template = templates.outwardInvoice;
    const context = { 
        invoice: {
            id: invoice.id,
            date: new Date(invoice.dateIssued).toLocaleString(),
            notes: invoice.notes || 'None',
            deliveryMethod: invoice.deliveryMethod || 'Standard'
        },
        vendor,
        issuer,
        items: {
            table: generateItemTableHtml(invoice.items)
        }
    };
    const subject = processTemplate(template.subject, context);
    const content = processTemplate(template.body, context);
    return { subject, body: baseEmailTemplate('Material Issue Notification', content), to_email: vendor.email, to_name: vendor.name };
};

// --- Manual Email Fallback (mailto:) ---

export const generateMailto = (params: { to: string, cc?: string | null, bcc?: string, subject: string, body: string }): string => {
    const { to, cc, bcc, subject, body } = params;
    const parts = [];
    if (cc) parts.push(`cc=${encodeURIComponent(cc)}`);
    if (bcc) parts.push(`bcc=${encodeURIComponent(bcc)}`);
    if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
    if (body) parts.push(`body=${encodeURIComponent(body)}`);

    return `mailto:${encodeURIComponent(to)}?${parts.join('&')}`;
};

export const getNewTicketManualMailto = (ticket: Ticket, user: User, admin: User) => generateMailto({
    to: admin.email,
    cc: user.email,
    subject: `[Manual] New Ticket Created: #${ticket.id}`,
    body: `Hello,\n\nThis is a manual notification for a new support ticket.\n\n--- Ticket Details ---\nID: ${ticket.id}\nUser: ${user.name} (${user.email})\nDepartment: ${ticket.department}\nPriority: ${ticket.priority}\n\nDescription:\n${ticket.description}\n\nRegards,\n${user.name}`
});

export const getResolvedTicketManualMailto = (ticket: Ticket, user: User) => generateMailto({
    to: user.email,
    cc: ticket.cc,
    subject: `[Manual] Ticket Resolved: #${ticket.id}`,
    body: `Hi ${user.name},\n\nThis is a manual notification to inform you that your support ticket has been resolved.\n\nID: ${ticket.id}\nResolution Notes:\n${ticket.notes || 'The issue has been addressed.'}\n\nRegards,\nHelp Desk Team`
});

export const getStatusUpdateManualMailto = (ticket: Ticket, user: User) => generateMailto({
    to: user.email,
    cc: ticket.cc,
    subject: `[Manual] Ticket Updated: #${ticket.id}`,
    body: `Hi ${user.name},\n\nThis is a manual notification to inform you that your support ticket #${ticket.id} has been updated.\n\nThe new status is: ${ticket.status}\n\nRegards,\nHelp Desk Team`
});

export const getAssignedTicketManualMailto = (ticket: Ticket, tech: Technician, user: User) => generateMailto({
    to: tech.email,
    subject: `[Manual] Ticket Assigned: #${ticket.id}`,
    body: `Hi ${tech.name},\n\nThis is a manual notification that a ticket has been assigned to you.\n\nID: ${ticket.id}\nUser: ${user.name}\n\nRegards,\nAdmin`
});