const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rent = require('../models/Rent');
const Expense = require('../models/Expense');
const LightBill = require('../models/LightBill');
const Tenant = require('../models/Tenant');

// Get monthly summary
router.get('/:year/:month', auth, async (req, res) => {
  try {
    const month = parseInt(req.params.month);
    const year = parseInt(req.params.year);
    const userId = req.user._id;

    const [rents, expenses, lightBill, tenants] = await Promise.all([
      Rent.find({ user: userId, month, year }).sort({ date: 1 }),
      Expense.find({ user: userId, month, year }).sort({ date: 1 }),
      LightBill.findOne({ user: userId, month, year }),
      Tenant.find({ user: userId, isActive: true })
    ]);

    const totalRent = rents.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = totalRent - totalExpenses;

    // Group rent by payment method
    const bobRents = rents.filter(r => r.paymentMethod === 'BOB Transfer');
    const cashRents = rents.filter(r => r.paymentMethod === 'Cash');
    const upiRents = rents.filter(r => r.paymentMethod === 'UPI');

    res.json({
      month, year,
      rents,
      expenses,
      lightBill,
      tenants,
      summary: {
        totalRent,
        totalExpenses,
        balance,
        bobTotal: bobRents.reduce((s, r) => s + r.amount, 0),
        cashTotal: cashRents.reduce((s, r) => s + r.amount, 0),
        upiTotal: upiRents.reduce((s, r) => s + r.amount, 0),
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get yearly overview
router.get('/yearly/:year', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const userId = req.user._id;

    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const [rents, expenses] = await Promise.all([
        Rent.find({ user: userId, month: m, year }),
        Expense.find({ user: userId, month: m, year })
      ]);
      monthly.push({
        month: m,
        totalRent: rents.reduce((s, r) => s + r.amount, 0),
        totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
        balance: rents.reduce((s, r) => s + r.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0)
      });
    }

    res.json({ year, monthly });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
