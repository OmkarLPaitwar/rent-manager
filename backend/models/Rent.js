const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant:        { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tenantName:    { type: String, required: true },
  amount:        { type: Number, required: true },
  month:         { type: Number, required: true },
  year:          { type: Number, required: true },
  date:          { type: Date, required: true },
  paymentMethod: { type: String, enum: ['BOB Transfer','Cash','UPI','Other'], default: 'Cash' },
  notes:         { type: String, trim: true },
  createdAt:     { type: Date, default: Date.now }
});

// Compound index — covers all queries by user+month+year
rentSchema.index({ user: 1, year: 1, month: 1 });
rentSchema.index({ user: 1, year: 1 });

module.exports = mongoose.model('Rent', rentSchema);
