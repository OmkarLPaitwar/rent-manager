const mongoose = require('mongoose');

const lightBillEntrySchema = new mongoose.Schema({
  unitLabel: { type: String, required: true }, // "1BHK Front", "1BHK Back", etc.
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  tenantName: { type: String },
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  unitsConsumed: { type: Number },
  ratePerUnit: { type: Number, required: true, default: 12 },
  amount: { type: Number }
});

lightBillEntrySchema.pre('save', function(next) {
  this.unitsConsumed = this.currentReading - this.previousReading;
  this.amount = this.unitsConsumed * this.ratePerUnit;
  next();
});

const lightBillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  entries: [lightBillEntrySchema],
  totalUnits: { type: Number },
  totalAmount: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LightBill', lightBillSchema);
