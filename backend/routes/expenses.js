const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// Get expenses by month/year
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user._id };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    const expenses = await Expense.find(filter).sort({ date: 1 });
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, date } = req.body;

    if (!title || !amount || !date) {
      return res.status(400).json({ message: 'Title, amount and date are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: 'Invalid date provided' });
    }

    const expense = new Expense({
      ...req.body,
      user: req.user._id,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      date: d
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.amount !== undefined && parseFloat(req.body.amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (req.body.date) {
      const d = new Date(req.body.date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid date provided' });
      }
      updateData.month = d.getMonth() + 1;
      updateData.year = d.getFullYear();
      updateData.date = d;
    }
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
