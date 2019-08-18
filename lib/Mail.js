const nodemailer = require('nodemailer');

const { emailHost } = require('../config');

const transporter = nodemailer.createTransport({
  // host: 'smtp.buzzfreeze.com',
  // port: 587,
  // secure: false, // secure:true for port 465, secure:false for port 587
  service: 'gmail',
  auth: {
    user: emailHost.email,
    pass: emailHost.password,
  },
});

module.exports = class Mail {
  constructor(params) {
    this.params = params;
  }

  send() {
    const options = {
      from: `"Airportels" <${emailHost.email}>`,
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
