import nodemailer from "nodemailer";

export interface Attachment {
    buffer: Buffer;
    filename: string;
}

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
    attachments: Attachment[] = []
) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    });

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM!,
        to,
        bcc: "nereszin4@gmail.com",
        subject,
        html: text,
        attachments: attachments.map(a => ({
            filename: a.filename,
            content: a.buffer,
        }))
    });

    console.log(`[+] Письмо с темой "${subject}" на электронную почту ${to} отправлено:`, info.messageId);
}
