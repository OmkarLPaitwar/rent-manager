const mongoose = require('mongoose');

const maintenanceEntrySchema = new mongoose.Schema({
  tenant:     { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  tenantName: { type: String },
  amount:     { type: Number, required: true },
  notes:      { type: String, trim: true }
});

const maintenanceSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:       { type: Number, required: true },
  year:        { type: Number, required: true },
  entries:     [maintenanceEntrySchema],
  totalAmount: { type: Number },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

maintenanceSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
