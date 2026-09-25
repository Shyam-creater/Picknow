import nodemailer from 'nodemailer';

const sendMail = async (emailData) => {
    // Validate required fields
    if (!emailData || !emailData.to || !emailData.subject || !emailData.html) {
        throw new Error('Missing required email fields: to, subject, and html are required');
    }

    var transporter = nodemailer.createTransport({
        host: 'mail.smtp2go.com',
        port: 465,
        secure: true,
        secureConnection: false,
        auth: {
            user: 'support@picknow.in',
            pass: 'D2CsDhMlh1jtm27P',
            // pass: '575ft',
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    const mailOptions = {
        from: `PICKNOW <support@picknow.in>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed: ' + error.message);
    }
};

export default sendMail; 