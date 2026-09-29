import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../services/operations/authApi";

/**
 * Signup View Component
 *
 * Registration interface allowing new developers to create user credentials
 * with client-side validation and automated navigation upon success.
 */
const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ userName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const { userName, password } = formData;

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    dispatch(signUp(userName, password, navigate));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Butcherman&display=swap');

        .signup-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #080c14;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 2rem 0;
        }

        /* Ambient glow blobs */
        .signup-root::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          top: -120px;
          left: -160px;
          pointer-events: none;
        }
        .signup-root::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 70%);
          bottom: -100px;
          right: -100px;
          pointer-events: none;
        }

        /* Grid texture */
        .su-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .signup-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          margin: 1rem;
          background: rgba(15, 20, 35, 0.85);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 48px 44px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.08),
            0 24px 64px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Top gradient accent line */
        .su-card-accent {
          position: absolute;
          top: -1px;
          left: 32px;
          right: 32px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #6366f1, #14b8a6, transparent);
          border-radius: 0 0 4px 4px;
        }

        .su-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .su-icon svg {
          width: 24px;
          height: 24px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .su-heading {
        font-family: "Butcherman", system-ui;
        font-size: 44px;
        font-weight: 800;
        margin: 0 0 4px 0;
        letter-spacing: -0.5px;

        background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        }

        .su-subheading {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 36px 0;
          font-weight: 400;
        }

        /* Two-column row */
        .su-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .su-field-group {
          margin-bottom: 20px;
        }

        .su-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .su-field-wrap {
          position: relative;
        }

        .su-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #475569;
          pointer-events: none;
          transition: color 0.2s;
        }

        .su-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px 12px 40px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #e2e8f0;
        }

        .su-input::placeholder { color: #334155; }

        .su-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px #0f1423 inset;
          -webkit-text-fill-color: #e2e8f0;
        }

        .su-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .su-field-wrap:focus-within .su-field-icon {
          color: #818cf8;
        }

        .su-input.has-toggle { padding-right: 40px; }

        .su-toggle-pw {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          line-height: 0;
        }
        .su-toggle-pw:hover { color: #818cf8; }
        .su-toggle-pw svg {
          width: 16px;
          height: 16px;
        }

        /* Password strength bar */
        .strength-bar-wrap {
          margin-top: 8px;
          display: flex;
          gap: 4px;
        }
        .strength-seg {
          flex: 1;
          height: 3px;
          border-radius: 99px;
          background: rgba(255,255,255,0.07);
          transition: background 0.3s;
        }
        .strength-seg.active-weak    { background: #ef4444; }
        .strength-seg.active-fair    { background: #f97316; }
        .strength-seg.active-good    { background: #eab308; }
        .strength-seg.active-strong  { background: #22c55e; }

        .strength-label {
          font-size: 11px;
          margin-top: 5px;
          color: #475569;
          min-height: 16px;
          transition: color 0.3s;
        }
        .strength-label.weak   { color: #ef4444; }
        .strength-label.fair   { color: #f97316; }
        .strength-label.good   { color: #eab308; }
        .strength-label.strong { color: #22c55e; }

        .su-submit-btn {
          width: 100%;
          margin-top: 12px;
          padding: 13px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow:
            0 4px 10px rgba(185, 28, 28, 0.5),
            0 8px 24px rgba(127, 29, 29, 0.6);
          display: block;
          text-align: center;
        }

        .su-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .su-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            0 6px 14px rgba(185, 28, 28, 0.6),
            0 14px 36px rgba(127, 29, 29, 0.75),
            0 0 12px rgba(185, 28, 28, 0.4); /* subtle glow */
        }

        .su-submit-btn:hover::before { opacity: 1; }

        .su-submit-btn:active {
          transform: translateY(0px);
          box-shadow: 0 3px 12px rgba(99,102,241,0.3);
        }

        .su-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 28px;
        }
        .su-footer-text {
          font-size: 13px;
          color: #475569;
        }
        .su-footer-link {
          font-size: 13px;
          font-weight: 600;
          color: #818cf8;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
          text-decoration: none;
        }
        .su-footer-link:hover { color: #a5b4fc; }

        .su-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 0;
        }
        .su-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .su-divider-text {
          font-size: 12px;
          color: #334155;
        }
      `}</style>

      <div className="signup-root">
        <div className="su-grid-overlay" />

        <div className="signup-card">
          <div className="su-card-accent" />

          {/* Icon */}
          <div className="su-icon">
            <svg viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>

          <h2 className="su-heading">Create account</h2>
          <p className="su-subheading">Sign up to get started today</p>

          <form onSubmit={handleOnSubmit}>
            {/* Username */}
            <div className="su-field-group">
              <label htmlFor="userName" className="su-label">
                Username
              </label>
              <div className="su-field-wrap">
                <svg
                  className="su-field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  required
                  type="text"
                  id="userName"
                  name="userName"
                  value={userName}
                  onChange={handleOnChange}
                  className="su-input"
                  placeholder="your_username"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="su-field-group">
              <label htmlFor="password" className="su-label">
                Password
              </label>
              <div className="su-field-wrap">
                <svg
                  className="su-field-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleOnChange}
                  className="su-input has-toggle"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="su-toggle-pw"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="su-submit-btn">
              Create Account
            </button>
          </form>

          <div className="su-footer">
            <span className="su-footer-text">Already have an account?</span>
            <Link to="/login" className="su-footer-link">
              Sign in
            </Link>
          </div>

          <div className="su-divider">
            <div className="su-divider-line" />
            <span className="su-divider-text">
              secured with end-to-end encryption
            </span>
            <div className="su-divider-line" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
