# Deployment Guide: Vercel (Frontend) + Render (Backend)

## Phase 1: Preparation & GitHub Setup

### 1. Root `package.json` (Optional but Recommended)
Create a `package.json` in the **root** folder (`f:\PRojects\AlgoC`) to easily install dependencies for both if needed, or simply ensure both `frontend` and `backend` are independent.
*Current State:* You have distinct `frontend` and `backend` folders using their own `package.json`. This is perfect for a "Monorepo" style deployment.

### 2. Prepare `backend` for Production
1.  Ensure `server.js` uses `process.env.PORT`. (Already confirmed in your code).
2.  Ensure `cors` is set up to accept requests from your future frontend domain.
    *   *Action needed:* Update `backend/server.js` to allow the Vercel domain later, or allow all for now.

### 3. Prepare `frontend` for Production
1.  Ensure all API calls point to the **deployed backend URL**, not `localhost:5000`.
    *   *Action needed:* Update `frontend/src/services/api.js` to use an environment variable `REACT_APP_API_URL`.

### 4. Push to GitHub
1.  Initialize Git in the root folder if not done.
    ```bash
    git init
    # Create a .gitignore in root if missing (ignoring node_modules, .env)
    ```
2.  Commit your code.
    ```bash
    git add .
    git commit -m "Ready for deployment"
    ```
3.  Create a new Repository on GitHub (e.g., `algoc-platform`).
4.  Link and Push:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/algoc-platform.git
    git branch -M main
    git push -u origin main
    ```

---

## Phase 2: Deploy Backend to Render

1.  **Sign Up / Login** to [Render](https://render.com/).
2.  Click **"New +"** -> **"Web Service"**.
3.  **Connect GitHub**: Select your `algoc-platform` repo.
4.  **Configure Service**:
    *   **Name**: `algoc-backend`
    *   **Region**: Singapore (closest to India) or Frankfurt.
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
5.  **Environment Variables** (Copy from your local `.env`):
    *   `NODE_ENV`: `production`
    *   `MONGO_URI`: (Your MongoDB Atlas Connection String - Ensure Access from Anywhere `0.0.0.0/0` is enabled in Atlas Network Access)
    *   `JWT_SECRET`: (Your Secret)
    *   `ANGEL_API_KEY`: ...
    *   `ANGEL_CLIENT_CODE`: ...
    *   `ANGEL_PIN`: ...
    *   `CLIENT_URL`: `https://algoc-frontend.vercel.app` (You will update this after Frontend deploy)
6.  Click **"Create Web Service"**.
7.  **Wait** for deployment. Once live, copy the **Backend URL** (e.g., `https://algoc-backend.onrender.com`).

---

## Phase 3: Deploy Frontend to Vercel

1.  **Sign Up / Login** to [Vercel](https://vercel.com/).
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**: Select `algoc-platform`.
4.  **Configure Project**:
    *   **Framework Preset**: Create React App
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   `REACT_APP_API_URL`: Paste your **Render Backend URL** (e.g., `https://algoc-backend.onrender.com/api`).
    *   *Note: Do NOT add a trailing slash if your code handles it, or check `api.js`.*
6.  Click **"Deploy"**.

---

## Phase 4: Final Connection

1.  Once Vercel deployment is successful, you will get a **Frontend URL** (e.g., `https://algoc-platform.vercel.app`).
2.  Go back to **Render Dashboard** -> **Environment Variables**.
3.  Update `CLIENT_URL` to your new **Vercel Frontend URL**.
4.  **Redeploy** the backend (Manual Deploy -> Clear cache and deploy) to apply changes.

## Phase 5: Verification

1.  Open your Vercel URL.
2.  Try **Logging In** (Tests DB connection).
3.  Check **Stocks Watchlist** (Tests Market Data / Angel One connection).
4.  Go to **Admin Settings** (Tests Auth & User config).

🎉 **Your AlgoC Platform is now LIVE!**
