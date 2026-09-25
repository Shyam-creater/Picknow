import nodemailer from 'nodemailer';



const sendMail = async (to, subject, text) => {
   
var transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port:465,
    secure: true,
    secureConnection: false,
    auth: {
        user: 'support@picknow.in',
        pass: 'D2CsDhMlh1jtm27P',
    },
    tls: {
        ciphers: 'SSLv3'
    }
});


    const mailOptions = {
        from: `PICKNOW <${'support@picknow.in'}>`,
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};

export default sendMail; 