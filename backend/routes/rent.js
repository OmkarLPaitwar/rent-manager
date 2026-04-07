const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rent = require('../models/Rent');

// Get rent by month/year
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user._id };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    const rents = await Rent.find(filter).sort({ date: 1 });
    res.json(rents);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add rent payment
router.post('/', auth, async (req, res) => {
  try {
    const { tenantId, tenantName, amount, date, paymentMethod, notes } = req.body;
    const d = new Date(date);
    const rent = new Rent({
      user: req.user._id,
      tenant: tenantId,
      tenantName,
      amount,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      date: d,
      paymentMethod,
      notes
    });
    await rent.save();
    res.status(201).json(rent);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update rent
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.date) {
      const d = new Date(req.body.date);
      updateData.month = d.getMonth() + 1;
      updateData.year = d.getFullYear();
    }
    const rent = await Rent.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );
    if (!rent) return res.status(404).json({ message: 'Rent not found' });
    res.json(rent);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete rent
router.delete('/:id', auth, async (req, res) => {
  try {
    const rent = await Rent.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!rent) return res.status(404).json({ message: 'Rent not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
