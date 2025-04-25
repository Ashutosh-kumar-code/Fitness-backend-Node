const Razorpay = require('razorpay');
require('dotenv').config();

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_p69Op3ruUEKuzy',
    key_secret: 'aBlmby0CKBz0EOLozrLhYMSS'
});

module.exports = razorpayInstance;

// RAZORPAY_KEY_ID=rzp_test_p69Op3ruUEKuzy
// RAZORPAY_KEY_SECRET=aBlmby0CKBz0EOLozrLhYMSS