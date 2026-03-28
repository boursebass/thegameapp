import { useState } from "react";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px 20px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
};

function ConfBadge({ v }) {
  const col = v >= 70 ? "var(--teal)" : v >= 55 ? "#f59e0b" : "var(--red)";
  return (
    <span style={{
      fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700",
      background:`${col}18`, color:col, border:`1px solid ${col}40`,
      borderRadius:"4px", padding:"2px 7px",
    }}>{v}%</span>
  );
}

export default function Predicciones({ predictions, setPredictions }) {
  const [search,    setSearch]    = useState("");
  const [expanded,  setExpanded]  = useState(null);
  const [sortBy,    setSortBy]    = useState("date"); // date | conf | picks

  function deletePred(id) {
    if (!confirm("¿Eliminar esta predicción?")) return;
    setPredictions(prev => prev.filter(p => p.id !== id));
  }

  const filtered = predictions
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (p.homeTeam||"").toLowerCase().includes(s) || (p.awayTeam||"").toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === "date")  return new Date(b.date) - new Date(a.date);
      if (sortBy === "conf")  return (b.picks?.[0]?.confianza||0) - (a.picks?.[0]?.confianza||0);
      if (sortBy === "picks") return (b.picks?.length||0) - (a.picks?.length||0);
      return 0;
    });

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom:"24px" }}>
        <span style={S.label}>Historial</span>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Predicciones</h1>
        <p style={{ fontSize:"12px", color:"var(--muted)" }}>{predictions.length} análisis guardados</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar equipo..."
          style={{ flex:"1", minWidth:"180px", maxWidth:"280px" }}
        />
        <div style={{ display:"flex", gap:"6px" }}>
          {[["date","Recientes"],["conf","Confianza"],["picks","Picks"]].map(([val,lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{
              padding:"7px 14px", borderRadius:"var(--r-sm)", border:`1px solid ${sortBy===val?"var(--teal)":"var(--border)"}`,
              background:sortBy===val?"rgba(24,132,133,0.1)":"var(--bg-card)",
              color:sortBy===val?"var(--teal)":"var(--muted)",
              fontSize:"12px", fontWeight:sortBy===val?"600":"400", cursor:"pointer",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"60px", color:"var(--muted)" }}>
          {predictions.length === 0 ? "Sin predicciones guardadas aún. Ve a Analizar para generar una." : "Sin resultados para esta búsqueda."}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {filtered.map(p => {
            const isOpen = expanded === p.id;
            const topPick = p.picks?.[0];
            return (
              <div key={p.id} style={{ ...S.card, padding:0, overflow:"hidden" }}>
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", cursor:"pointer" }}
                >
                  {/* Date */}
                  <div style={{ textAlign:"center", minWidth:"44px", flexShrink:0 }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"18px", fontWeight:"600", color:"var(--navy)", lineHeight:1 }}>
                      {new Date(p.date).getDate()}
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"1px" }}>
                      {new Date(p.date).toLocaleDateString("es-MX",{month:"short"}).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ width:"1px", height:"36px", background:"var(--border)", flexShrink:0 }} />

                  {/* Teams */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", fontWeight:"700", color:"var(--text)", marginBottom:"2px" }}>
                      {p.homeTeam?.split(" ").slice(-1)[0]} <span style={{ fontWeight:"300", color:"var(--muted)" }}>vs</span> {p.awayTeam?.split(" ").slice(-1)[0]}
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>
                      {p.homeTeam} · {p.picks?.length||0} picks
                    </div>
                  </div>

                  {/* Badge */}
                  {topPick && <ConfBadge v={topPick.confianza} />}

                  {/* Arrow */}
                  <span style={{ color:"var(--muted)", fontSize:"11px", marginLeft:"4px" }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:"16px 18px", background:"var(--bg-sub)" }}>

                    {/* Picks */}
                    {p.picks?.length > 0 && (
                      <div style={{ marginBottom:"14px" }}>
                        <span style={S.label}>Picks</span>
                        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                          {p.picks.map((pick, i) => (
                            <div key={i} style={{
                              display:"flex", alignItems:"center", gap:"10px",
                              background:"var(--bg-card)", border:"1px solid var(--border)",
                              borderRadius:"var(--r-sm)", padding:"10px 14px",
                            }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)" }}>
                                  {pick.mercado}: <span style={{ color:"var(--teal)" }}>{pick.seleccion}</span>
                                </div>
                                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"2px" }}>
                                  Momio: {pick.momio} · Stake: {pick.stake}u
                                </div>
                              </div>
                              <ConfBadge v={pick.confianza} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resumen */}
                    {p.resumen && (
                      <div style={{ marginBottom:"14px" }}>
                        <span style={S.label}>Resumen</span>
                        <p style={{ fontSize:"13px", color:"var(--text)", lineHeight:"1.6", margin:0 }}>{p.resumen}</p>
                      </div>
                    )}

                    {/* Full text toggle */}
                    {p.rawText && (
                      <details style={{ marginBottom:"10px" }}>
                        <summary style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)", cursor:"pointer", letterSpacing:"1px" }}>
                          VER ANÁLISIS COMPLETO
                        </summary>
                        <pre style={{
                          marginTop:"10px", padding:"14px",
                          background:"#f8fafc", border:"1px solid var(--border)",
                          borderRadius:"var(--r-sm)", fontSize:"11px",
                          color:"var(--text)", lineHeight:"1.7",
                          whiteSpace:"pre-wrap", fontFamily:"'DM Mono',monospace",
                          maxHeight:"300px", overflowY:"auto",
                        }}>{p.rawText}</pre>
                      </details>
                    )}

                    <button onClick={() => deletePred(p.id)} style={{
                      padding:"7px 14px", background:"none",
                      border:"1px solid #fecaca", borderRadius:"var(--r-sm)",
                      fontSize:"11px", color:"var(--red)", cursor:"pointer",
                    }}>Eliminar predicción</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
