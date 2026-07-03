# 📋 MatriEntry — Matrimonial Data Entry Software

A full-stack, production-ready matrimonial profile data entry portal with role-based access control, live countdown timers, and real-time admin monitoring.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (Access Token 15min + Refresh Token 7 days via httpOnly cookie) |
| Forms | React Hook Form + Zod validation |
| State | TanStack Query |

---

## 📁 Project Structure

```
jolly-goodall/
├── backend/              # Express.js REST API
│   ├── src/
│   │   ├── config/       # MongoDB connection
│   │   ├── models/       # User, DataEntry, ActivityLog schemas
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # JWT auth, error handler
│   │   └── utils/        # Token & password helpers
│   ├── scripts/
│   │   └── seedAdmin.js  # Seeds master admin account
│   ├── .env.example
│   └── server.js
└── frontend/             # Next.js 14 app
    └── src/
        ├── app/          # Pages (login, admin/*, user/*)
        ├── components/   # Reusable components
        ├── context/      # AuthContext
        ├── hooks/        # useAuth, useCountdown
        └── lib/          # API client (axios), utils
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB** — Either:
  - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas (Free Tier)](https://www.mongodb.com/atlas)
- **npm** v8+

---

### Step 1 — Set Up Backend

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create your .env file
copy .env.example .env
```

Open `.env` and fill in your values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/matrimonial_db
JWT_ACCESS_SECRET=change_this_to_a_long_random_secret_key_1
JWT_REFRESH_SECRET=change_this_to_a_different_long_random_secret_2
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
```

> 💡 **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string, e.g.:
> `mongodb+srv://username:password@cluster.mongodb.net/matrimonial_db`

```bash
# 4. Seed the Master Admin account
npm run seed

# Output: ✅ Admin user created: admin / Admin@123

# 5. Start the backend server
npm run dev

# Output: 🚀 Server running on port 5000
#          ✅ MongoDB connected
```

---

### Step 2 — Set Up Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (already done if you followed setup)
npm install

# Start the frontend dev server
npm run dev

# Output: ready - started server on http://localhost:3000
```

---

### Step 3 — Access the Application

Open your browser: **http://localhost:3000**

| Role | URL | Credentials |
|------|-----|-------------|
| Master Admin | http://localhost:3000/login | `admin` / `Admin@123` |
| Data Entry User | http://localhost:3000/login | (Created by admin) |

> ⚠️ **Change the admin password** immediately after first login!

---

## 👤 User Roles

### Master Admin
- Create / edit / delete data entry users
- Set assigned record count per user
- Extend user expiry dates
- View / edit / delete all submitted entries
- Export all data to CSV
- Live monitoring dashboard

### Data Entry User
- Login with credentials created by admin
- **24-day timer** starts on first login
- Fill assigned record slots from PDF
- View personal progress and profile
- Save drafts or submit entries

---

## ⏱️ 24-Day Access Timer

- Timer starts **only on first login** (not account creation)
- Stored in DB as `firstLoginAt` and `expiryAt = firstLoginAt + 24 days`
- Accurate across devices and logout/login cycles
- **Color coded**: Green (>7 days) → Amber (3-7 days) → Red pulsing (<3 days)
- On expiry: account automatically deactivated

---

## 🔌 API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/login` | Login, get JWT |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout |

### Admin — `/api/admin` (admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/users` | List / create users |
| GET/PUT/DELETE | `/users/:id` | View / edit / delete user |
| POST | `/users/:id/reset-password` | Reset user password |
| PUT | `/users/:id/extend-expiry` | Add days to expiry |
| PUT | `/users/:id/toggle-active` | Activate / deactivate |
| PUT | `/users/:id/assigned-count` | Change assigned slots |
| GET | `/entries` | All entries (search, filter, paginate) |
| PUT | `/entries/:id` | Edit any entry |
| DELETE | `/entries/:id` | Reset entry to blank |
| GET | `/entries/export` | Download CSV |
| GET | `/monitoring` | Live user progress |
| GET | `/dashboard` | Dashboard stats |

### User — `/api/user` (authenticated users)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | User dashboard stats |
| GET | `/profile` | User profile |
| GET | `/entries` | User's entries (paginated) |
| GET | `/entries/current` | Next slot to fill |
| GET | `/entries/progress` | Completion counts |
| PUT | `/entries/:id` | Submit / save draft |

---

## 🗄️ MongoDB Schemas

### User
```
fullName, username (unique), passwordHash, mobileNumber, email
role: 'admin' | 'user'
assignedCount, isActive
firstLoginAt, expiryAt (set on first login)
```

### DataEntry
```
slotNumber (1 to N per user), userId (ref User)
profileId (typed from PDF, unique per user)
name, age, gender, caste, religion
education, occupation, annualIncome
city, state, mobileNumber
maritalStatus, height, additionalNotes
status: 'blank' | 'draft' | 'submitted'
submittedAt, lastEditedAt, editedByAdmin
```

### ActivityLog
```
userId, action, metadata, ipAddress
createdAt (auto-deleted after 90 days)
```

---

## 🔒 Security Features

- JWT with 15-minute access tokens + 7-day refresh tokens (httpOnly cookie)
- bcrypt password hashing (salt rounds: 12)
- Rate limiting: 10 requests per 15 minutes on auth endpoints
- Role-based access control on all routes
- Automatic account deactivation on expiry
- Express-validator input validation on all inputs

---

## 📱 Cross-Platform Support

The app is a web application that runs in any browser. For native apps:
- **Android APK**: Use [Capacitor](https://capacitorjs.com/) or [TWA (Trusted Web Activity)](https://developer.chrome.com/docs/android/trusted-web-activity)
- **Windows app**: Use [Tauri](https://tauri.app/) or [Electron](https://electronjs.org/)
- **Mac app**: Use [Tauri](https://tauri.app/) or package as [macOS app](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- **PWA**: Add manifest.json and service worker (future upgrade)

---

## 🛠️ Common Issues

### MongoDB connection failed
- Ensure MongoDB is running: `mongod --dbpath C:\data\db` (Windows)
- For Atlas: check your IP is whitelisted in Atlas Network Access

### Port already in use
- Backend uses port 5000. Change `PORT` in `.env` if needed.
- Frontend uses port 3000. Run `npm run dev -- -p 3001` to use a different port.

### ShadCN components missing
```bash
cd frontend
npx shadcn@latest add [component-name]
```

---

## 📦 Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Set `NODE_ENV=production` in backend `.env`
3. Use [PM2](https://pm2.keymetrics.io/) to run backend: `pm2 start server.js`
4. Serve frontend with Nginx or deploy to [Vercel](https://vercel.com)
5. Use [MongoDB Atlas](https://mongodb.com/atlas) for database

---

## 👨‍💻 Default Credentials

| | Value |
|--|--|
| Username | `admin` |
| Password | `Admin@123` |

**⚠️ Change this password immediately after first login!**
