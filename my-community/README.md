# 🛡️ MyCommunity — Gated Society Security & Management Platform

An enterprise-grade, zero-cost (₹0 development fee) gated community platform inspired by MyGate. Built from scratch with **NestJS**, **TypeScript**, **PostgreSQL**, **Prisma**, **Next.js**, and **Flutter**.

---

## 🏗️ Architecture Overview

```text
my-community/
├── docker-compose.yml     # Local PostgreSQL 16 + Redis 7 + Adminer Web GUI
├── .env.example           # Safe environment variables template
├── .gitignore             # Safe Git ignore (no secrets or logs committed)
├── backend/               # NestJS + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma  # PostgreSQL Database Schema with UUIDs & Relations
│   │   └── seed.ts        # Seed script with realistic sample community, flats & visitors
│   └── src/
│       ├── main.ts        # API Bootstrap with Swagger Docs (Port 4000)
│       ├── auth/          # JWT Auth, Bcrypt hashing, Roles Guards
│       ├── communities/   # Society & Multi-tenant data isolation
│       ├── units/         # Blocks, floors, flats & residents directory
│       └── visitors/      # HIGHEST PRIORITY: End-to-end Visitor Lifecycle
├── admin-web/             # Next.js 15 Society Admin & Gate Dashboard (Port 3002)
└── mobile/                # Flutter Cross-Platform Mobile Apps
    ├── resident_app/      # Resident mobile application
    └── guard_app/         # Security guard gate tablet/mobile application
```

---

## ⚡ Zero-Cost Development Guarantees

1. **₹0 Cloud Fees:** Database (PostgreSQL) and background queues (Redis) run locally on your computer via Docker.
2. **₹0 API Charges:** No paid AI credits, no paid SMS gateways, and no paid hosting required during development.
3. **Multi-Tenant Security:** Every unit, resident, and visitor record is strictly isolated by `communityId`.
4. **Permanent Audit Trail:** Every status transition (`PENDING` ➔ `APPROVED` ➔ `CHECKED_IN` ➔ `CHECKED_OUT`) is validated by backend state machines and recorded with UTC timestamps.

---

## 🚀 Quick Start Guide (Step-by-Step for Beginners)

### 1. Start the Database & Redis (Docker)
Ensure Docker Desktop is running, then in a terminal run:
```bash
docker compose up -d
```
* **PostgreSQL:** `localhost:5432` (User: `postgres`, Password: `postgres123`, DB: `my_community_db`)
* **Adminer Web GUI:** Open [http://localhost:8080](http://localhost:8080) to visually view and edit your database in the browser.

---

### 2. Run the Backend API (NestJS)
In a new terminal window:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```
* **Backend API:** [http://localhost:4000](http://localhost:4000)
* **Interactive Swagger API Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

### 3. Run the Admin & Gate Dashboard (Next.js)
In another terminal window:
```bash
cd admin-web
npm install
npm run dev
```
* Open your browser at: **[http://localhost:3002](http://localhost:3002)**

---

## 👥 Pre-Configured Sample Accounts

| Role | Phone | Password | Assigned Unit |
| :--- | :--- | :--- | :--- |
| **Community Admin** | `9999999999` | `password123` | Management Office |
| **Security Guard** | `8888888888` | `password123` | Main Gate 1 |
| **Resident (Owner)** | `7777777777` | `password123` | Tower A - Flat 101 |
| **Resident (Tenant)**| `6666666666` | `password123` | Tower A - Flat 201 |

---

## 🔄 Visitor Management State Machine

```
              ┌───────────────────────────────────────────────┐
              │           Guard Registers Visitor             │
              │              (Status: PENDING)                │
              └───────────────────────┬───────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
         Resident APPROVES                      Resident REJECTS
        (Status: APPROVED)                     (Status: REJECTED)
                   │                                     │
                   ▼                                     ▼
           Guard Checks-In                         Gate Denies
         (Status: CHECKED_IN)                      Entry Logged
                   │
                   ▼
           Guard Checks-Out
        (Status: CHECKED_OUT)
```
