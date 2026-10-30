# Queue Management App

A full-stack web application that lets a Queue Manager create queues, add people, manage token order, serve or cancel tokens, and view analytics — all from one clean dashboard.

Built with **React.js**, **Node.js**, **Express**, and **MongoDB**.

---

## Features

- Manager login and registration
- Create multiple named queues
- Add people to a queue — each person gets an auto-generated token number
- Move tokens up or down in the queue
- Serve the next person with one click
- Cancel any token
- Analytics dashboard — average wait time, daily activity chart, peak hours chart

---

## Tech Stack

- **Frontend** — React.js, Tailwind CSS, Recharts, Vite
- **Backend** — Node.js, Express.js
- **Database** — MongoDB, Mongoose
- **Auth** — JWT + bcrypt

---

## Prerequisites

Make sure you have these installed before running the project:

**Node.js v18+**
Download and install from https://nodejs.org
Verify with: `node -v`

**MongoDB**
Download and install from https://www.mongodb.com/try/download/community
Follow the installation guide for your OS (Windows / macOS / Linux).
Verify with: `mongod --version`

---

## How to Run

### 1. Start MongoDB

Make sure your MongoDB server is running.

- **Windows** — Search for "MongoDB" in Services and start it, or run `mongod` in a terminal
- **macOS / Linux** — Run `mongod` in a terminal, or use your system's service manager

### 2. Set up the environment file

The `.env` file is not included in the repo for security reasons. You need to create it manually.

Inside the `backend` folder, create a file named `.env` and paste the following:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/queue-management
JWT_SECRET=queue-manager-super-secret-change-in-production
```

> A reference file `backend/.env.example` is included in the repo with the same content — you can just copy and rename it to `.env`.

### 3. Start the backend

Open a terminal inside the project folder and run:

```bash
cd backend
npm install
npm run dev
```

Backend runs on **http://localhost:5000**

### 4. Start the frontend

Open a **new terminal** in the project folder and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

### 5. Open the app

Go to **http://localhost:3000** in your browser.

---

## How to Use

1. **Register** a new manager account
2. **Create a queue** — give it any name (e.g. "Counter A")
3. Click **Manage** to open the queue
4. **Add people** using the form — each person gets a token number
5. Use **↑ ↓** buttons to reorder people in the queue
6. Click **Serve Next** to serve the first person
7. Click **Cancel** to remove anyone from the queue
8. Click **Analytics** to view the dashboard

---

## Project Structure

```
queue/
├── backend/
│   ├── config/         → MongoDB connection
│   ├── controllers/    → Business logic (auth, queues, tokens, analytics)
│   ├── middleware/     → JWT auth check
│   ├── models/         → User, Queue, Token schemas
│   ├── routes/         → API route definitions
│   └── server.js       → Entry point
│
└── frontend/
    └── src/
        ├── api/        → Axios instance with JWT interceptor
        ├── components/ → Navbar, ProtectedRoute
        ├── context/    → Auth state (login, logout, register)
        └── pages/      → Login, Register, Queues, QueueDetail, Dashboard
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a manager |
| POST | `/api/auth/login` | Login |
| GET | `/api/queues` | Get all queues |
| POST | `/api/queues` | Create a queue |
| GET | `/api/queues/:id` | Get queue with tokens |
| DELETE | `/api/queues/:id` | Delete a queue |
| POST | `/api/queues/:queueId/tokens` | Add person to queue |
| GET | `/api/queues/:queueId/analytics` | Get analytics |
| PATCH | `/api/tokens/:id/move` | Move token up or down |
| PATCH | `/api/tokens/:id/serve` | Serve a token |
| PATCH | `/api/tokens/:id/cancel` | Cancel a token |
