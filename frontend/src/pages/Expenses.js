import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY = {
  title: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Other',
  notes: ''
};

export default function Expenses() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const { show } = useToast();

  const load = () =>
    API.get(`/expenses?month=${month}&year=${year}`)
      .then(r => {
        setExpenses(r.data);
        setLoading(false);
      });

  useEffect(() => {
    setLoading(true);
    load();
  }, [month, year]);

  const handle = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setForm(EMPTY);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (e) => {
    setForm({
      title: e.title,
      amount: e.amount,
      date: e.date.split('T')[0],
      category: e.category,
      notes: e.notes || ''
    });

    setEditing(e._id);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await API.put(`/expenses/${editing}`, form);
        show('✅ Updated');
      } else {
        await API.post('/expenses', form);
        show('✅ Expense added');
      }

      setModal(false);
      load();

    } catch {
      show('❌ Error', 'error');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      await API.delete(`/expenses/${id}`);
      show('🗑️ Deleted');
      load();
    } catch {
      show('❌ Error', 'error');
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">📋 Expenses</div>
          <div className="page-sub">
            {MONTHS[month - 1]} {year} • ₹{total}
          </div>
        </div>

        <button className="btn btn-danger" onClick={openAdd}>
          + Add
        </button>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="mobile-list">
        {loading ? (
          <p>Loading...</p>
        ) : expenses.length === 0 ? (
          <p>No expenses</p>
        ) : (
          expenses.map(e => (
            <div key={e._id} className="mobile-card">

              <div className="mobile-card-header">
                <div>
                  <strong>{e.title}</strong>
                  <div>{new Date(e.date).toLocaleDateString()}</div>
                </div>

                <div style={{ color: 'red', fontWeight: 'bold' }}>
                  ₹{e.amount}
                </div>
              </div>

              <div>{e.category}</div>

              <div className="mobile-card-actions">
                <button onClick={() => openEdit(e)}>Edit</button>
                <button onClick={() => del(e._id)}>Delete</button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={openAdd}>+</button>

    </div>
  );
}