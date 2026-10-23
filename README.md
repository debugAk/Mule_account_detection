# Mule Sentinel — Intelligent Mule Account Detection & Fraud Investigation Platform

A production-grade financial crime intelligence and mule account investigation workspace designed for banking fraud analysts and AML compliance officers. Built for high-throughput operational review (60–200 alerts per shift) with keyboard-first ergonomics, dense data presentation, tabular numerals, explainable risk signals, and dual-theme visual ergonomics (*Daylight Ledger* & *Night Ledger*).

---

## 1. System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      CSV Ingestion API      │
                                  │   (Txns & Bank SOA format)  │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌──────────────────────┐          ┌─────────────────────────────┐
│  Investigator Web UI │          │       FastAPI Backend       │
│  (React 18, Vite,    │◄────────►│  - PII Masking & RBAC       │
│   Tailwind, Cytoscape│          │  - Ingestion & Validation   │
│   TanStack Query)    │          │  - Dual Scoring Pipeline    │
└──────────────────────┘          └──────────────┬──────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
         ┌─────────────────────────────┐                   ┌─────────────────────────────┐
         │     Isolation Forest ML     │                   │     Rule Heuristic Engine   │
         │  5-Feature Anomaly Scorer   │                   │  - Rapid Pass-Through       │
         │  (ml/models/mule_pipeline)  │                   │  - Layered Fan-Out          │
         └─────────────────────────────┘                   │  - Velocity Spikes          │
                                                           └─────────────────────────────┘
```

### Core Components
- **Investigator Workspace (`apps/web`)**: Dense, professional UI with zero AI-generated fluff (no purple gradients, no frosted glass, no emoji icons). 3-pane adjustable investigation screen, interactive Cytoscape transaction network, and draft STR preparation.
- **Backend Service (`backend/app`)**: Async FastAPI service with SQLAlchemy ORM, role-based access control (`investigator`, `reviewer`, `admin`), audit logging, and PII masking.
- **Dual-Engine Scoring (`backend/app/services`)**:
  1. *Isolation Forest Model*: Evaluates 5-dimensional feature vectors (`pass_through_ratio`, `log1p(tx_count)`, `log1p(total_credit_inr)`, `balance_retention_ratio`, `log1p(unique_counterparties)`).
  2. *Deterministic Rule Engine*: Detects rapid pass-through (>95% routed within 15m), high turnover spikes, shell counterparty fan-out, and dormant account reactivation.
- **Cytoscape Link Analysis**: Directed, weighted transaction graphs showing account-to-account flows, device/phone sharing, and hop-by-hop *Follow the Money* path analysis with accessible table fallback.

---

## 2. Key Modules & Capabilities

### Interactive Dashboard
- Real-time operational telemetry: total transactions analyzed, flagged mule exposure in ₹, open investigations, and active alert breakdown.
- Visual risk tier composition (Critical, High, Medium, Low) and 7-day transaction volume activity.
- Recent priority detections table with quick inspection links.

### Alert Management & Queue
- Risk score (0–100) combining statistical anomaly scoring with deterministic financial crime heuristics.
- Dense 36px table layout with tabular numerals (`tabular-nums`), hairline 1px borders, and status indicators.
- Instant triage actions (Escalate, Dismiss, Freeze) with multi-level undo/redo.

### Investigation Workspace
- 3-pane split view with draggable splitters.
- Chronological transaction ledger with debit/credit badges, counterparty details, and channel tags (IMPS, NEFT, RTGS, UPI).
- Persistent case notes and audit timeline synchronized directly with the database.
- Controlled PII reveal workflow with mandatory justification logging for regulatory compliance.

### Transaction Network Analysis (Cytoscape.js)
- Accounts represented as nodes, transactions as directed, weighted edges.
- Interactive *Follow the Money* sequence tracer highlighting layering paths step-by-step.
- Fully accessible keyboard-friendly table fallback for screen readers and regulatory reporting.

### CSV Ingestion & Stream Processing
- Supports both standard transaction CSVs and bank Statement of Account (SOA) formats.
- Complete validation: duplicate transaction detection, negative amount rejection, timestamp parsing, and malformed row handling.
- Displays comprehensive ingestion summaries (accepted, rejected, duplicate counts) with sanitized error messages.
- Downloadable synthetic test schemas directly within the app modal.

### Evidence & STR Draft Preparation
- Generates structured Suspicious Transaction Report (STR) narratives aligned with FIU-IND regulatory guidelines.
- **Compliance Note**: All STR functionality prepares editable drafts for authorized compliance officer review; it does not automatically submit filings to authorities.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack React Query, Cytoscape.js, Lucide Icons.
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy 2.0, Pydantic v2, Uvicorn.
- **Machine Learning**: Scikit-Learn, Joblib, NumPy (Isolation Forest pipeline).
- **Database**: SQLite (default local development) or PostgreSQL 15+ (production/Docker).
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 4. Quick Start Guide

### Prerequisites
- Node.js 18+ and `pnpm` (`npm install -g pnpm`)
- Python 3.11+
- Git

### Local Development Setup

#### 1. Start the Backend Service
```powershell
# From the repository root:
python -m pip install -r backend/requirements.txt

# Run the FastAPI server (auto-seeds 120 accounts, alerts, and cases on first run)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is accessible at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

#### 2. Start the Frontend Workspace
```powershell
# In another terminal window:
pnpm install

# Run Vite development server
pnpm --filter web dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Docker Deployment

Deploy the entire stack (PostgreSQL + FastAPI Backend + Nginx Web UI) with one command:

```bash
docker-compose up --build -d
```

- **Frontend Workspace**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/api/health`

To stop the containers:
```bash
docker-compose down
```

---

## 6. Running Tests

### Backend Unit & Integration Tests
```powershell
python -m pytest -o pythonpath=. backend/tests/test_backend.py -v
```

### Frontend TypeScript Verification & Production Build
```powershell
pnpm --filter web build
```

---

## 7. CSV Ingestion Formats

### Format A: Transaction-Level CSV (`txns_sample.csv`)
```csv
transaction_id,timestamp,source_account,destination_account,amount,currency,channel
TXN-9001,2026-10-23T10:15:00Z,ACC-101,ACC-202,150000,INR,IMPS
TXN-9002,2026-10-23T10:18:30Z,ACC-202,ACC-303,148000,INR,UPI
```

### Format B: Statement of Account / SOA (`soa_sample.csv`)
```csv
account_id,statement_date,txn_count,total_credit_inr,total_debit_inr,end_balance_inr,counterparty_count
ACC-404,2026-10-23,45,2500000,2480000,20000,18
```

Both formats can be imported through the **Ingest CSV** button in the top navigation bar or the **Import Transactions CSV** button on the dashboard. Synthetic test templates can be downloaded directly from the upload modal.

---

## 8. Security, RBAC & Privacy Compliance

- **Masked Data by Default**: Account numbers, UPI IDs, and account holder names are masked across all default views (`HDFC-XXXX4471`, `ravi.****@okaxis`).
- **Role-Based Access Control**:
  - `investigator`: Full access to triage, inspect cases, upload transactions, and add notes.
  - `reviewer`: Authorized to review and approve STR drafts.
  - `admin`: System administration and configuration.
- **PII Audit Logging**: Accessing unmasked account data triggers a mandatory justification prompt that logs the investigator's ID, timestamp, and audit reason to `audit_logs`.
- **Synthetic Data**: All default seeded data and samples are synthetic Indian banking fixtures. No real customer PII or banking credentials are ever stored or transmitted.
