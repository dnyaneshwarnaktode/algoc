# 🦊 Fyers API v3 Integration Testing Guide

This guide outlines the steps to test and verify the live market data integration using the Fyers API v3.

## 📋 Prerequisites

1.  **Fyers Developer Account**: You must have an active app at [myapi.fyers.in](https://myapi.fyers.in).
2.  **Redirect URL**: Your Fyers app must have the Redirect URL set to:
    `https://portalled-axonal-bao.ngrok-free.dev/api/fyers/callback`
3.  **ngrok**: Ensure your ngrok tunnel is running and forwarding to port 5000:
    ```bash
    ngrok http 5000
    ```
    *Note: If your ngrok URL changes, update it in your Fyers App Dashboard AND the `.env` file.*

## ⚙️ Configuration

Ensure your `backend/.env` file has the following entries filled:

```env
FYERS_APP_ID=XXXXX-100
FYERS_SECRET_ID=XXXXXXXXXX
FYERS_REDIRECT_URL=https://portalled-axonal-bao.ngrok-free.dev/api/fyers/callback
MARKET_DATA_SOURCE=SIMULATED # Keep as SIMULATED for startup
```

## 🚀 Testing Steps

### 1. Authenticate with Fyers
The Fyers Access Token is valid for **one trading day only** and expires at 3:00 AM. You must log in once every morning.

1.  Start your Backend and Frontend servers.
2.  Open the **Frontend** (typically `localhost:3000`).
3.  Navigate to **Admin Settings** (⚙️ icon in the navbar, admin login required).
4.  Find the **🦊 Fyers Integration** card.
5.  Click **"Login to Fyers"**.
    *   A popup window will open showing the Fyers login page.
    *   Enter your Fyers credentials and TOTP.
    *   After successful login, the popup will redirect to your ngrok URL and show a "Success" message, then close automatically.
6.  The **Auth Status** on the Admin Settings page should now show **"Authenticated"** (green indicator).

### 2. Activate Live Market Data
Once authenticated, you can switch the entire system from simulated prices to live exchange data.

1.  On the **Admin Settings** page, click **"Switch to Fyers Feed"**.
2.  You should see an alert: `"Market data source switched to Fyers!"`.
3.  The **Data Source** indicator will update to **"LIVE (FYERS)"**.

### 3. Verify Live Data Stream
1.  Navigate to the **Market** or **Stocks** page.
2.  Observe the prices for stocks like `RELIANCE`, `TCS`, or `SBIN`.
3.  **Verification Check**: Live prices during market hours (9:15 AM - 3:30 PM) will fluctuate based on the actual exchange feed.
4.  If the market is closed, Fyers usually sends the last closed price.

### 4. Technical Validation (Backend Logs)
Check your backend terminal for the following logs to confirm success:
- `✅ Fyers Access Token generated successfully`
- `✅ Fyers Data Socket Connected`
- `📡 Subscribed to Fyers symbols: NSE:RELIANCE-EQ, NSE:TCS-EQ...`

## 🛠️ Troubleshooting

| Issue | Potential Cause | Solution |
| :--- | :--- | :--- |
| **Auth Code Error** | Redirect URL mismatch | Ensure the URL in Fyers Dashboard matches `FYERS_REDIRECT_URL` exactly. |
| **Socket Error** | Invalid App ID | Ensure `FYERS_APP_ID` ends with `-100` (for web apps). |
| **Prices not updating** | Subscription failed | Check if the symbol format `NSE:SYMBOL-EQ` is correct in `fyersDataService.js`. |
| **Login window blank** | ngrok not running | Ensure `ngrok http 5000` is active and the URL hasn't expired. |

## 🔄 Switching Back
To return to simulated mode for testing strategies without live data:
1.  On the **Admin Settings** page, click **"Switch back to Simulated"**.
2.  Or restart the server with `MARKET_DATA_SOURCE=SIMULATED` in `.env`.
