import { useState, useMemo } from "react";
import { computeBankroll } from "../lib/math";
import { callClaude } from "../lib/claude";
import { storage } from "../lib/storage";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px 20px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
};

function Bar({ pct, color }) {
  return (
    <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:color||"var(--teal)", borderRadius:"3px", transition:"width .4s" }} />
    </div>
  );
}

export default function Estadisticas({ bets, predictions, bankroll }) {
  const [report,      setReport]      = useState("");
  const [loadReport,  setLoadReport]  = useState(false);
  const [period,      setPeriod]      = useState("all"); // all | week | month

  const stats = computeBankroll(bankroll?.starting || 0, bets);

  const filtered = useMemo(() => {
    if (period === "all") return bets;
    const now = new Date();
    const cutoff = period === "week"
      ? new Date(now - 7  * 86400000)
      : new Date(now - 30 * 86400000);
    return bets.filter(b => b.date && new Date(b.date) >= cutoff);
  }, [bets, period]);

  const fStats = useMemo(() => computeBankroll(bankroll?.starting || 0, filtered), [filtered, bankroll]);

  // By market type
  const byMarket = useMemo(() => {
    const map = {};
    filtered.filter(b => b.result && b.result !== "pending").forEach(b => {
      const m = b.market || "Sin mercado";
      if (!map[m]) map[m] = { wins:0, losses:0, pushes:0, staked:0, profit:0 };
      const odds = parseFloat(b.odds);
      const stake = parseFloat(b.stake);
      if (b.result === "W") {
        const payout = odds > 0 ? stake * (odds/100) : stake * (100/Math.abs(odds));
        map[m].wins++;
        map[m].profit += payout;
      } else if (b.result === "L") {
        map[m].losses++;
        map[m].profit -= stake;
      } else {
        map[m].pushes++;
      }
      map[m].staked += stake;
    });
    return Object.entries(map).sort((a,b) => (b[1].wins+b[1].losses) - (a[1].wins+a[1].losses));
  }, [filtered]);

  // Daily P&L
  const dailyPnl = useMemo(() => {
    const map = {};
    filtered.filter(b => b.result && b.result !== "pending" && b.date).forEach(b => {
      const d = b.date.split("T")[0];
      if (!map[d]) map[d] = 0;
      const odds = parseFloat(b.odds);
      const stake = parseFloat(b.stake);
      if (b.result === "W") {
        const payout = odds > 0 ? stake * (odds/100) : stake * (100/Math.abs(odds));
        map[d] += payout;
      } else if (b.result === "L") {
        map[d] -= stake;
      }
    });
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0])).slice(-14);
  }, [filtered]);

  const maxAbs = useMemo(() => Math.max(...dailyPnl.map(([,v]) => Math.abs(v)), 1), [dailyPnl]);

  async function generateReport() {
    const key = storage.getAnthropicKey();
    if (!key) { alert("Configura tu API key de Anthropic en Ajustes."); return; }
    setLoadReport(true); setReport("");
    const summary = `
Período: ${period}
Capital inicial: $${bankroll?.starting?.toFixed(2)||"?"}
Capital actual: $${fStats.bank.toFixed(2)}
P&L: ${fStats.totalProfit>=0?"+":""}$${fStats.totalProfit.toFixed(2)}
ROI: ${fStats.roi.toFixed(1)}%
Record: ${fStats.wins}W - ${fStats.losses}L - ${fStats.pushes}P
Win Rate: ${fStats.winRate.toFixed(1)}%
Total apostado: $${fStats.totalStaked.toFixed(2)}
Racha actual: ${fStats.streakType}${fStats.streak}

Por mercado:
${byMarket.map(([m,s]) => `  ${m}: ${s.wins}W-${s.losses}L, P&L $${s.profit.toFixed(2)}`).join("\n")}
`;
    try {
      const text = await callClaude(
        `Eres un analista de apuestas deportivas. Dame un reporte conciso (máx 300 palabras) en español sobre el siguiente rendimiento de bankroll:\n\n${summary}\n\nIncluye: puntos fuertes, áreas de mejora y 2-3 recomendaciones específicas.`,
        600
      );
      setReport(text);
    } catch(e) {
      setReport("Error al generar el reporte: " + e.message);
    }
    setLoadReport(false);
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={S.label}>Rendimiento</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Estadísticas</h1>
          <p style={{ fontSize:"12px", color:"var(--muted)" }}>{bets.filter(b=>b.result&&b.result!=="pending").length} apuestas resueltas</p>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          {[["all","Todo"],["month","30d"],["week","7d"]].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              padding:"7px 14px", borderRadius:"var(--r-sm)", border:`1px solid ${period===v?"var(--teal)":"var(--border)"}`,
              background:period===v?"rgba(24,132,133,0.1)":"var(--bg-card)",
              color:period===v?"var(--teal)":"var(--muted)",
              fontSize:"12px", fontWeight:period===v?"600":"400", cursor:"pointer",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"P&L",       value:`${fStats.totalProfit>=0?"+":""}$${fStats.totalProfit.toFixed(2)}`, color:fStats.totalProfit>=0?"var(--teal)":"var(--red)" },
          { label:"ROI",       value:`${fStats.roi>=0?"+":""}${fStats.roi.toFixed(1)}%`,                 color:fStats.roi>=0?"var(--teal)":"var(--red)" },
          { label:"Win Rate",  value:`${fStats.winRate.toFixed(1)}%`,                                     color:fStats.winRate>=55?"var(--green)":fStats.winRate>=45?"#f59e0b":"var(--red)" },
          { label:"Record",    value:`${fStats.wins}-${fStats.losses}-${fStats.pushes}`,                  color:"var(--navy)" },
          { label:"Apostado",  value:`$${fStats.totalStaked.toFixed(2)}`,                                 color:"var(--navy)" },
          { label:"Racha",     value:fStats.wins+fStats.losses>0?`${fStats.streakType}${fStats.streak}`:"—", color:fStats.streakType==="W"?"var(--green)":fStats.streakType==="L"?"var(--red)":"var(--muted)" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, padding:"14px" }}>
            <span style={S.label}>{s.label}</span>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"18px", fontWeight:"600", color:s.color, lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Daily P&L bars */}
      {dailyPnl.length > 0 && (
        <div style={{ ...S.card, marginBottom:"20px" }}>
          <span style={S.label}>P&L diario (últimas sesiones)</span>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"4px", height:"80px", marginTop:"12px" }}>
            {dailyPnl.map(([date, val]) => {
              const pct = (Math.abs(val) / maxAbs) * 100;
              const col = val >= 0 ? "var(--teal)" : "var(--red)";
              return (
                <div key={date} title={`${date}: ${val>=0?"+":""}$${val.toFixed(2)}`}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", gap:"3px" }}>
                  <div style={{ width:"100%", height:`${pct}%`, minHeight:"3px", background:col, borderRadius:"2px 2px 0 0" }} />
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"7px", color:"var(--muted)", transform:"rotate(-45deg)", whiteSpace:"nowrap" }}>
                    {date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By market */}
      {byMarket.length > 0 && (
        <div style={{ ...S.card, marginBottom:"20px" }}>
          <span style={S.label}>Por mercado</span>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"12px" }}>
            {byMarket.map(([m, s]) => {
              const total = s.wins + s.losses;
              const wr = total > 0 ? (s.wins / total) * 100 : 0;
              return (
                <div key={m}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"600", color:"var(--text)" }}>{m}</span>
                    <div style={{ display:"flex", gap:"12px" }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)" }}>{s.wins}W-{s.losses}L</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:s.profit>=0?"var(--teal)":"var(--red)", fontWeight:"700" }}>
                        {s.profit>=0?"+":""}{s.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Bar pct={wr} color={wr>=55?"var(--green)":wr>=45?"#f59e0b":"var(--red)"} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Report */}
      <div style={{ ...S.card }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <span style={S.label}>Reporte de rendimiento (IA)</span>
          <button onClick={generateReport} disabled={loadReport} style={{
            padding:"8px 16px", background:"var(--teal)", color:"#fff",
            border:"none", borderRadius:"var(--r-sm)", fontSize:"12px",
            fontWeight:"700", cursor:loadReport?"wait":"pointer",
            opacity:loadReport?0.7:1,
          }}>
            {loadReport ? "Analizando..." : "Generar reporte"}
          </button>
        </div>
        {report ? (
          <p style={{ fontSize:"13px", color:"var(--text)", lineHeight:"1.7", margin:0, whiteSpace:"pre-wrap" }}>{report}</p>
        ) : (
          <p style={{ fontSize:"12px", color:"var(--muted)", margin:0 }}>Genera un análisis de IA sobre tu rendimiento en el período seleccionado.</p>
        )}
      </div>
    </div>
  );
}
