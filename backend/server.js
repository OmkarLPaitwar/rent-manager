const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/rent', require('./routes/rent'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/lightbill', require('./routes/lightbill'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Rent Manager API Running' }));

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
