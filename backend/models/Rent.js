const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tenantName: { type: String, required: true }, // denormalized for reports
  amount: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['BOB Transfer', 'Cash', 'UPI', 'Other'], default: 'Cash' },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rent', rentSchema);
