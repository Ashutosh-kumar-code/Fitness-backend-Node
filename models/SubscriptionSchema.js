// models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  razorpay_signature: { type: String, required: true },
  razorpay_payment_id: { type: String, required: true },
  razorpay_order_id: { type: String, required: true },
  type: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});


module.exports = mongoose.model('Subscription', SubscriptionSchema);


// const SubscriptionSchema = new mongoose.Schema({
//   razorpay_signature: { type: String, required: true },
//   razorpay_payment_id: { type: String, required: true },
//   razorpay_order_id: { type: String, required: true },
//   type: { type: String, required: true },
//   expiresAt: { type: Date, required: true },
//   trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// });
