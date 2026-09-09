# Agentic AI Automation Platform (Agentflow_AI)

Agentflow_AI is an enterprise-grade AI Operations Automation Platform that enables operators to describe complex workflows in natural language and transform them into executable visual directed acyclic graphs (DAGs). 

Workflows are rendered on an interactive drag-and-drop canvas, executed through a 5-stage chain of cooperating AI agents (**Planner**, **Execution**, **Validation**, **Recovery**, and **Monitoring**), integrated with third-party tools (**Gmail**, **Slack**, **Discord**, and **Google Sheets**) over AES-256 encrypted OAuth/bot credentials, and streamed in real-time to the browser via WebSockets.

---

## ⚡ Key Features

- **Natural Language Prompt to Visual Workflow**: Generate multi-step visual workflows using OpenRouter, Google Gemini, or the deterministic fallback builder.
- **Drag-and-Drop Visual Canvas**: Built with `@xyflow/react` (React Flow), featuring custom node types, animated bezier edges, dynamic handles, minimap, and live inspector.
- **5-Stage Cooperating Multi-Agent Chain**:
  - 🧠 **Planner Agent**: Computes topological DAG node execution order and calculates confidence scores (up to 99%).
  - ⚙️ **Execution Agent**: Resolves pipeline variables (`{{variable}}`), invokes AI reasoning, and executes tools.
  - 🛡️ **Validation Agent**: Validates required output contracts and payload schemas.
  - 🔄 **Recovery Agent**: Classifies runtime anomalies (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and applies exponential backoff or operator escalation.
  - 📡 **Monitoring Agent**: Emits live audit logs, tracks telemetry, and streams WebSocket events.
- **Zero-Config Local Fallbacks**: Built-in in-memory fallbacks for MongoDB and Redis/BullMQ, allowing immediate `npm run dev` execution on any machine without installing local database daemons.
- **Encrypted Integrations**: AES-256-GCM application-level credential encryption at rest for Gmail, Slack, Discord, Google Sheets, OpenRouter, and Gemini.
- **Real-Time Live Timeline & Notifications**: Socket.IO live updates for execution progress, pause/resume/cancel controls, and slideout notifications drawer.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (Pages Router)
- **UI / Styling**: React 19, Tailwind CSS (Dark Operator-Console Theme, Glassmorphism)
- **Workflow Canvas**: `@xyflow/react` (React Flow)
- **State Management**: Zustand with persistent storage
- **Icons & Real-Time**: `lucide-react`, `socket.io-client`, `axios`

### Backend
- **Runtime**: Node.js & Express.js
- **Database & Storage**: MongoDB & Mongoose (with automated In-Memory Database Fallback)
- **Queues & Background Jobs**: BullMQ & Redis via `ioredis` (with automated In-Memory Async Queue Fallback)
- **Real-Time Layer**: Socket.IO server
- **Security & Auth**: JWT, `bcryptjs` (Cost factor 12), `helmet`, `cors`, `compression`, `morgan`, `express-rate-limit`, `express-validator`
- **Cryptography**: AES-256-GCM encryption for stored tokens

---

## 📂 Project Structure

```
├── client/                     # Next.js Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell/       # Header, Sidebar, Notifications Drawer
│   │   │   ├── MetricGrid/     # Real-time KPI performance cards
│   │   │   ├── NodePalette/    # Draggable node palette
│   │   │   ├── NodeConfigPanel/# Node parameter & variable inspector
│   │   │   ├── WorkflowCanvas/ # React Flow wrapper & custom node types
│   │   │   └── ProtectedRoute/ # Client auth route guard
│   │   ├── pages/
│   │   │   ├── _app.js         # Global providers & socket init
│   │   │   ├── index.js        # Platform landing page & simulator
│   │   │   ├── login.js        # Auth login & 1-click demo button
│   │   │   ├── register.js     # User registration
│   │   │   ├── dashboard.js    # Operator command center & metrics
│   │   │   ├── integrations.js # OAuth & tool connections management
│   │   │   ├── settings.js     # System diagnostics & encryption status
│   │   │   ├── executions/     # Execution list and [id] timeline viewer
│   │   │   └── workflows/      # Workflow directory, builder, & [id] canvas editor
│   │   ├── store/              # Zustand stores (authStore, workflowStore)
│   │   └── services/           # Axios API client & Socket.IO client
│   └── package.json
│
├── server/                     # Express.js Backend Application
│   ├── src/
│   │   ├── config/             # Environment, DB & Socket.IO initialization
│   │   ├── routes/             # Express API routes
│   │   ├── controllers/        # Thin HTTP controllers
│   │   ├── services/           # Business logic & AI/Workflow services
│   │   ├── agents/             # Multi-Agent Chain (Planner, Exec, Val, Rec, Mon, Orchestrator)
│   │   ├── integrations/       # Gmail, Slack, Discord, Google Sheets handlers
│   │   ├── models/             # User, Workflow, Execution, ExecutionLog, Integration, Notification
│   │   ├── queues/             # BullMQ & in-memory async queues
│   │   └── tests/              # Automated backend test suite
│   ├── .env                    # Server environment variables
│   └── package.json
│
├── package.json                # Root package.json with runner scripts
└── README.md
```

---

## 🚀 Quickstart Guide: Running Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

*(Note: MongoDB and Redis are optional. If they are not running locally, the server will seamlessly activate its built-in in-memory storage and async job queues).*

---

### 2. Install Dependencies

#### Option 1: 1-Click Script (Windows)
Double-click or execute [`install.bat`](file:///C:/Users/SSE/Desktop/specs.md/install.bat) in the root folder:
```cmd
.\install.bat
```

#### Option 2: Root NPM Command
From the root workspace directory:
```bash
npm run install:all
```

#### Option 3: Manual Installation (Per Subdirectory)
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

> **Windows PowerShell Tip:** If you encounter `npm.ps1 cannot be loaded because running scripts is disabled on this system`, either run `npm.cmd` instead of `npm` or unblock execution in your current session with:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

### 3. Configure Environment Variables

The backend includes a pre-configured `.env` file (`server/.env`). You can customize the settings or add your API keys:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/agentflow_ai
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=agentflow_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
CREDENTIAL_ENCRYPTION_KEY=agentflow_secret_key_32bytes_!!

# Optional: Add third-party AI keys for live generative completions
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# Optional: OAuth client keys for real Google / Slack / Discord authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

---

### 4. Start the Application

#### Option A: Start Services Individually (Recommended)

In Terminal 1 (Backend Server):
```bash
cd server
npm run dev
```
> Server will start on `http://localhost:5000`

In Terminal 2 (Next.js Frontend):
```bash
cd client
npm run dev
```
> Frontend will start on `http://localhost:3000`

---

### 5. Access the Platform

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

1. **Sign In**: Click **"Explore Demo Console"** or **"Operator Sign In"** and use the **"1-Click Operator Demo Login"** button.
2. **Dashboard**: View real-time KPIs, active workflows, and live agent events.
3. **AI Builder**: Navigate to `/workflows/builder`, enter a prompt (e.g. *"When an invoice arrives by email, parse the amount with AI, append to Google Sheets, and notify Slack"*), and click **"Generate Graph"**.
4. **Canvas Editor**: Click **"Save & Open Editor"** to customize nodes, drag new nodes from the palette, and configure variables.
5. **Execute & Live Stream**: Click **"Run Workflow"** to execute through the agent chain and watch the real-time telemetry stream on `/executions/[id]`.
6. **Integrations**: Visit `/integrations` to test OAuth providers or configure manual bot tokens.

---

## 🧪 Running Automated Tests

The repository includes a comprehensive automated test suite testing health, authentication, AI workflow generation, workflow execution through the multi-agent chain, encryption, and notifications:

```bash
cd server
npm test
```

---

## 🔒 Security Specifications

- **Token Encryption**: All OAuth tokens and bot API keys are encrypted at rest using AES-256-GCM.
- **Password Security**: Passwords are saved with bcrypt using cost factor 12.
- **Session Protection**: JWTs are verified on all protected routes with Bearer token authentication.
- **HTTP Hardening**: Helmet security headers, CORS origin locking to `CLIENT_URL`, and rate limiting on auth endpoints.

---

## 📄 License

ISC License • Agentflow_AI Team
