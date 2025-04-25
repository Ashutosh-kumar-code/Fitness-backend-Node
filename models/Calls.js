// models/Call.js
const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { type: String, enum: ['ongoing', 'completed', 'missed'], default: 'ongoing' },
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema);
