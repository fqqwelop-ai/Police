const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  officer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
  type: { type: String, enum: ['يومي', 'حادثة', 'دورية', 'إداري'], default: 'يومي' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', default: null },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
