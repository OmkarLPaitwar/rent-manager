const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rent = require('../models/Rent');
const Expense = require('../models/Expense');
const LightBill = require('../models/LightBill');
const Tenant = require('../models/Tenant');

// ── MONTHLY SUMMARY (single month) ──────────────────────────
router.get('/:year/:month', auth, async (req, res) => {
  try {
    const month = parseInt(req.params.month);
    const year  = parseInt(req.params.year);
    const userId = req.user._id;

    // All 4 queries run in parallel
    const [rents, expenses, lightBill, tenants] = await Promise.all([
      Rent.find({ user: userId, month, year }).sort({ date: 1 }).lean(),
      Expense.find({ user: userId, month, year }).sort({ date: 1 }).lean(),
      LightBill.findOne({ user: userId, month, year }).lean(),
      Tenant.find({ user: userId, isActive: true }).lean(),
    ]);

    const totalRent     = rents.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    let bobTotal = 0, cashTotal = 0, upiTotal = 0;
    for (const r of rents) {
      if (r.paymentMethod === 'BOB Transfer') bobTotal += r.amount;
      else if (r.paymentMethod === 'Cash')    cashTotal += r.amount;
      else if (r.paymentMethod === 'UPI')     upiTotal  += r.amount;
    }

    res.json({
      month, year, rents, expenses, lightBill, tenants,
      summary: { totalRent, totalExpenses, balance: totalRent - totalExpenses, bobTotal, cashTotal, upiTotal }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── YEARLY OVERVIEW — ONE query per collection instead of 12 loops ──
router.get('/yearly/:year', auth, async (req, res) => {
  try {
    const year   = parseInt(req.params.year);
    const userId = req.user._id;

    // Fetch ALL rents and expenses for the year in just 2 queries
    const [allRents, allExpenses] = await Promise.all([
      Rent.find({ user: userId, year }).select('month amount').lean(),
      Expense.find({ user: userId, year }).select('month amount').lean(),
    ]);

    // Group in memory by month
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalRent: 0,
      totalExpenses: 0,
      balance: 0,
    }));

    for (const r of allRents)    monthly[r.month - 1].totalRent     += r.amount;
    for (const e of allExpenses) monthly[e.month - 1].totalExpenses += e.amount;
    for (const m of monthly)     m.balance = m.totalRent - m.totalExpenses;

    res.json({ year, monthly });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── HISTORY OVERVIEW (last N months) ──────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 6;
    const userId = req.user._id;
    
    const now = new Date();
    const monthsList = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsList.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    // Fetch everything for the relevant range in parallel
    const start = monthsList[monthsList.length - 1];
    const end = monthsList[0];

    // More efficient: Fetch all matching months in one go
    const [allRents, allExpenses, allBills, allTenants] = await Promise.all([
      Rent.find({ user: userId, year: { $gte: start.year, $lte: end.year } }).lean(),
      Expense.find({ user: userId, year: { $gte: start.year, $lte: end.year } }).lean(),
      LightBill.find({ user: userId, year: { $gte: start.year, $lte: end.year } }).lean(),
      Tenant.find({ user: userId, isActive: true }).lean(),
    ]);

    // Group by month/year in memory
    const history = monthsList.map(({ month, year }) => {
      const rents = allRents.filter(r => r.month === month && r.year === year);
      const expenses = allExpenses.filter(e => e.month === month && e.year === year);
      const lightBill = allBills.find(b => b.month === month && b.year === year) || null;

      const totalRent = rents.reduce((s, r) => s + r.amount, 0);
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      
      let bobTotal = 0, cashTotal = 0, upiTotal = 0;
      for (const r of rents) {
        if (r.paymentMethod === 'BOB Transfer') bobTotal += r.amount;
        else if (r.paymentMethod === 'Cash')    cashTotal += r.amount;
        else if (r.paymentMethod === 'UPI')     upiTotal  += r.amount;
      }

      return {
        month, year, rents, expenses, lightBill, tenants,
        summary: { totalRent, totalExpenses, balance: totalRent - totalExpenses, bobTotal, cashTotal, upiTotal }
      };
    });

    res.json(history);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
