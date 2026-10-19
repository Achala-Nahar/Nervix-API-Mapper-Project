import React, { useState } from "react";
import { supabase } from "../supabaseClient"; // Ensure this path correctly points to your initialized file
import axios from "axios";
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

  .nx-name-row {
    display: flex;
    gap: 12px;
  }

  .nx-name-row .nx-field {
    flex: 1;
  }

  .nx-field {
    margin-bottom: 18px;
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

  .nx-password-row {
    position: relative;
  }

  .nx-toggle-visibility {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #5DADE2;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 6px;
    font-family: inherit;
    letter-spacing: 0.02em;
  }

  .nx-toggle-visibility:hover {
    color: #E8E0CC;
  }

  .nx-strength-track {
    height: 4px;
    border-radius: 2px;
    background: rgba(93,173,226,0.14);
    margin-top: 8px;
    overflow: hidden;
  }

  .nx-strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.2s ease, background 0.2s ease;
  }

  .nx-strength-label {
    font-size: 11px;
    color: #4C5C78;
    margin-top: 6px;
    letter-spacing: 0.02em;
  }

  .nx-terms {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin: 4px 0 22px;
  }

  .nx-checkbox {
    width: 15px;
    height: 15px;
    accent-color: #5DADE2;
    cursor: pointer;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .nx-terms-text {
    font-size: 12.5px;
    color: #8FA3BF;
    line-height: 1.5;
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
    margin-bottom: 22px;
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

  .nx-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
  }

  .nx-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(93,173,226,0.16);
  }

  .nx-divider-text {
    font-size: 12px;
    color: #4C5C78;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .nx-oauth-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 26px;
  }

  .nx-oauth-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 11px;
    background: #0D1730;
    border: 1px solid rgba(93,173,226,0.18);
    border-radius: 8px;
    color: #E8E0CC;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.18s ease, background 0.18s ease;
  }

  .nx-oauth-btn:hover {
    border-color: rgba(93,173,226,0.5);
    background: #102045;
  }

  .nx-footer-text {
    text-align: center;
    font-size: 13px;
    color: #8FA3BF;
    margin: 0;
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

  @media (max-width: 380px) {
    .nx-name-row {
      flex-direction: column;
      gap: 0;
    }
  }
`;

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.95v2.34C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71c-.18-.55-.28-1.13-.28-1.71s.1-1.16.28-1.71V4.95H.95C.34 6.17 0 7.55 0 9s.34 2.83.95 4.05l3.02-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.95 4.95l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#E8E0CC" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.95.1-.74.39-1.25.71-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/>
    </svg>
  );
}

function getStrength(password) {
  if (!password) return { width: "0%", color: "transparent", label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { width: "25%", color: "#E07A5F", label: "Weak" },
    { width: "50%", color: "#E0B05F", label: "Fair" },
    { width: "75%", color: "#5DADE2", label: "Good" },
    { width: "100%", color: "#6FCF97", label: "Strong" },
  ];
  return levels[Math.min(score, 4) - 1] || levels[0];
}

export default function Signup({ onNavigate }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(""); // Added to map metadata to PostgreSQL profiles
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!agreed) {
      setErrorMessage(
        "You must agree to the Terms of Service and Privacy Policy."
      );
      return;
    }

    setLoading(true);
    try {

      // STEP 1: Create user in Supabase Auth

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // STEP 2: Send user data + Supabase UID to Spring Boot

      const response = await axios.post(
        "http://localhost:8080/auth/signup",
        {
          fullName,
          username,
          email,
          password,
          supabaseUid: data.user.id,
        }
      );

      console.log(response.data);

      alert("Account created successfully!");

      onNavigate("login");

    } catch (error) {

      console.error(error);

      if (error.response?.data) {
        setErrorMessage(error.response.data);
      } else {
        setErrorMessage(error.message || "Signup failed");
      }

    }
     finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setErrorMessage(error.message);
  };

  const handleGithubSignUp = async () => {
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
    if (error) setErrorMessage(error.message);
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

        <h1 className="nx-title">Create your Nervix account</h1>
        <p className="nx-subtitle">Start mapping in minutes — no credit card required.</p>

        {errorMessage && <div className="nx-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="nx-field">
            <label className="nx-label" htmlFor="signup-name">Full name</label>
            <div className="nx-input-wrap">
              <input
                id="signup-name"
                type="text"
                className="nx-input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="signup-username">Username</label>
            <div className="nx-input-wrap">
              <input
                id="signup-username"
                type="text"
                className="nx-input"
                placeholder="janedoe123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="signup-email">Email</label>
            <div className="nx-input-wrap">
              <input
                id="signup-email"
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

          <div className="nx-field">
            <label className="nx-label" htmlFor="signup-password">Password</label>
            <div className="nx-input-wrap nx-password-row">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="nx-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: 56 }}
                required
              />
              <button
                type="button"
                className="nx-toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            <div className="nx-strength-track">
              <div
                className="nx-strength-fill"
                style={{ width: strength.width, background: strength.color }}
              />
            </div>
            {strength.label && (
              <div className="nx-strength-label">{strength.label} password</div>
            )}
          </div>

          <label className="nx-terms">
            <input
              type="checkbox"
              className="nx-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="nx-terms-text">
              I agree to Nervix's Terms of Service and Privacy Policy.
            </span>
          </label>

          <button type="submit" className="nx-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="nx-divider">
          <span className="nx-divider-line" />
          <span className="nx-divider-text">Or continue with</span>
          <span className="nx-divider-line" />
        </div>

        <div className="nx-oauth-group">
          <button
            type="button"
            className="nx-oauth-btn"
            onClick={handleGoogleSignUp}
          >
            <GoogleIcon />
            Sign up with Google
          </button>
          <button
            type="button"
            className="nx-oauth-btn"
            onClick={handleGithubSignUp}
          >
            <GithubIcon />
            Sign up with GitHub
          </button>
        </div>

        <p className="nx-footer-text">
          Already have an account?{" "}
          <button
            type="button"
            className="nx-link"
            onClick={() => onNavigate("login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}