import React from "react";
import { useNavigate } from "react-router-dom";

const BRAND = "Ledgerline"; // change to your product name (sidebar uses "REBS HR")
const LOGIN_PATH = "/login"; // adjust to your login route

const css = `
@import url("https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=Inter:wght@400;500;600;700&display=swap");

.ua-root{
  --ink:#12161B; --ink-2:#1B2129; --parch:#FBFAF6; --line:#E4E0D6;
  --teal:#2F6F5E; --teal-dark:#20503F; --rust:#B4472F;
  --text-dark:#1B1D22; --text-soft:#5B5F66;
  --text-onink:#EDEBE3; --text-onink-soft:#9AA3A6;
  --input-border:#CFC7B4;
  box-sizing:border-box;
  font-family:'Inter',system-ui,-apple-system,sans-serif !important;
  background:var(--ink); color:var(--text-dark);
  min-height:100vh; padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);
}
@media (prefers-color-scheme: dark){
  .ua-root{ --parch:#1C1F24; --line:#2C3038; --text-dark:#EDEBE3; --text-soft:#A4A9AE; --input-border:#3B4048; }
}
.ua-root *{ box-sizing:border-box; font-family:inherit !important; }
.ua-wrap{ display:grid; grid-template-columns:1fr 1.2fr; min-height:100vh; }
@media (max-width:860px){ .ua-wrap{ grid-template-columns:1fr; } }

.ua-brand{
  background:radial-gradient(120% 140% at 15% 10%, var(--ink-2) 0%, var(--ink) 60%);
  color:var(--text-onink); padding:56px 48px; display:flex; flex-direction:column; justify-content:space-between;
}
@media (max-width:860px){ .ua-brand{ padding:36px 28px 28px; } }
.ua-mark{ display:inline-flex; align-items:center; gap:10px; font-family:'Source Serif 4',serif !important; font-size:19px; }
.ua-dot{ width:9px; height:9px; border-radius:50%; background:var(--teal); display:inline-block; }
.ua-brand h1{ font-family:'Source Serif 4',serif !important; font-weight:500 !important; font-size:clamp(28px,4vw,38px); line-height:1.25; letter-spacing:-0.01em; max-width:15ch; margin:40px 0 0; }
.ua-sub{ color:var(--text-onink-soft); font-size:15px; line-height:1.6; max-width:34ch; margin-top:18px; }
.ua-seal{ display:block; margin:24px auto 0; }
@media (max-width:860px){ .ua-seal{ display:none; } }
.ua-foot{ color:var(--text-onink-soft); font-size:13px; line-height:1.6; max-width:36ch; }

.ua-stage{ background:var(--parch); display:flex; align-items:center; justify-content:center; padding:40px 24px; }
.ua-card{ width:100%; max-width:400px; }
.ua-icon{ width:46px; height:46px; border-radius:50%; background:var(--rust); display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
.ua-card h2{ font-family:'Source Serif 4',serif !important; font-weight:500 !important; font-size:27px; margin:0 0 8px; letter-spacing:-0.01em; }
.ua-lede{ color:var(--text-soft); font-size:15px; line-height:1.6; margin:0 0 26px; }
.ua-code{ display:inline-block; font-size:12px; font-weight:600 !important; letter-spacing:.08em; color:var(--rust); margin-bottom:10px; }

.ua-btn{
  width:100%; padding:14px; border:none; border-radius:9px; background:var(--teal); color:#fff;
  font-size:15px; font-weight:600 !important; cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:background .15s ease, transform .05s ease;
}
.ua-btn:hover{ background:var(--teal-dark); }
.ua-btn:active{ transform:translateY(1px); }
.ua-btn.ghost{ background:transparent; color:var(--text-dark); border:1.5px solid var(--input-border); margin-top:10px; }
.ua-btn.ghost:hover{ background:rgba(127,127,127,.08); }
.ua-btn:focus-visible{ outline:2px solid var(--teal); outline-offset:2px; }
`;

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="ua-root">
      <style>{css}</style>
      <div className="ua-wrap">
        {/* LEFT: brand panel */}
        <div className="ua-brand">
          <span className="ua-mark">
            <span className="ua-dot" />
            {BRAND}
          </span>
          <div>
            <h1>This area is for signed-in users only.</h1>
            <p className="ua-sub">
              Your session may have ended, or this account doesn't have access
              to the page you tried to open.
            </p>
            <svg
              className="ua-seal"
              width="150"
              height="150"
              viewBox="0 0 150 150"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="75" cy="75" r="72" stroke="#2F6F5E" strokeWidth="1" />
              <circle
                cx="75"
                cy="75"
                r="58"
                stroke="#2F6F5E"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
              <circle
                cx="75"
                cy="75"
                r="34"
                fill="#1B2129"
                stroke="#2F6F5E"
                strokeWidth="1.5"
              />
              <path
                d="M75 60a8 8 0 0 0-8 8v4h-2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V74a2 2 0 0 0-2-2h-2v-4a8 8 0 0 0-8-8Zm0 5a3 3 0 0 1 3 3v4h-6v-4a3 3 0 0 1 3-3Z"
                fill="#EDEBE3"
              />
            </svg>
          </div>
          <p className="ua-foot">
            Think this is a mistake? Sign in again, or contact your
            administrator to request access.
          </p>
        </div>

        {/* RIGHT: message card */}
        <div className="ua-stage">
          <div className="ua-card">
            <div className="ua-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
              >
                <path d="M12 8v5M12 16h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <span className="ua-code">ERROR 401</span>
            <h2>Unauthorized access</h2>
            <p className="ua-lede">
              You need to sign in to view this page. Log in with your account to
              continue.
            </p>

            <button
              type="button"
              className="ua-btn"
              onClick={() => navigate(LOGIN_PATH, { replace: true })}
            >
              Go to login
            </button>
            <button
              type="button"
              className="ua-btn ghost"
              onClick={() => navigate(-1)}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
