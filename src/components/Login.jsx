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
      background: "#071525",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position:"absolute", width:"600px", height:"600px", borderRadius:"50%", background:"rgba(24,132,133,0.3)", filter:"blur(90px)", top:"-150px", left:"-150px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", background:"rgba(132,203,138,0.2)", filter:"blur(80px)", bottom:"-100px", right:"-100px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"rgba(24,79,111,0.35)", filter:"blur(70px)", top:"40%", left:"35%", pointerEvents:"none" }} />

      <div style={{
        width: "100%",
        maxWidth: "380px",
        padding: "0 20px",
        position: "relative",
        zIndex: 1,
        animation: shake ? "shake .4s ease" : "fadeUp .4s cubic-bezier(.16,1,.3,1) both",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: "800",
            fontSize: "32px",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
            color: "#fff",
          }}>
            THE<span style={{ color: "#2dd4bf" }}>GAME</span>
            <span style={{ fontWeight: "300", color:"rgba(255,255,255,0.5)" }}>APP</span>
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "3px",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            marginTop: "8px",
          }}>MLB · Análisis · Bankroll</div>
        </div>

        {/* Glass card */}
        <form onSubmit={attempt} style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "7px",
            }}>Usuario</label>
            <input
              autoFocus
              value={user}
              onChange={e => { setUser(e.target.value); setError(false); }}
              placeholder="usuario"
              style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "7px",
            }}>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
              placeholder="••••••••"
              style={{ borderColor: error ? "rgba(248,113,113,0.6)" : undefined }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "#f87171",
              marginBottom: "18px",
              textAlign: "center",
              letterSpacing: "0.5px",
            }}>Usuario o contraseña incorrectos</div>
          )}

          <button type="submit" style={{
            width: "100%",
            padding: "13px",
            background: "linear-gradient(135deg, #188485 0%, #2dd4bf 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.5px",
            boxShadow: "0 4px 20px rgba(45,212,191,0.35)",
            transition: "opacity .15s, transform .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Entrar</button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-7px); }
          80%      { transform: translateX(7px); }
        }
      `}</style>
    </div>
  );
}
