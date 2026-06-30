const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['تجنيد', 'ترقية', 'إجازة', 'استقالة', 'أخرى'], required: true },
  applicantDiscordId: { type: String, required: true },
  applicantUsername: { type: String, required: true },
  answers: [{
    question: String,
    answer: String,
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', default: null },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
