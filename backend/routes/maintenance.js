const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Maintenance = require('../models/Maintenance');

// Get maintenance by month/year
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const record = await Maintenance.findOne({ user: req.user._id, month: parseInt(month), year: parseInt(year) });
    res.json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Save/Update maintenance
router.post('/', auth, async (req, res) => {
  try {
    const { month, year, entries } = req.body;

    if (!month || !year || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Month, year and entries array are required' });
    }

    const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    const record = await Maintenance.findOneAndUpdate(
      { user: req.user._id, month: parseInt(month), year: parseInt(year) },
      { user: req.user._id, month: parseInt(month), year: parseInt(year), entries, totalAmount, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    console.error('Maintenance Save Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete maintenance
router.delete('/:month/:year', auth, async (req, res) => {
  try {
    await Maintenance.findOneAndDelete({ user: req.user._id, month: parseInt(req.params.month), year: parseInt(req.params.year) });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
