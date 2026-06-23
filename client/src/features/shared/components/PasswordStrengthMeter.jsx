import React from "react";

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=`~[\]\\/]/.test(password),
  };

  const count = Object.values(checks).filter(Boolean).length;

  let label = "Weak";
  let color = "var(--color-error)"; // Red
  let score = count;

  if (count === 4) {
    label = "Strong";
    color = "var(--color-success)"; // Green
  } else if (count >= 2) {
    label = "Medium";
    color = "var(--color-warning)"; // Yellow/Orange
  }

  return { score, label, color, checks };
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { score, label, color, checks } = getPasswordStrength(password);

  return (
    <div className="password-strength-meter" style={{ marginTop: "10px", marginBottom: "15px" }}>
      {/* Real-time Strength Progress Bar */}
      <div style={{ display: "flex", gap: "6px", height: "4px", marginBottom: "8px" }}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              flex: 1,
              backgroundColor: step <= score ? color : "var(--color-border-default)",
              borderRadius: "2px",
              transition: "background-color 0.25s ease"
            }}
          />
        ))}
      </div>
      
      {/* Label Indicator */}
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "500" }}>
          Password Strength: <strong style={{ color }}>{label}</strong>
        </span>
      </div>

      {/* Rules Checklist */}
      <ul style={{ 
        listStyle: "none", 
        padding: 0, 
        margin: 0, 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "6px" 
      }}>
        <li style={{ 
          fontSize: "12px", 
          color: checks.length ? "var(--color-success)" : "var(--color-text-tertiary)", 
          display: "flex", 
          alignItems: "center", 
          gap: "6px",
          transition: "color 0.2s"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>{checks.length ? "✓" : "○"}</span> At least 8 characters
        </li>
        <li style={{ 
          fontSize: "12px", 
          color: checks.uppercase ? "var(--color-success)" : "var(--color-text-tertiary)", 
          display: "flex", 
          alignItems: "center", 
          gap: "6px",
          transition: "color 0.2s"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>{checks.uppercase ? "✓" : "○"}</span> One uppercase letter
        </li>
        <li style={{ 
          fontSize: "12px", 
          color: checks.digit ? "var(--color-success)" : "var(--color-text-tertiary)", 
          display: "flex", 
          alignItems: "center", 
          gap: "6px",
          transition: "color 0.2s"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>{checks.digit ? "✓" : "○"}</span> One number
        </li>
        <li style={{ 
          fontSize: "12px", 
          color: checks.special ? "var(--color-success)" : "var(--color-text-tertiary)", 
          display: "flex", 
          alignItems: "center", 
          gap: "6px",
          transition: "color 0.2s"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>{checks.special ? "✓" : "○"}</span> One special character
        </li>
      </ul>
    </div>
  );
}
