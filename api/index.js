export default async function handler(req, res) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = "appFaytZ8b3ovaOUd";
  const TABLE_NAME = "Email Logs";

  // Debug: Check if token exists
  if (!AIRTABLE_TOKEN) {
    res.status(500).send("Error: AIRTABLE_TOKEN environment variable not set");
    return;
  }

  try {
    // Fetch latest record from Airtable
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?maxRecords=1&sort%5B0%5D%5Bfield%5D=Update&sort%5B0%5D%5Bdirection%5D=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      }
    );

    const data = await airtableRes.json();
    
    // Debug: Check Airtable response
    if (data.error) {
      res.status(500).send("Airtable error: " + JSON.stringify(data.error));
      return;
    }
    
    if (!data.records || data.records.length === 0) {
      res.status(404).send("No records found in Email Logs table");
      return;
    }
    
    const record = data.records[0].fields;

    // Extract values
    const u = record["Update"] || "";
    const inbox = record["Inbox Count"] || 0;
    const e7d = record["7D Emails"] || 0;
    const c7d = record["7D Change"] || "0%";
    const wt = record["Wait Time"] || 0;
    const wtc = record["Wait Time Change"] || 0;
    const fcr = record["% FCR Rate"] || 0;
    const fcrc = record["% FCR Rate Change"] || "";
    const hpw = Math.round((record["Hours Per Week"] || 0) * 10) / 10;
    const hpd = Math.round((record["Hours Per Day"] || 0) * 10) / 10;
    const rp7 = record["7D RP Codes Sent"] || 0;
    const fs7 = record["7D FS Codes Sent"] || 0;
    const rpc7 = record["7D RP Code Cost"] || "$0";
    const fsc7 = record["7D FS Code Cost"] || "$0";
    const rpca = record["Annual RP Code Cost"] || "$0";
    const fsca = record["Annual FS Code Cost"] || "$0";

    // Format change indicators
    const ra = String(c7d).includes("-") ? "↓" : "↑";
    const rt = ra + " " + String(c7d).replace("-", "") + " from last week";
    const wa = wtc < 0 ? "↓" : "↑";
    const wtt = wa + " " + Math.abs(wtc) + "h from last week";
    const fa = String(fcrc).includes("-") ? "↓" : "↑";
    const ft = fcrc ? (fa + " " + String(fcrc).replace("-", "") + " from last week") : "";

    // Format annual costs
    function fk(c) {
      const n = parseInt(String(c).replace(/[$,]/g, ""));
      if (isNaN(n)) return c;
      const k = Math.round(Math.abs(n) / 1000);
      return (n < 0 ? "-" : "") + "$" + k + "k";
    }

    const F1 = "https://github.com/MaxTemkin/mpc-dashboard-assets/raw/refs/heads/main/Caraque_Trial_BdMelted.ttf";
    const F2 = "https://github.com/MaxTemkin/mpc-dashboard-assets/raw/refs/heads/main/Gaya.otf";
    const F3 = "https://github.com/MaxTemkin/mpc-dashboard-assets/raw/refs/heads/main/OlympeMono-Regular.otf";
    const LOGO = "https://github.com/MaxTemkin/mpc-dashboard-assets/blob/main/MagicPuzzleCompanyEmailSM.png?raw=true";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MPC Support Dashboard</title>
  <style>
    @font-face { font-family: 'Caraque'; src: url('${F1}') format('truetype'); }
    @font-face { font-family: 'Gaya'; src: url('${F2}') format('opentype'); }
    @font-face { font-family: 'Olympe'; src: url('${F3}') format('opentype'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 800px; height: 480px; background: #fff; color: #000; font-family: 'Olympe', monospace; font-size: 15px; letter-spacing: -1px; display: flex; flex-direction: column; padding: 24px 32px; overflow: hidden; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #000; }
    .title-container { display: flex; align-items: center; gap: 10px; }
    .company-logo { height: 37px; width: auto; }
    .title { font-family: 'Gaya', serif; font-size: 28px; font-weight: normal; letter-spacing: -0.5px; }
    .main-content { display: flex; flex: 1; gap: 32px; }
    .primary-column { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding-right: 32px; border-right: 2px solid #000; gap: 24px; min-width: 200px; }
    .primary-metric { display: flex; flex-direction: column; align-items: center; }
    .primary-label { font-family: 'Gaya', serif; font-size: 19px; letter-spacing: -0.5px; margin-bottom: 4px; }
    .primary-value { font-family: 'Caraque', sans-serif; font-size: 110px; line-height: 1; }
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 12px 16px; flex: 1; align-content: center; }
    .metric { display: flex; flex-direction: column; justify-content: center; }
    .metric-label { font-family: 'Gaya', serif; font-size: 15px; letter-spacing: -0.5px; margin-bottom: 2px; }
    .metric-value { font-family: 'Caraque', sans-serif; font-size: 42px; line-height: 1.1; letter-spacing: -2px; }
    .metric-change { font-size: 13px; margin-top: 2px; }
    .metric-dual { display: flex; align-items: flex-start; gap: 8px; }
    .metric-dual-item { display: flex; flex-direction: column; }
    .metric-dual-value { font-family: 'Caraque', sans-serif; font-size: 42px; line-height: 1.1; letter-spacing: -2px; }
    .metric-dual-suffix { font-size: 13px; }
    .metric-dual-or { font-family: 'Olympe', monospace; font-size: 13px; letter-spacing: -1px; margin-top: 14px; }
    .metric-dual-dot { font-family: 'Caraque', sans-serif; font-size: 24px; margin-top: 4px; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid #000; margin-top: 16px; }
    .status-indicator { display: flex; align-items: center; gap: 6px; }
    .status-dot { width: 8px; height: 8px; background: #000; border-radius: 50%; }
    .logo { width: 14px; height: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-container">
      <img class="company-logo" src="${LOGO}" alt="MPC">
      <div class="title">MPC Support Dash</div>
    </div>
    <div class="timestamp">Updated: ${u}</div>
  </div>
  
  <div class="main-content">
    <div class="primary-column">
      <div class="primary-metric">
        <div class="primary-label">Current Inbox</div>
        <div class="primary-value">${inbox}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Replies This Week</div>
        <div class="metric-value">${e7d}</div>
        <div class="metric-change">${rt}</div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric">
        <div class="metric-label">First Contact Resolution</div>
        <div class="metric-value">${fcr}%</div>
        <div class="metric-change">${ft}</div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Codes Sent This Week</div>
        <div class="metric-dual">
          <div class="metric-dual-item">
            <div class="metric-dual-value">${rp7}</div>
            <div class="metric-dual-suffix">puzzles</div>
          </div>
          <div class="metric-dual-dot">•</div>
          <div class="metric-dual-item">
            <div class="metric-dual-value">${fs7}</div>
            <div class="metric-dual-suffix">free shipping</div>
          </div>
        </div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Average Wait Time</div>
        <div class="metric-value">${wt}h</div>
        <div class="metric-change">${wtt}</div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Puzzle Code Cost Estimate</div>
        <div class="metric-dual">
          <div class="metric-dual-item">
            <div class="metric-dual-value">${rpc7}</div>
            <div class="metric-dual-suffix">this week</div>
          </div>
          <div class="metric-dual-dot">•</div>
          <div class="metric-dual-item">
            <div class="metric-dual-value">${fk(rpca)}</div>
            <div class="metric-dual-suffix">this year</div>
          </div>
        </div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Email Hours</div>
        <div class="metric-dual">
          <div class="metric-dual-item">
            <div class="metric-dual-value">${hpw}</div>
            <div class="metric-dual-suffix">per week</div>
          </div>
          <div class="metric-dual-or">or</div>
          <div class="metric-dual-item">
            <div class="metric-dual-value">${hpd}</div>
            <div class="metric-dual-suffix">per day</div>
          </div>
        </div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Shipping Code Cost Estimate</div>
        <div class="metric-dual">
          <div class="metric-dual-item">
            <div class="metric-dual-value">${fsc7}</div>
            <div class="metric-dual-suffix">this week</div>
          </div>
          <div class="metric-dual-dot">•</div>
          <div class="metric-dual-item">
            <div class="metric-dual-value">${fk(fsca)}</div>
            <div class="metric-dual-suffix">this year</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div class="status-indicator">
      <div class="status-dot"></div>
      <span>Live from Airtable and Gmail</span>
      <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#000"/>
      </svg>
    </div>
    <div>Next refresh: 15 min</div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
    
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}
