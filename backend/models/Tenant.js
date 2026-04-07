const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  unitType: { type: String, enum: ['1BHK', '1RK', 'Room', 'Shop', 'Other'], default: '1BHK' },
  unitLabel: { type: String, trim: true }, // e.g. "Front", "Back", "First Floor"
  monthlyRent: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['BOB Transfer', 'Cash', 'UPI', 'Other'], default: 'Cash' },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tenant', tenantSchema);
