# Vistaran Help Desk

An intuitive help desk ticketing system for managing IT support requests. Users can submit tickets, and admins can manage, assign, and resolve them efficiently. This is a frontend-only demonstration application built with React and TypeScript.

## Features
- **Role-Based Access Control**: Separate views and permissions for Users and Administrators.
- **Ticket Management**: Create, view, update, and resolve support tickets.
- **User Management**: Admins can create, edit, delete, and impersonate users.
- **Dashboard & Reporting**: At-a-glance statistics and charts for ticket status and trends.
- **AI Assistant**: Admins can use Google's Gemini AI to summarize tickets, suggest replies, and research issues.
- **File Management**: A simple interface for managing shared files.
- **Real Email Notifications**: The system is pre-configured to send emails for key events using the central `ITsupport@vistaran.in` address.

---

## Developer Setup

### Prerequisites
- A modern web browser.
- A Google Gemini API key for the AI features.

This project is designed to run in a sandboxed browser environment. No local installation or server is required to run the frontend application itself.

### Gemini API Key Configuration
The AI Assistant feature requires a Google Gemini API key.

1. Obtain your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. The execution environment must provide this key as an environment variable named `API_KEY`. The application code reads it via `process.env.API_KEY`.

---

## Email Notifications

Email notifications are pre-configured and enabled by default. The system sends emails for key events (like new ticket creation or status updates) from the central address: `ITsupport@vistaran.in`.

You can enable or disable specific notifications for users, admins, and technicians by navigating to **App Settings > Notifications** within the application.

The email service is provided on a free tier and may occasionally experience temporary outages due to usage limits. If you notice emails are not being sent, you can verify the connection status and find troubleshooting steps at any time in **App Settings > Email**.