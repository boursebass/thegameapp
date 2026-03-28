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
  const SettingsIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
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

        {/* Date + Settings */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          paddingLeft: "16px",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <span className="hide-mobile" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px", color: "rgba(255,255,255,0.3)",
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>
            {new Date().toLocaleDateString("es-MX",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()}
          </span>

          <button onClick={() => onNav("settings")} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "34px", height: "34px",
            borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)",
            background: view === "settings" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
            color: view === "settings" ? "#fff" : "rgba(255,255,255,0.45)",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = view === "settings" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"; e.currentTarget.style.color = view === "settings" ? "#fff" : "rgba(255,255,255,0.45)"; }}
          title="Ajustes"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
