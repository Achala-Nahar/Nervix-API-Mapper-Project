import React, { useState } from "react";
import { supabase } from "../supabaseClient"; // Ensure this path correctly points to your initialized client file

const styles = `
  .nx-root {
    min-height: 100vh;
    width: 100%;
    background: #0A1128;
    background-image:
      linear-gradient(rgba(93,173,226,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(93,173,226,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    box-sizing: border-box;
  }

  .nx-card {
    width: 100%;
    max-width: 408px;
    background: #11203F;
    border: 1px solid rgba(93,173,226,0.16);
    border-radius: 16px;
    padding: 40px 36px 36px;
    box-shadow: 0 30px 60px -20px rgba(0,0,0,0.55);
    position: relative;
    overflow: hidden;
  }

  .nx-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
    position: relative;
    height: 56px;
  }

  .nx-pulse {
    position: absolute;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 1px solid rgba(93,173,226,0.35);
    animation: nx-ping 2.4s cubic-bezier(0,0,0.2,1) infinite;
  }
  .nx-pulse.d2 { animation-delay: 0.8s; }
  .nx-pulse.d3 { animation-delay: 1.6s; }

  @keyframes nx-ping {
    0% { transform: scale(0.55); opacity: 0.9; }
    75%, 100% { transform: scale(1.6); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .nx-pulse { animation: none; opacity: 0; }
  }

  .nx-mark {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #5DADE2;
    box-shadow: 0 0 16px 2px rgba(93,173,226,0.6);
    z-index: 1;
  }

  .nx-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #8FA3BF;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    margin-bottom: 18px;
  }

  .nx-back:hover {
    color: #5DADE2;
  }

  .nx-title {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #E8E0CC;
    text-align: center;
    letter-spacing: 0.01em;
    margin: 0 0 6px;
  }

  .nx-subtitle {
    font-size: 14px;
    color: #8FA3BF;
    text-align: center;
    margin: 0 0 30px;
    line-height: 1.5;
  }

  .nx-field {
    margin-bottom: 24px;
  }

  .nx-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #8FA3BF;
    margin-bottom: 7px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .nx-input-wrap {
    position: relative;
    border-left: 2px solid transparent;
    border-radius: 8px;
    transition: border-color 0.18s ease;
  }

  .nx-input-wrap:focus-within {
    border-left-color: #5DADE2;
  }

  .nx-input {
    width: 100%;
    background: #0D1730;
    border: 1px solid rgba(93,173,226,0.18);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 14px;
    color: #E8E0CC;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.18s ease, background 0.18s ease;
    font-family: inherit;
  }

  .nx-input-wrap:focus-within .nx-input {
    border-color: rgba(93,173,226,0.55);
    background: #0F1B38;
  }

  .nx-input::placeholder {
    color: #4C5C78;
  }

  .nx-submit {
    width: 100%;
    padding: 13px;
    background: #5DADE2;
    color: #0A1128;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Space Grotesk', inherit;
    letter-spacing: 0.01em;
    transition: background 0.18s ease, transform 0.06s ease;
    margin-bottom: 8px;
  }

  .nx-submit:hover {
    background: #79BEEA;
  }

  .nx-submit:disabled {
    background: #3A6B8F;
    color: #4C5C78;
    cursor: not-allowed;
  }

  .nx-submit:active {
    transform: scale(0.99);
  }

  .nx-footer-text {
    text-align: center;
    font-size: 13px;
    color: #8FA3BF;
    margin: 22px 0 0;
  }

  .nx-link {
    color: #5DADE2;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    padding: 0;
    font-weight: 600;
  }

  .nx-link:hover {
    color: #E8E0CC;
    text-decoration: underline;
  }

  /* Confirmation state */
  .nx-confirm-icon-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .nx-confirm-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(93,173,226,0.12);
    border: 1px solid rgba(93,173,226,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nx-confirm-email {
    color: #E8E0CC;
    font-weight: 600;
  }

  .nx-resend {
    width: 100%;
    padding: 13px;
    background: transparent;
    color: #5DADE2;
    border: 1px solid rgba(93,173,226,0.35);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Space Grotesk', inherit;
    letter-spacing: 0.01em;
    transition: background 0.18s ease, border-color 0.18s ease;
    margin-bottom: 8px;
  }

  .nx-resend:hover {
    background: rgba(93,173,226,0.08);
    border-color: rgba(93,173,226,0.6);
  }

  .nx-error {
    color: #EA4335;
    background: rgba(234, 67, 53, 0.1);
    border: 1px solid rgba(234, 67, 53, 0.2);
    border-radius: 6px;
    padding: 10px;
    font-size: 13px;
    margin-bottom: 16px;
    text-align: center;
  }
`;

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5DADE2" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Call live Supabase password reset link engine
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Make sure to add a matching update route later!
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      console.log("Password reset link sent to:", email);
      setSubmitted(true);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      alert("Reset email resent successfully!");
    }
  };

  return (
    <div className="nx-root">
      <style>{styles}</style>
      <div className="nx-card">
        <div className="nx-brand">
          <span className="nx-pulse" />
          <span className="nx-pulse d2" />
          <span className="nx-pulse d3" />
          <span className="nx-mark" />
        </div>

        <button
          type="button"
          className="nx-back"
          onClick={() => onNavigate("login")}
        >
          <ArrowLeftIcon />
          Back to sign in
        </button>

        {errorMessage && <div className="nx-error">{errorMessage}</div>}

        {!submitted ? (
          <>
            <h1 className="nx-title">Reset your password</h1>
            <p className="nx-subtitle">
              Enter the email linked to your Nervix account and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="nx-field">
                <label className="nx-label" htmlFor="forgot-email">Email</label>
                <div className="nx-input-wrap">
                  <input
                    id="forgot-email"
                    type="email"
                    className="nx-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="nx-submit" disabled={loading}>
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="nx-confirm-icon-wrap">
              <div className="nx-confirm-icon">
                <MailIcon />
              </div>
            </div>
            <h1 className="nx-title">Check your inbox</h1>
            <p className="nx-subtitle">
              We sent a password reset link to{" "}
              <span className="nx-confirm-email">{email || "your email"}</span>.
              It expires in 15 minutes.
            </p>

            <button type="button" className="nx-resend" onClick={handleResend}>
              Resend email
            </button>
            <button
              type="button"
              className="nx-submit"
              onClick={() => onNavigate("login")}
            >
              Back to sign in
            </button>
          </>
        )}

        <p className="nx-footer-text">
          Don't have an account?{" "}
          <button
            type="button"
            className="nx-link"
            onClick={() => onNavigate("signup")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}