import nodemailer from "nodemailer";

const sendEmail = async ({
  from = process.env.EMAIL,
  to,
  cc,
  bcc,
  fromPrefix = "Company's Email",
  subject,
  text,
  html,
  attachments,
}) => {
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 567,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const emailInfo = await transporter.sendMail({
    from: `'${fromPrefix}' <${from}>`, // sender address
    to, // ['', ''] list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
    cc, // email or list of emails
    bcc,
    attachments,
  
  });
  if(emailInfo.accepted.length){
    return true
  }
  return false
};
export default sendEmail;
