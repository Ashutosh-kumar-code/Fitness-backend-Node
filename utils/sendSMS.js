const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = (to, message) => {
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        body: message,
        to: to,  // Phone number to send the SMS to
        from: process.env.TWILIO_PHONE_NUMBER, // Twilio phone number (purchased from Twilio)
      })
      .then((message) => resolve(message))
      .catch((err) => reject(err));
  });
};

module.exports = sendSMS;
