import { google } from 'googleapis';
import envConfig from '../config/envconfig.js';

let gmail;

try {
    const oauth2Client = new google.auth.OAuth2(
        envConfig.GOOGLE_CLIENT_ID,
        envConfig.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
        refresh_token: envConfig.GOOGLE_REFRESH_TOKEN,
    });

    gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client,
    });

    console.log('Gmail API client initialized');
} catch (error) {
    console.error('Error initializing Gmail API client: ', error);
    throw error;
}

export const sendEmailUsingGmailAPI = async ({ to, subject, html, text, attachments }) => {
    try {
        if (!gmail) {
            throw new Error('Gmail API client is not initialized');
        }

        let message = '';
        if (attachments && attachments.length > 0) {
            const boundary = '____boundary_str_here____';
            message += `From: ${envConfig.GOOGLE_SENDER_EMAIL}\n`;
            message += `To: ${to}\n`;
            message += `Subject: ${subject}\n`;
            message += `MIME-Version: 1.0\n`;
            message += `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;

            message += `--${boundary}\n`;
            message += `Content-Type: text/html; charset=UTF-8\n`;
            message += `Content-Transfer-Encoding: 7bit\n\n`;
            message += `${html || text || ''}\n\n`;

            for (const att of attachments) {
                const contentBase64 = att.content.toString('base64');
                message += `--${boundary}\n`;
                message += `Content-Type: ${att.contentType || 'application/octet-stream'}\n`;
                message += `Content-Transfer-Encoding: base64\n`;
                message += `Content-Disposition: attachment; filename="${att.filename}"\n\n`;
                message += `${contentBase64}\n\n`;
            }
            message += `--${boundary}--`;
        } else {
            const messageParts = [
                `From: ${envConfig.GOOGLE_SENDER_EMAIL}`,
                `To: ${to}`,
                'Content-Type: text/html; charset=UTF-8',
                'MIME-Version: 1.0',
                `Subject: ${subject}`,
                '',
                html || text,
            ];
            message = messageParts.join('\n');
        }

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        return {
            success: true,
            messageId: response.data.id,
            message: 'email sent successfully to ' + to,
        };
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
        return 'Failed to send email to ' + to;
    }
};