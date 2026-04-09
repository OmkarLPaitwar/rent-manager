import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_FORM = {
  tenantId: '',
  tenantName: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  notes: ''
};

const methodBadge = (m) => {
  const cls =
    m === 'BOB Transfer' ? 'badge-bob' :
    m === 'Cash' ? 'badge-cash' :
    m === 'UPI' ? 'badge-upi' :
    'badge-other';

  return <span className={`badge ${cls}`}>{m}</span>;
};

export default function RentPayments() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rents, setRents] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const { show } = useToast();

  const loadRents = () =>
    API.get(`/rent?month=${month}&year=${year}`)
      .then(r => {
        setRents(r.data);
        setLoading(false);
      });

  useEffect(() => {
    setLoading(true);
    loadRents();
  }, [month, year]);

  useEffect(() => {
    API.get('/tenants')
      .then(r => setTenants(r.data.filter(t => t.isActive)));
  }, []);

  const handle = (e) => {
    const { name, value } = e.target;

    if (name === 'tenantId') {
      const t = tenants.find(t => t._id === value);

      setForm(f => ({
        ...f,
        tenantId: value,
        tenantName: t?.name || '',
        amount: t?.monthlyRent || '',
        paymentMethod: t?.paymentMethod || 'Cash'
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (r) => {
    setForm({
      tenantId: r.tenant,
      tenantName: r.tenantName,
      amount: r.amount,
      date: r.date.split('T')[0],
      paymentMethod: r.paymentMethod,
      notes: r.notes || ''
    });

    setEditing(r._id);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await API.put(`/rent/${editing}`, form);
        show('✅ Updated');
      } else {
        await API.post('/rent', form);
        show('✅ Rent recorded');
      }

      setModal(false);
      loadRents();

    } catch (err) {
      show('❌ Error', 'error');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this payment?')) return;

    try {
      await API.delete(`/rent/${id}`);
      show('🗑️ Deleted');
      loadRents();
    } catch {
      show('❌ Error', 'error');
    }
  };

  const totalRent = rents.reduce((s, r) => s + r.amount, 0);

  return (
    <div>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">💰 Rent Payments</div>
          <div className="page-sub">{MONTHS[month - 1]} {year}</div>
        </div>

        <button className="btn btn-primary" onClick={openAdd}>
          + Add Rent
        </button>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="mobile-list">
        {loading ? (
          <p>Loading...</p>
        ) : rents.length === 0 ? (
          <p>No payments</p>
        ) : (
          rents.map(r => (
            <div key={r._id} className="mobile-card">

              <div className="mobile-card-header">
                <div>
                  <strong>{r.tenantName}</strong>
                  <div>{new Date(r.date).toLocaleDateString()}</div>
                </div>

                <div style={{ fontWeight: 'bold' }}>
                  ₹{r.amount}
                </div>
              </div>

              <div>{methodBadge(r.paymentMethod)}</div>

              <div className="mobile-card-actions">
                <button onClick={() => openEdit(r)}>Edit</button>
                <button onClick={() => del(r._id)}>Delete</button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* FAB BUTTON */}
      <button className="fab" onClick={openAdd}>+</button>

    </div>
  );
}