import cron from 'node-cron';
import https from 'https';
import http from 'http';

// ──────────────────────────────────────────────────────────────────────────────
//  Smart Keep-Alive Cron Job
//  • Active window : 09:00 – 23:00 IST (UTC+5:30)
//  • Inactive window: 23:00 – 09:00 IST  ← no pings, saves Render hours
//  • Runs a self-ping every 10 minutes to prevent cold starts on Render
// ──────────────────────────────────────────────────────────────────────────────

const ACTIVE_START_HOUR = 9;   // 9 AM IST
const ACTIVE_END_HOUR   = 23;  // 11 PM IST

/**
 * Returns the current hour in IST (UTC+5:30).
 */
function getISTHour(): number {
  const nowUTC = new Date();
  // IST offset = +5h 30m = 330 minutes
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(nowUTC.getTime() + istOffsetMs);
  return nowIST.getUTCHours();
}

/**
 * Returns true if the current IST time is within the active window.
 */
function isActiveWindow(): boolean {
  const hour = getISTHour();
  return hour >= ACTIVE_START_HOUR && hour < ACTIVE_END_HOUR;
}

/**
 * Pings the backend /health endpoint to keep Render warm.
 */
function pingServer(): void {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

  const url = `${backendUrl}/health`;
  const client = url.startsWith('https') ? https : http;

  const req = client.get(url, (res) => {
    console.log(`[KeepAlive] ✅ Ping OK — ${new Date().toISOString()} | Status: ${res.statusCode}`);
    res.resume(); // drain so connection closes cleanly
  });

  req.on('error', (err) => {
    console.error(`[KeepAlive] ❌ Ping failed — ${new Date().toISOString()} | ${err.message}`);
  });

  req.setTimeout(10000, () => {
    console.warn(`[KeepAlive] ⏱ Ping timed out — ${new Date().toISOString()}`);
    req.destroy();
  });
}

/**
 * Starts the smart keep-alive scheduler.
 * Fires every 10 minutes; skips the ping outside the active IST window.
 */
export function startKeepAlive(): void {
  // Every 14 minutes: "*/14 * * * *"
  cron.schedule('*/14 * * * *', () => {
    const hour = getISTHour();

    if (!isActiveWindow()) {
      console.log(
        `[KeepAlive] 😴 Sleeping — IST hour ${hour}:xx is outside active window ` +
        `(${ACTIVE_START_HOUR}:00–${ACTIVE_END_HOUR}:00). Skipping ping.`
      );
      return;
    }

    console.log(`[KeepAlive] ⏰ Active — IST hour ${hour}:xx. Pinging server…`);
    pingServer();
  });

  console.log(
    `[KeepAlive] 🚀 Scheduler started. Pings every 14 min between ` +
    `${ACTIVE_START_HOUR}:00 and ${ACTIVE_END_HOUR}:00 IST.`
  );
}
