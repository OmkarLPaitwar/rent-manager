const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tenant = require('../models/Tenant');

// Get all tenants for user
router.get('/', auth, async (req, res) => {
  try {
    const tenants = await Tenant.find({ user: req.user._id }).sort({ name: 1 });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add tenant
router.post('/', auth, async (req, res) => {
  try {
    const tenant = new Tenant({ ...req.body, user: req.user._id });
    await tenant.save();
    res.status(201).json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update tenant
router.put('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete tenant
router.delete('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Tenant deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
