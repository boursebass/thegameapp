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
      background: "linear-gradient(135deg, #e8f5f0 0%, #f0f7f4 50%, #e5f0f8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blobs suaves */}
      <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle, rgba(24,132,133,0.18) 0%, transparent 70%)", top:"-150px", left:"-100px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"450px", height:"450px", borderRadius:"50%", background:"radial-gradient(circle, rgba(132,203,138,0.15) 0%, transparent 70%)", bottom:"-100px", right:"-80px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"350px", height:"350px", borderRadius:"50%", background:"radial-gradient(circle, rgba(24,79,111,0.08) 0%, transparent 70%)", top:"40%", left:"40%", pointerEvents:"none" }} />

      <div style={{
        width: "100%",
        maxWidth: "380px",
        padding: "0 20px",
        position: "relative",
        zIndex: 1,
        animation: shake ? "shake .4s ease" : "fadeUp .4s cubic-bezier(.16,1,.3,1) both",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: "800", fontSize: "30px",
            color: "#184f6f", letterSpacing: "-0.5px",
            textTransform: "uppercase",
          }}>
            THE<span style={{ color: "#188485" }}>GAME</span>
            <span style={{ fontWeight: "300", color:"#6b7280" }}>APP</span>
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "9px",
            letterSpacing: "3px", color: "#9ca3af",
            textTransform: "uppercase", marginTop: "6px",
          }}>MLB · Análisis · Bankroll</div>
        </div>

        {/* Glass card */}
        <form onSubmit={attempt} style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 8px 40px rgba(24,79,111,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace", fontSize: "9px",
              letterSpacing: "2px", color: "#6b7280",
              textTransform: "uppercase", display: "block", marginBottom: "7px",
            }}>Usuario</label>
            <input
              autoFocus
              value={user}
              onChange={e => { setUser(e.target.value); setError(false); }}
              placeholder="usuario"
              style={{ borderColor: error ? "#c8102e" : undefined }}
            />
          </div>

          <div style={{ marginBottom: "26px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace", fontSize: "9px",
              letterSpacing: "2px", color: "#6b7280",
              textTransform: "uppercase", display: "block", marginBottom: "7px",
            }}>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
              placeholder="••••••••"
              style={{ borderColor: error ? "#c8102e" : undefined }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: "11px",
              color: "#c8102e", marginBottom: "16px",
              textAlign: "center", letterSpacing: "0.3px",
            }}>Usuario o contraseña incorrectos</div>
          )}

          <button type="submit" style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #184f6f 0%, #188485 100%)",
            color: "#fff", border: "none",
            borderRadius: "10px", fontSize: "13px", fontWeight: "700",
            cursor: "pointer", letterSpacing: "0.4px",
            boxShadow: "0 4px 16px rgba(24,79,111,0.3)",
            transition: "opacity .15s, transform .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity="0.92"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}
          >Entrar</button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%      { transform:translateX(-10px); }
          40%      { transform:translateX(10px); }
          60%      { transform:translateX(-7px); }
          80%      { transform:translateX(7px); }
        }
      `}</style>
    </div>
  );
}
