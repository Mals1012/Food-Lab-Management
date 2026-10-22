# Food Laboratory Management System (FoodLab LIMS)

A professional, full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) Laboratory Information & Quality Management System built for food processing enterprises. 

FoodLab LIMS manages food batch traceability, chemical analysis, microbiological testing, shelf-life and expiry monitoring, regulatory audit trails, and automated Certificate of Analysis (COA) generation.

---

## 🏛 System Architecture

- **Backend**: Node.js & Express.js REST API with JWT authentication and Role-Based Access Control (RBAC).
- **Database**: MongoDB with Mongoose schemas for Batches, Tests, Users, and Audit Logs.
- **Frontend**: React.js (Vite), React Router v7, Axios, and Lucide React icons.
- **Compliance & Auditing**: Immutable audit logging following ISO/IEC 17025 and FDA 21 CFR Part 11 requirements.

---

## 👥 Role-Based Access Control (RBAC)

| Role | Responsibilities & Permissions |
|---|---|
| **Admin** | Full system administration, user management, batch management, QA sign-off, audit log review. |
| **Lab Manager** | Registers batches, assigns tests, oversees laboratory operations, reviews results. |
| **Lab Analyst** | Conducts chemical/microbiological analyses, enters observed parameter data. |
| **Quality Manager** | Reviews test results, authorizes releases, generates Certificates of Analysis (COA), changes batch status (`Approved` / `Rejected`). |
| **Production Staff** | Registers manufacturing lots and product batches, tracks testing progression. |
| **Viewer** | Read-only access to food batches, certificates, and test results. |

---

## 🚀 Quick Start Guide

### Unified Single-Link Deployment (Frontend + Backend on 1 Port)
The application is pre-configured to serve both the React client and the Express REST API simultaneously from **one single URL**:

👉 **[http://localhost:5000](http://localhost:5000)**

```bash
# 1. Seed demo laboratory data (Users, Batches, Chemical Tests, Audit Trail)
npm run seed

# 2. Run the automated integration test suite (8 tests)
npm test

# 3. Start the unified application on http://localhost:5000
npm start
```

Open **`http://localhost:5000`** in your browser. All API requests (`/api/*`) and React user interface routes (`/`, `/batches`, `/tests`, `/expiring`, `/audit-logs`) are served seamlessly from this single link.

---

## 🔑 Demo Login Credentials

The login screen includes **one-click quick-fill buttons** for all demo roles:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Lab Manager** | `labmanager` | `manager123` |
| **Lab Analyst** | `analyst` | `analyst123` |
| **Quality Manager** | `qa_lead` | `quality123` |
| **Production Staff** | `production` | `prod123` |
| **Viewer** | `viewer` | `viewer123` |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register user
- `POST /api/auth/login` – Login & receive JWT
- `GET /api/auth/me` – Current user profile (Protected)

### Batches & Traceability (`/api/batches`)
- `POST /api/batches` – Create product batch (Admin, Lab Manager, Production)
- `GET /api/batches` – List all product batches
- `GET /api/batches/expiring?days=30` – Monitor batches nearing expiry
- `GET /api/batches/:id` – Retrieve batch details
- `GET /api/batches/:id/traceability` – Complete batch traceability & Certificate of Analysis (COA)
- `PUT /api/batches/:id` – Update batch fields (Admin, Lab Manager)
- `PATCH /api/batches/:id/status` – Update batch status (Admin, Lab Manager, Quality Manager)

### Laboratory & Chemical Testing (`/api/tests`)
- `POST /api/tests` – Record new chemical / microbiological test
- `GET /api/tests` – Filter tests by batch, category, outcome, or text search
- `GET /api/tests/:id` – View individual test details
- `PUT /api/tests/:id` – Update observed parameter readings
- `PATCH /api/tests/:id/review` – Sign off test (Pass/Fail) & synchronize batch status
- `DELETE /api/tests/:id` – Delete test record

### Regulatory Audit Trail (`/api/audit-logs`)
- `GET /api/audit-logs` – Retrieve audit logs with filter by action, entity, and timestamp
