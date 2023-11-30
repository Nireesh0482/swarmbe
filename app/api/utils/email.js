/* eslint-disable global-require */
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const logger = require('./logger');

const { sendGridAPIkey, emailMethod, toolEmail, toolPassword, nodeEnvironment } = require('../../config/config');

// should be removed in production, only for development
const saveEmailToDirectory = (html, recipient, ccMailList) => {
  const fs = require('fs/promises');
  const { nanoid } = require('nanoid');
  const { todayDate } = require('./date');
  const mailFileName = `${todayDate()}_${nanoid(5)}`;
  logger.info({ toMail: recipient, ccMail: ccMailList, file: mailFileName });
  fs.writeFile(`C:/mails/${mailFileName}.html`, html).catch((err) => {
    logger.error('error while sending Mail or processing', err);
  });
  return true;
};

// send Using SendGrid Email Service
if (emailMethod === 'SEND_GRID') {
  const sendGridApiKey = sendGridAPIkey;
  sgMail.setApiKey(sendGridApiKey);
  const sendMail = async (subject, text, html, recipient, attachFile, ccMailList) => {
    const msg = {
      to: recipient,
      from: toolEmail,
      subject,
      text,
      html,
    };
    if (ccMailList) {
      msg.cc = ccMailList;
    }
    if (attachFile) {
      msg.attachments = [attachFile];
    }
    // remove in real production
    if (nodeEnvironment === 'development') {
      return saveEmailToDirectory(html, recipient, ccMailList);
    }

    const mailSent = await sgMail
      .send(msg)
      .then((mailResult) => {
        logger.info(mailResult);
        return true;
      })
      .catch((error) => {
        logger.error(error);
        return false;
      });
    return mailSent;
  };
  module.exports = { sendMail };
}

// NodeMailer Functionality
if (emailMethod === 'NODE_MAILER') {
  const transporter = nodemailer.createTransport({
    // name:'ads4.ad.avinsystems.com',
    host: 'smtp.office365.com', // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: { user: toolEmail, pass: toolPassword },
    tls: { ciphers: 'SSLv3' },
  });

  const sendMail = async (subject, text, html, recipient, attachFile, ccMailList) => {
    const mailOptions = {
      from: toolEmail,
      to: recipient,
      subject,
      text,
      html,
    };
    if (attachFile) {
      mailOptions.attachments = [attachFile];
    }
    if (ccMailList) {
      mailOptions.cc = ccMailList;
    }
    if (nodeEnvironment === 'development') {
      return saveEmailToDirectory(html, recipient, ccMailList);
    }
    const mailSent = await transporter
      .sendMail(mailOptions)
      .then((mailResult) => {
        logger.info(mailResult);
        return true;
      })
      .catch((error) => {
        logger.error(error);
        return false;
      });
    return mailSent;
  };

  module.exports = { sendMail };
}
