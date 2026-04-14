const mongoose = require('mongoose');

const lightBillEntrySchema = new mongoose.Schema({
  unitLabel:       { type: String, required: true },
  tenant:          { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  tenantName:      { type: String },
  previousReading: { type: Number, required: true },
  currentReading:  { type: Number, required: true },
  unitsConsumed:   { type: Number },
  ratePerUnit:     { type: Number, required: true, default: 12 },
  amount:          { type: Number }
});

const lightBillSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:       { type: Number, required: true },
  year:        { type: Number, required: true },
  entries:     [lightBillEntrySchema],
  totalUnits:  { type: Number },
  totalAmount: { type: Number },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

lightBillSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('LightBill', lightBillSchema);
