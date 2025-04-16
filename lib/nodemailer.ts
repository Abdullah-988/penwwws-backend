import nodemailer from "nodemailer";

type sendMailProps = {
  subject: string;
  email: string;
  html: string;
};

export async function sendMail({ subject, email, html }: sendMailProps) {
  const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `Penwwws <${process.env.NODEMAILER_EMAIL_ALIAS}>`,
    to: email,
    subject,
    html,
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err: any, response: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}
