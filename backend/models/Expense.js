const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  date: { type: Date, required: true },
  category: {
    type: String,
    enum: ['Maintenance', 'Utilities', 'Travel', 'Installment', 'Insurance', 'Tax', 'Other'],
    default: 'Other'
  },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
