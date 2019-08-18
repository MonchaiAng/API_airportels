const nodemailer = require('nodemailer');

const config = require('../config/config.json');

const env = process.env.NODE_ENV || 'production';

const transporter = nodemailer.createTransport(config[env].mailer);

module.exports = class Mail {
  constructor(params) {
    this.params = params;
  }

  send() {
    const options = {
      from: `"Airportels" <${config[env].mailer.auth.user}>`,
      to: this.params.to,
      subject: this.params.subject,
      html: this.params.html,
    };
    transporter.sendMail(options, (err, suc) => {
      if (err) {
        this.params.errorCallback(err);
      } else {
        this.params.successCallback(suc);
      }
    });
  }
};
