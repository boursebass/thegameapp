import { useState } from "react";

const USERS = [
  { username: "coca", password: "coca123" },
];

export default function Login({ onLogin }) {
  const [user,  setUser]  = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt(e) {
    e.preventDefault();
    const valid = USERS.find(u => u.username === user.trim() && u.password === pass);
    if (valid) {
      sessionStorage.setItem("tga_auth", "1");
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "360px",
        padding: "0 20px",
        animation: shake ? "shake .4s ease" : "none",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: "800",
            fontSize: "28px",
            color: "var(--navy)",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
          }}>
            THE<span style={{ color: "var(--teal)" }}>GAME</span>
            <span style={{ fontWeight: "300" }}>APP</span>
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            color: "var(--muted)",
            textTransform: "uppercase",
            marginTop: "6px",
          }}>MLB · Análisis · Bankroll</div>
        </div>

        {/* Card */}
        <form onSubmit={attempt} style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "32px 28px",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              color: "var(--muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}>Usuario</label>
            <input
              autoFocus
              value={user}
              onChange={e => { setUser(e.target.value); setError(false); }}
              placeholder="usuario"
              style={{ borderColor: error ? "var(--red)" : undefined }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              color: "var(--muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
              placeholder="••••••••"
              style={{ borderColor: error ? "var(--red)" : undefined }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--red)",
              marginBottom: "16px",
              textAlign: "center",
            }}>Usuario o contraseña incorrectos</div>
          )}

          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-sm)",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.3px",
          }}>Entrar</button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
