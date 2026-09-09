# 🚀 Complete Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through pushing **Agentflow_AI** to GitHub and deploying the backend to **Render** and frontend to **Vercel** with full MongoDB Atlas integration.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Frontend (Vercel)"]
        A[Next.js 15 App]
        B[React Flow Visual Canvas]
        C[Socket.IO Client]
    end

    subgraph Server ["Backend (Render Web Service)"]
        D[Express.js REST API]
        E[Socket.IO Real-time Engine]
        F[5-Stage Multi-Agent Chain]
    end

    subgraph Database ["Database (MongoDB Atlas)"]
        G[(Users, Workflows, Executions, Logs)]
    end

    A -->|HTTPS REST API| D
    C <-->|WSS WebSockets| E
    D <-->|Mongoose Driver| G
    F <-->|AES-256 State / Storage| G
```

---

## 📋 Table of Contents
1. [Step 1: Push Code to GitHub](#step-1-push-code-to-github)
2. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
3. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
4. [Step 4: Link Frontend & Backend URLs](#step-4-link-frontend--backend-urls)
5. [Step 5: Verification & Testing Checklist](#step-5-verification--testing-checklist)
6. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Step 1: Push Code to GitHub

The `.gitignore` files have already been configured in your project to prevent `.env`, `node_modules/`, and build artifacts from ever being pushed to GitHub.

### 1.1 Open a Terminal in the Project Root Directory
```bash
# Verify you are in the project root (specs.md)
git status
```

### 1.2 Initialize Git and Check Git Status
```bash
git init
git add .
git status
```
> [!IMPORTANT]
> Verify that `server/.env` is **NOT** listed in green (staged). Only tracked files and `.env.example` should be staged.

### 1.3 Commit the Code
```bash
git commit -m "feat: initial commit for Agentflow_AI deployment"
```

### 1.4 Create a New Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Name your repository (e.g. `agentflow-ai` or `agentic-ai-platform`).
3. Set the repository to **Public** or **Private**.
4. Leave *Add README*, *.gitignore*, and *license* unchecked.
5. Click **Create repository**.

### 1.5 Link Remote and Push
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create a Web Service on Render
1. Go to [https://dashboard.render.com/](https://dashboard.render.com/) and log in (or sign up using GitHub).
2. Click **New +** in the top navigation bar and choose **Web Service**.
3. Select **Build and deploy from a Git repository** and click **Next**.
4. Connect your GitHub repository (`agentflow-ai`).

### 2.2 Configure the Backend Web Service Settings
Fill in the configuration fields:

| Setting | Value |
| :--- | :--- |
| **Name** | `agentflow-ai-server` *(or your preferred name)* |
| **Region** | Select region closest to your MongoDB Atlas cluster (e.g., *Oregon, Frankfurt, Singapore*) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

### 2.3 Set Backend Environment Variables in Render
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each key:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Render port (or left empty for auto-assign) |
| `MONGODB_URI` | `mongodb+srv://sindhuk_06:Si%4003112006@agenticai.4csztx2.mongodb.net/agentflow_ai?retryWrites=true&w=majority&appName=agenticAi` | Your Atlas MongoDB URI |
| `JWT_SECRET` | `agentflow_super_secret_jwt_key_2026_change_in_production` | Token signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CREDENTIAL_ENCRYPTION_KEY` | `agentflow_secret_key_32bytes_!!` | 32-character AES-256 encryption key |
| `CLIENT_URL` | `http://localhost:3000` *(Temporary - will update in Step 4)* | Allowed CORS origin |
| `OPENROUTER_API_KEY` | *(Optional)* | For live OpenRouter models |
| `GEMINI_API_KEY` | *(Optional)* | For Google Gemini models |

4. Click **Deploy Web Service** at the bottom.
5. Wait 2-3 minutes for the build to finish. Once live, copy your Render URL:
   `https://agentflow-ai-server.onrender.com`

### 2.4 Verify Backend Health
Open `https://<YOUR_RENDER_BACKEND_URL>/api/health` in your browser. You should see:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "mode": "mongodb"
  }
}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create a New Project on Vercel
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and log in.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Find your GitHub repository and click **Import**.

### 3.2 Configure Project Settings
1. **Framework Preset**: `Next.js` (auto-detected).
2. **Root Directory**: Click **Edit** next to Root Directory, select **`client`**, and click **Continue**.
3. Leave Build and Output Settings as default.

---

### 3.3 Set Frontend Environment Variables in Vercel
Under the **Environment Variables** section, add the following 2 variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<YOUR_RENDER_BACKEND_URL>/api` | Backend API URL (e.g. `https://agentflow-ai-server.onrender.com/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<YOUR_RENDER_BACKEND_URL>` | Backend WebSocket URL (e.g. `https://agentflow-ai-server.onrender.com`) |

> [!WARNING]
> Do NOT include a trailing slash on `NEXT_PUBLIC_SOCKET_URL` (use `https://your-service.onrender.com`, not `https://your-service.onrender.com/`).

4. Click **Deploy**.
5. Vercel will build the Next.js frontend in ~1-2 minutes and provide you with a live URL:
   `https://agentflow-ai.vercel.app`

---

## Step 4: Link Frontend & Backend URLs

Now that your Vercel frontend is live:

1. Return to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Select your `agentflow-ai-server` Web Service.
3. Click **Environment** in the left sidebar.
4. Find `CLIENT_URL` and update its value to your actual Vercel URL:
   ```text
   https://agentflow-ai.vercel.app
   ```
5. Click **Save Changes**. Render will automatically trigger a zero-downtime redeploy with the updated CORS policy.

---

## Step 5: Verification & Testing Checklist

Once both services are deployed:

- [ ] **1. Visit Frontend**: Open your Vercel URL (`https://agentflow-ai.vercel.app`).
- [ ] **2. Authenticate**: Click **"Operator Sign In"** and click **"1-Click Operator Demo Login"** (or create a new account).
- [ ] **3. Inspect Database**: Check your [MongoDB Atlas Collections](https://cloud.mongodb.com/) to see the newly created user in `agentflow_ai.users`.
- [ ] **4. Build a Workflow**: Go to `/workflows/builder`, enter a prompt, and generate a visual DAG.
- [ ] **5. Canvas Interactions**: Customize node configurations and save the workflow.
- [ ] **6. Run Real-time Multi-Agent Execution**: Click **"Run Workflow"** and verify that live agent execution steps stream over WebSockets at `/executions/[id]`.
- [ ] **7. Integrations**: Visit `/integrations` to test encrypted credential storage.

---

## 🛠️ Troubleshooting & FAQ

### Q: The free tier of Render spins down after inactivity. How does it handle cold starts?
Render free-tier web services sleep after 15 minutes of inactivity. The first request may take ~30-50 seconds to wake up. Once awake, performance is instant.

### Q: Why does Socket.IO fail to connect on Vercel?
Ensure `NEXT_PUBLIC_SOCKET_URL` in Vercel environment variables matches your exact Render backend URL without trailing slashes. Both `websocket` and `polling` transports are supported by the client.

### Q: My MongoDB Atlas connection times out on Render.
Ensure your MongoDB Atlas **Network Access** IP Whitelist includes `0.0.0.0/0` (Allow access from anywhere) so that Render's dynamic cloud IP addresses can connect.

---

**Happy Deploying! 🚀**
