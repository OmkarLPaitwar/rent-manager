const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LightBill = require('../models/LightBill');

// Get light bill by month/year
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const bill = await LightBill.findOne({ user: req.user._id, month: parseInt(month), year: parseInt(year) });
    res.json(bill);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Save/Update light bill
router.post('/', auth, async (req, res) => {
  try {
    const { month, year, entries } = req.body;

    if (!month || !year || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Month, year and entries array are required' });
    }

    // Calculate totals
    const processedEntries = entries.map(e => ({
      ...e,
      unitsConsumed: (e.currentReading || 0) - (e.previousReading || 0),
      amount: ((e.currentReading || 0) - (e.previousReading || 0)) * (e.ratePerUnit || 12)
    }));

    const totalUnits = processedEntries.reduce((s, e) => s + e.unitsConsumed, 0);
    const totalAmount = processedEntries.reduce((s, e) => s + e.amount, 0);

    const bill = await LightBill.findOneAndUpdate(
      { user: req.user._id, month: parseInt(month), year: parseInt(year) },
      { user: req.user._id, month: parseInt(month), year: parseInt(year), entries: processedEntries, totalUnits, totalAmount, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(bill);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete light bill
router.delete('/:month/:year', auth, async (req, res) => {
  try {
    await LightBill.findOneAndDelete({ user: req.user._id, month: parseInt(req.params.month), year: parseInt(req.params.year) });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
