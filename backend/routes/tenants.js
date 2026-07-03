const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const Rent = require('../models/Rent');
const LightBill = require('../models/LightBill');
const Maintenance = require('../models/Maintenance');

// Get all ACTIVE tenants for user (exclude soft-deleted)
router.get('/', auth, async (req, res) => {
  try {
    const tenants = await Tenant.find({ user: req.user._id, isDeleted: { $ne: true } }).sort({ name: 1 });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all DELETED (former) tenants — MUST be before /:id
router.get('/deleted', auth, async (req, res) => {
  try {
    const tenants = await Tenant.find({
      user: req.user._id,
      isDeleted: true
    }).sort({ deletedAt: -1 });
    res.json(tenants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get complete history for a single tenant (works for active & deleted)
router.get('/:id/history', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, user: req.user._id });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // All rent payments for this tenant
    const rentPayments = await Rent.find({ user: req.user._id, tenant: tenant._id })
      .sort({ date: -1 });

    // All light bill entries where this tenant appears
    const allBills = await LightBill.find({ user: req.user._id }).sort({ year: -1, month: -1 });
    const lightBillEntries = [];
    allBills.forEach(bill => {
      const entry = bill.entries.find(e => 
        (e.tenant && e.tenant.toString() === tenant._id.toString()) || 
        (e.sharedTenants && e.sharedTenants.some(t => t.toString() === tenant._id.toString()))
      );
      if (entry) {
        let tenantCount = 1;
        if (entry.sharedTenants && entry.sharedTenants.length > 0) {
          tenantCount = entry.sharedTenants.length;
        }

        lightBillEntries.push({
          month: bill.month,
          year: bill.year,
          unitLabel: entry.unitLabel,
          previousReading: entry.previousReading,
          currentReading: entry.currentReading,
          unitsConsumed: entry.unitsConsumed,
          ratePerUnit: entry.ratePerUnit,
          amount: entry.amount / tenantCount,
          isShared: tenantCount > 1
        });
      }
    });

    // All maintenance entries for this tenant
    const allMaintenance = await Maintenance.find({ user: req.user._id, 'entries.tenant': tenant._id })
      .sort({ year: -1, month: -1 });
    const maintenanceEntries = [];
    allMaintenance.forEach(m => {
      const entry = m.entries.find(e => e.tenant && e.tenant.toString() === tenant._id.toString());
      if (entry) {
        maintenanceEntries.push({ month: m.month, year: m.year, amount: entry.amount, notes: entry.notes });
      }
    });

    // Aggregate stats
    const totalRentPaid = rentPayments.reduce((s, r) => s + r.amount, 0);
    const totalLightBillPaid = lightBillEntries.reduce((s, e) => s + (e.amount || 0), 0);
    const totalMaintenancePaid = maintenanceEntries.reduce((s, e) => s + (e.amount || 0), 0);

    res.json({
      tenant,
      rentPayments,
      lightBillEntries,
      maintenanceEntries,
      stats: {
        totalRentPaid,
        totalLightBillPaid,
        totalMaintenancePaid,
        totalPaid: totalRentPaid + totalLightBillPaid + totalMaintenancePaid,
        rentPaymentsCount: rentPayments.length,
      }
    });
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
    // Never allow PUT to accidentally clear isDeleted
    const { isDeleted, deletedAt, ...safeBody } = req.body;
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: safeBody },
      { new: true, runValidators: true } // Enabled validation
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Soft-delete tenant (preserves all data & history)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date(), isActive: false } },
      { new: true, runValidators: false }
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found or already removed' });
    res.json({ message: 'Tenant moved to former tenants', tenant });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Data Migration Route — Use this to update existing data to the new schema
router.post('/migrate-data', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    let totalTenantsUpdated = 0;
    
    // 1. Update Tenants: Set defaults for missing critical fields
    const r1 = await Tenant.updateMany(
      { user: userId, unitType: { $exists: false } },
      { $set: { unitType: '1BHK', paymentMethod: 'Cash', isActive: true, isDeleted: false } }
    );
    totalTenantsUpdated += r1.modifiedCount;

    const r2 = await Tenant.updateMany(
      { user: userId, isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    totalTenantsUpdated += r2.modifiedCount;

    const r3 = await Tenant.updateMany(
      { user: userId, isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    totalTenantsUpdated += r3.modifiedCount;

    // 2. Update Rent: Set default paymentMethod
    const rentResult = await Rent.updateMany(
      { user: userId, paymentMethod: { $exists: false } },
      { $set: { paymentMethod: 'Cash' } }
    );

    // 3. Update LightBills: Ensure ratePerUnit exists in entries
    const bills = await LightBill.find({ user: userId });
    let billsUpdated = 0;
    for (const bill of bills) {
      let changed = false;
      if (bill.entries && Array.isArray(bill.entries)) {
        bill.entries.forEach(entry => {
          if (entry.ratePerUnit === undefined || entry.ratePerUnit === null) {
            entry.ratePerUnit = 12;
            changed = true;
          }
        });
      }
      if (changed) {
        await bill.save();
        billsUpdated++;
      }
    }

    res.json({
      message: 'Migration completed successfully',
      tenantsUpdated: totalTenantsUpdated,
      rentRecordsUpdated: rentResult.modifiedCount,
      lightBillsUpdated: billsUpdated,
      details: `Processed tenants, rent payments, and light bills for user ${req.user.email}`
    });
  } catch (err) {
    console.error('Migration Error:', err);
    res.status(500).json({ message: 'Migration failed: ' + err.message });
  }
});

module.exports = router;
