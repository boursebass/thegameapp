const VIEWS = [
  { id:"dashboard",    label:"Inicio"       },
  { id:"analizar",     label:"Analizar"     },
  { id:"equipos",      label:"Equipos"      },
  { id:"predicciones", label:"Predicciones" },
  { id:"bankroll",     label:"Bankroll"     },
  { id:"estadisticas", label:"Estadísticas" },
  { id:"settings",     label:"Ajustes"      },
];

export default function TopNav({ view, onNav, pendingBets = 0 }) {
  return (
    <header style={{
      background: "rgba(24,79,111,0.88)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      position: "sticky", top: 0, zIndex: 200,
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 2px 20px rgba(24,79,111,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
    }}>
      <div style={{
        maxWidth: "1440px", margin: "0 auto",
        padding: "0 clamp(12px,2.5vw,28px)",
        display: "flex", alignItems: "stretch", height: "60px",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center",
          paddingRight: "24px", marginRight: "4px",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: "800", fontSize: "15px",
            color: "#fff", letterSpacing: "-0.3px",
            textTransform: "uppercase",
          }}>
            THE<span style={{ color: "#84cb8a" }}>GAME</span>
            <span style={{ fontWeight: "300", marginLeft: "2px", color:"rgba(255,255,255,0.55)" }}>APP</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flex: 1, overflowX: "auto" }}>
          {VIEWS.map(v => {
            const active = view === v.id;
            return (
              <button key={v.id} onClick={() => onNav(v.id)}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: active ? "600" : "400",
                  padding: "0 16px",
                  height: "60px",
                  border: "none",
                  borderBottom: `2px solid ${active ? "#84cb8a" : "transparent"}`,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "color .15s, background .15s",
                  backdropFilter: active ? "blur(8px)" : "none",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}}
              >
                {v.label}
                {v.id === "bankroll" && pendingBets > 0 && (
                  <span style={{
                    background: "#c8102e", color: "#fff",
                    borderRadius: "10px", padding: "1px 7px",
                    fontSize: "9px", fontWeight: "800",
                  }}>{pendingBets}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Date */}
        <div className="hide-mobile" style={{
          display: "flex", alignItems: "center",
          paddingLeft: "20px",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px", color: "rgba(255,255,255,0.3)",
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>
            {new Date().toLocaleDateString("es-MX",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
