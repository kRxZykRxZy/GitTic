import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
    validateEmail,
    validatePassword,
    validateUsername,
    validatePasswordMatch,
} from "../../utils/validation";
import { COUNTRIES } from "../../utils/constants";
import { ApiError } from "../../services/api-client";

/**
 * Register form with username, email, password, confirm password,
 * country selector, COPPA age verification, and terms acceptance.
 */
export const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [country, setCountry] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Real-time username availability check
    const checkUsernameAvailability = async (usernameToCheck: string) => {
        if (!usernameToCheck || usernameToCheck.length < 3) return;

        setCheckingUsername(true);
        try {
            const response = await fetch(`/api/v1/auth/check-username?username=${encodeURIComponent(usernameToCheck)}`);
            const data = await response.json();

            if (data.available === false) {
                setErrors(prev => ({ ...prev, username: "This username is already taken" }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors.username === "This username is already taken") {
                        delete newErrors.username;
                    }
                    return newErrors;
                });
            }
        } catch (err) {
            console.error("Failed to check username availability:", err);
        } finally {
            setCheckingUsername(false);
        }
    };

    // Real-time email availability check
    const checkEmailAvailability = async (emailToCheck: string) => {
        if (!emailToCheck || !emailToCheck.includes("@")) return;

        setCheckingEmail(true);
        try {
            const response = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(emailToCheck)}`);
            const data = await response.json();

            if (data.available === false) {
                setErrors(prev => ({ ...prev, email: "This email is already registered" }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors.email === "This email is already registered") {
                        delete newErrors.email;
                    }
                    return newErrors;
                });
            }
        } catch (err) {
            console.error("Failed to check email availability:", err);
        } finally {
            setCheckingEmail(false);
        }
    };

    // Debounced username check
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (username.trim().length >= 3) {
                checkUsernameAvailability(username.trim());
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    // Debounced email check
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (email.trim().includes("@")) {
                checkEmailAvailability(email.trim());
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [email]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        const usernameCheck = validateUsername(username);
        if (!usernameCheck.valid) newErrors.username = usernameCheck.message;

        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) newErrors.email = emailCheck.message;

        const passCheck = validatePassword(password);
        if (!passCheck.valid) newErrors.password = passCheck.message;

        const matchCheck = validatePasswordMatch(password, confirmPassword);
        if (!matchCheck.valid) newErrors.confirmPassword = matchCheck.message;

        // Validate date of birth
        if (!dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required";
        } else {
            const age = calculateAge(dateOfBirth);
            if (age < 13) {
                newErrors.dateOfBirth = "You must be at least 13 years old to use this platform";
            } else if (age > 150) {
                newErrors.dateOfBirth = "Please enter a valid date of birth";
            }
        }

        if (!termsAccepted) {
            newErrors.terms = "You must accept the terms of service and privacy policy";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await register({
                username: username.trim(),
                email: email.trim(),
                password,
                country: country || undefined,
                ageVerified: true,
                termsAccepted,
            });
            toast.success("Account created successfully!");
            navigate("/");
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message || "Registration failed. Please check your information."
                    : "An unexpected error occurred.";

            // Handle specific error messages from backend
            const errorData = err instanceof ApiError ? err.body : null;
            const newErrors: Record<string, string> = {};

            if (typeof errorData === "object" && errorData !== null && "error" in errorData) {
                const backendError = (errorData as { error?: unknown }).error;
                const errorMsg = typeof backendError === "string" ? backendError.toLowerCase() : "";

                if (errorMsg.includes("username") && errorMsg.includes("taken")) {
                    newErrors.username = "This username is already taken";
                } else if (errorMsg.includes("username") && errorMsg.includes("exists")) {
                    newErrors.username = "This username already exists";
                } else if (errorMsg.includes("email") && errorMsg.includes("taken")) {
                    newErrors.email = "This email is already registered";
                } else if (errorMsg.includes("email") && errorMsg.includes("exists")) {
                    newErrors.email = "This email already exists";
                } else if (errorMsg.includes("email") && errorMsg.includes("use")) {
                    newErrors.email = "This email is already in use";
                } else if (errorMsg.includes("username") && errorMsg.includes("use")) {
                    newErrors.username = "This username is already in use";
                } else {
                    newErrors.form = typeof backendError === "string" ? backendError : message;
                }
            } else {
                newErrors.form = message;
            }

            setErrors(newErrors);

            // Show toast for specific field errors
            if (newErrors.username) {
                toast.error(newErrors.username);
            } else if (newErrors.email) {
                toast.error(newErrors.email);
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
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

    const checkboxRow: React.CSSProperties = {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        fontSize: "13px",
        color: "var(--text-secondary)",
    };

    const selectStyle: React.CSSProperties = {
        width: "100%",
        padding: "6px 12px",
        fontSize: "14px",
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        color: "var(--text-primary)",
    };

    return (
        <form style={formStyle} onSubmit={handleSubmit} noValidate>
            {errors.form && <div style={formErrorStyle}>{errors.form}</div>}

            <div style={fieldStyle}>
                <label htmlFor="reg-username" style={labelStyle}>
                    Username
                    {checkingUsername && <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>Checking...</span>}
                </label>
                <input id="reg-username" className="input" type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)} placeholder="my-username"
                    autoComplete="username" disabled={submitting}
                    style={{
                        borderColor: errors.username ? "var(--accent-red)" : undefined,
                    }}
                />
                {errors.username && <span style={errorStyle}>{errors.username}</span>}
                {!errors.username && username.length >= 3 && !checkingUsername && (
                    <span style={{ fontSize: "12px", color: "var(--accent-green)" }}>✓ Username available</span>
                )}
            </div>

            <div style={fieldStyle}>
                <label htmlFor="reg-email" style={labelStyle}>
                    Email
                    {checkingEmail && <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>Checking...</span>}
                </label>
                <input id="reg-email" className="input" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    autoComplete="email" disabled={submitting}
                    style={{
                        borderColor: errors.email ? "var(--accent-red)" : undefined,
                    }}
                />
                {errors.email && <span style={errorStyle}>{errors.email}</span>}
                {!errors.email && email.includes("@") && !checkingEmail && (
                    <span style={{ fontSize: "12px", color: "var(--accent-green)" }}>✓ Email available</span>
                )}
            </div>

            <div style={fieldStyle}>
                <label htmlFor="reg-password" style={labelStyle}>Password</label>
                <input id="reg-password" className="input" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"
                    autoComplete="new-password" disabled={submitting} />
                {errors.password && <span style={errorStyle}>{errors.password}</span>}
            </div>

            <div style={fieldStyle}>
                <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
                <input id="reg-confirm" className="input" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                    autoComplete="new-password" disabled={submitting} />
                {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword}</span>}
            </div>

            <div style={fieldStyle}>
                <label htmlFor="reg-dob" style={labelStyle}>
                    Date of Birth <span style={{ color: "var(--accent-red)" }}>*</span>
                </label>
                <input
                    id="reg-dob"
                    className="input"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={submitting}
                />
                {errors.dateOfBirth && <span style={errorStyle}>{errors.dateOfBirth}</span>}
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    You must be at least 13 years old to use DevForge
                </span>
            </div>

            <div style={fieldStyle}>
                <label htmlFor="reg-country" style={labelStyle}>Country (optional)</label>
                <select id="reg-country" style={selectStyle} value={country}
                    onChange={(e) => setCountry(e.target.value)} disabled={submitting}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div style={fieldStyle}>
                <label style={checkboxRow}>
                    <input type="checkbox" checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)} disabled={submitting} />
                    <span>
                        I accept the <Link to="/terms" target="_blank" style={{ color: "var(--accent-blue)" }}>Terms of Service</Link> and{" "}
                        <Link to="/privacy" target="_blank" style={{ color: "var(--accent-blue)" }}>Privacy Policy</Link>
                    </span>
                </label>
                {errors.terms && <span style={errorStyle}>{errors.terms}</span>}
            </div>

            <button className="btn btn-primary w-full" type="submit" disabled={submitting}
                style={{ justifyContent: "center", padding: "10px" }}>
                {submitting ? "Creating account…" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
                Already have an account? <Link to="/login">Sign in</Link>
            </div>
        </form>
    );
};
