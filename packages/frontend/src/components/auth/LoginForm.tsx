import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { validateEmail, validatePassword, required } from "../../utils/validation";
import { ApiError } from "../../services/api-client";

/**
 * Login form with email/username and password fields, validation, and error display.
 */
export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const loginCheck = required(loginField, "Email or username");
    if (!loginCheck.valid) newErrors.login = loginCheck.message;

    const passCheck = required(password, "Password");
    if (!passCheck.valid) newErrors.password = passCheck.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ login: loginField.trim(), password });
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? "Invalid credentials. Please try again."
          : "An unexpected error occurred.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--accent-red)",
  };

  const formErrorStyle: React.CSSProperties = {
    padding: "10px 12px",
    background: "rgba(248, 81, 73, 0.1)",
    border: "1px solid rgba(248, 81, 73, 0.3)",
    borderRadius: "var(--radius)",
    color: "var(--accent-red)",
    fontSize: "13px",
  };

  const linkRow: React.CSSProperties = {
    textAlign: "center",
    fontSize: "14px",
    color: "var(--text-secondary)",
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit} noValidate>
      {errors.form && <div style={formErrorStyle}>{errors.form}</div>}

      <div style={fieldStyle}>
        <label htmlFor="login" style={labelStyle}>
          Email or Username
        </label>
        <input
          id="login"
          className="input"
          type="text"
          value={loginField}
          onChange={(e) => setLoginField(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
          disabled={submitting}
        />
        {errors.login && <span style={errorStyle}>{errors.login}</span>}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="password" style={labelStyle}>
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={submitting}
        />
        {errors.password && <span style={errorStyle}>{errors.password}</span>}
      </div>

      <button
        className="btn btn-primary w-full"
        type="submit"
        disabled={submitting}
        style={{ justifyContent: "center", padding: "10px" }}
      >
        {submitting ? "Signing in…" : "Sign In"}
      </button>

      <div style={linkRow}>
        Don&apos;t have an account?{" "}
        <Link to="/register">Sign up</Link>
      </div>
    </form>
  );
};
