# Splitwise Clone MVP
A full-stack group expense tracker featuring real-time Socket.io chat, dynamic pairwise balancing without graph simplification drift, and rigorous 4-method splitting math.

### Features
- JWT Secure Authentication
- Group Management & Administrative Membership Roles
- Precise 4-Type Expense Splitting (Equal, Unequal, Percent, Share)
- Dynamic Pairwise State Balances (Strict calculation natively bypassing generic global approximations)
- Active Settlement assertions over-payment protections
- Real-time Expense Websocket Chat histories

### Tech Stack
* **Frontend:** React 18 (Vite), Tailwind CSS, Socket.io-client, Axios, React Router, Context API
* **Backend:** Node.js, Express, Prisma ORM (v6), Socket.io, JSON Web Token (JWT)
* **Database:** PostgreSQL (Neon)

## Installation & Local Setup

### Dependencies
Execute `npm install` gracefully inside both `/backend` and `/frontend`.

### Environment Strategy
Build exactly one distinct `.env` string internally attached across the `/backend` folder pointing specifically:
```env
PORT=5000
JWT_SECRET=your_jwt_strong_secret
DATABASE_URL=postgresql://neondb_owner:YOUR_PASS@ep-...us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Running Locally
- Backend: Run `npm start` natively binding `src/server.js` to `http://localhost:5000`.
- Frontend: Run `npm run dev` linking dynamically against Vite resolving on `http://localhost:5173`.

### Remote Deployment Mapping
1. Distribute Backend structures toward **Render** directly asserting Root Node allocations and specific `DATABASE_URL` configurations yielding standard express listen ports smoothly.
2. Synchronize external **Neon PostgreSQL** cluster connections natively tracking raw database mutations seamlessly without schema drifts.
3. Allocate Frontend components up to **Vercel** mapping internal Axios interceptors dynamically switching across Production REST constraints structurally securely.
