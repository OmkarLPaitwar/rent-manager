# 🏠 Rent & Expense Manager — MERN Stack

A full-featured property management app to track rent payments, expenses, light bills, and generate PDF reports.

---

## 🚀 Features
- ✅ Multi-user login/register (JWT sessions)
- ✅ Tenant management (add/edit/deactivate)
- ✅ Rent payment tracking (BOB Transfer / Cash / UPI)
- ✅ Pending rent alerts
- ✅ Expense tracking with categories
- ✅ Light bill calculator (prev/curr reading × rate)
- ✅ Monthly PDF report download
- ✅ Yearly charts and analytics
- ✅ Mobile responsive

---

## 📁 Project Structure

```
rent-manager/
├── backend/           Node.js + Express API
│   ├── models/        Mongoose schemas
│   ├── routes/        API endpoints
│   ├── middleware/    JWT auth guard
│   └── server.js
├── frontend/          React app
│   ├── src/
│   │   ├── pages/     Dashboard, Tenants, Rent, Expenses, LightBill, Summary, Yearly
│   │   ├── components/ Layout, Toast
│   │   ├── context/   AuthContext
│   │   └── utils/     api.js, pdfExport.js
└── render.yaml        Render.com config
```

---

## ⚙️ Local Development Setup

### Step 1: Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Edit with your MongoDB URI

# Frontend
cd ../frontend
npm install
```

### Step 2: Set up MongoDB (Free)
1. Go to https://cloud.mongodb.com → Create free account
2. Create a **Free M0 Cluster**
3. Create a database user (username + password)
4. Whitelist IP: 0.0.0.0/0 (allow all — for development)
5. Get connection string → paste in backend `.env`:
   ```
   MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/rent-manager
   JWT_SECRET=any_random_secret_string_here
   ```

### Step 3: Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev     # runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm start       # runs on http://localhost:3000
```

---

## 🌐 Free Deployment

### Backend → Render.com (Free)

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = your Atlas URI
   - `JWT_SECRET` = any random string
   - `FRONTEND_URL` = your Vercel URL (add after step below)
6. Deploy → copy your URL: `https://rent-manager-xxxx.onrender.com`

> ⚠️ Free Render instances sleep after 15min. First request takes ~30sec to wake up. Upgrade to $7/month to avoid this.

### Frontend → Vercel (Free)

1. Go to https://vercel.com → Import GitHub repo
2. Framework: Create React App
3. Root Directory: `frontend`
4. Environment Variable:
   - `REACT_APP_API_URL` = `https://your-render-url.onrender.com/api`
5. Deploy → you get: `https://rent-manager.vercel.app`

---

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/tenants | List tenants |
| POST | /api/tenants | Add tenant |
| GET | /api/rent?month=&year= | Get rent payments |
| POST | /api/rent | Add rent payment |
| GET | /api/expenses?month=&year= | Get expenses |
| POST | /api/expenses | Add expense |
| GET | /api/lightbill?month=&year= | Get light bill |
| POST | /api/lightbill | Save light bill |
| GET | /api/summary/:year/:month | Monthly summary |
| GET | /api/summary/yearly/:year | Yearly overview |

---

## 🔒 Security Notes
- Each user can ONLY see their own data
- Passwords are hashed with bcrypt
- JWT tokens expire in 30 days
- Never commit your `.env` file to Git!
- Add `.env` to `.gitignore`

---

## 🆙 Future Improvements (Optional)
- [ ] SMS/WhatsApp rent reminders
- [ ] Tenant portal (tenants see their own receipts)
- [ ] Image/receipt attachments
- [ ] Multi-property support
- [ ] Export to Excel
- [ ] Recurring expense templates
