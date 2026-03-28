import { useState, useEffect } from "react";
import { computeBankroll } from "../lib/math";
import { fetchStandingsAll } from "../lib/mlb";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" },
};

function KpiCard({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      ...S.card,
      padding:"20px",
      borderTop:`3px solid ${color||"var(--border)"}`,
      cursor: onClick ? "pointer" : "default",
      transition:"transform .15s, box-shadow .15s",
    }}
    onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"; }}}
    onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="var(--shadow)"; }}
    >
      <span style={{ ...S.label, display:"block", marginBottom:"10px" }}>{label}</span>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"26px", fontWeight:"600", color:color||"var(--text)", lineHeight:1, marginBottom:"6px" }}>{value}</div>
      {sub && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function WinRateRing({ pct }) {
  const r = 28, c = 2*Math.PI*r;
  const filled = (pct/100)*c;
  const color = pct>=55?"var(--teal)":pct>=45?"var(--yellow)":"var(--red)";
  return (
    <svg width="70" height="70" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="35" cy="35" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray .6s ease" }}
      />
      <text x="35" y="40" textAnchor="middle" fill={color}
        style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"700", transform:"rotate(90deg)", transformOrigin:"35px 35px" }}>
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

function LeadersStrip({ standings }) {
  const divs = (standings||[]).slice(0,6);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      {divs.map(d => {
        const leader = d.teams?.[0];
        if (!leader) return null;
        const name = leader.team?.locationName || leader.team?.name || "—";
        const abbr = leader.team?.teamName || "—";
        return (
          <div key={d.divisionName} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"9px 14px",
            background:"rgba(24,132,133,0.04)",
            border:"1px solid var(--border)",
            borderRadius:"var(--r-sm)",
            borderLeft:"3px solid var(--teal)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", minWidth:"60px" }}>
                {d.divisionName}
              </span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color:"var(--navy)" }}>{name}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)" }}>{abbr}</span>
            </div>
            <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"600", color:"var(--text)" }}>
                {leader.wins}–{leader.losses}
              </span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--teal)", fontWeight:"700" }}>
                {parseFloat(leader.winningPercentage||0).toFixed(3)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuickAction({ label, sub, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...S.card,
      padding:"16px 20px",
      border:`1px solid ${color}30`,
      background:`${color}08`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      cursor:"pointer", width:"100%",
      transition:"background .15s, transform .15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background=`${color}14`; e.currentTarget.style.transform="translateX(3px)"; }}
    onMouseLeave={e => { e.currentTarget.style.background=`${color}08`; e.currentTarget.style.transform="translateX(0)"; }}
    >
      <div style={{ textAlign:"left" }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color:"var(--navy)" }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"2px" }}>{sub}</div>}
      </div>
      <span style={{ fontSize:"16px", color:color }}>→</span>
    </button>
  );
}

export default function Dashboard({ todayGames, loadingGames, predictions, bankroll, bets, onNav }) {
  const [standings, setStandings] = useState(null);

  useEffect(() => {
    fetchStandingsAll().then(setStandings).catch(() => {});
  }, []);

  const stats   = computeBankroll(bankroll?.starting||0, bets);
  const settled = bets.filter(b => b.result && b.result !== "pending");
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const live    = todayGames.filter(g => g.status?.detailedState === "In Progress");
  const todayPreds = predictions.filter(p => new Date(p.date).toDateString() === new Date().toDateString());

  const hasBankroll = !!bankroll?.starting;

  return (
    <div className="fade-up">

      {/* ── Hero ── */}
      <div style={{
        ...S.card,
        padding:"28px 32px",
        marginBottom:"20px",
        background:"linear-gradient(135deg, rgba(24,79,111,0.06) 0%, rgba(24,132,133,0.04) 100%)",
        borderLeft:"4px solid var(--navy)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"16px",
      }}>
        <div>
          <span style={{ ...S.label, display:"block", marginBottom:"8px" }}>
            {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase()}
          </span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(22px,3vw,32px)", fontWeight:"800", color:"var(--navy)", letterSpacing:"-0.5px", marginBottom:"6px" }}>
            Bienvenido a TheGameApp
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            {!loadingGames && (
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)" }}>
                {todayGames.length} partidos programados
              </span>
            )}
            {live.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(200,16,46,0.08)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
                <span className="live-dot" style={{ width:"5px", height:"5px" }} />
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--red)" }}>{live.length} EN VIVO</span>
              </div>
            )}
            {pending.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--yellow)" }}>{pending.length} apuesta{pending.length>1?"s":""} pendiente{pending.length>1?"s":""}</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onNav("analizar")} style={{
          padding:"13px 28px", background:"var(--navy)", color:"#fff",
          border:"none", borderRadius:"var(--r-sm)", fontSize:"13px",
          fontWeight:"700", cursor:"pointer", letterSpacing:"0.3px",
          boxShadow:"0 4px 16px rgba(24,79,111,0.25)",
          transition:"opacity .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity="0.88"}
        onMouseLeave={e => e.currentTarget.style.opacity="1"}
        >Analizar partido →</button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"12px", marginBottom:"20px" }}>
        <KpiCard
          label="Capital"
          value={hasBankroll ? `$${stats.bank.toFixed(2)}` : "—"}
          sub={hasBankroll ? `Inicio $${bankroll.starting.toFixed(2)}` : "Sin configurar"}
          color={hasBankroll ? (stats.totalProfit>=0?"var(--teal)":"var(--red)") : "var(--border)"}
          onClick={() => onNav("bankroll")}
        />
        <KpiCard
          label="P&L total"
          value={hasBankroll ? `${stats.totalProfit>=0?"+":""}$${stats.totalProfit.toFixed(2)}` : "—"}
          sub={hasBankroll ? `ROI ${stats.roi.toFixed(1)}%` : "—"}
          color={hasBankroll ? (stats.totalProfit>=0?"var(--green)":"var(--red)") : "var(--border)"}
          onClick={() => onNav("estadisticas")}
        />
        <KpiCard
          label="Record"
          value={settled.length>0 ? `${stats.wins}–${stats.losses}` : "—"}
          sub={settled.length>0 ? `${stats.pushes} push · ${settled.length} total` : "Sin apuestas"}
          color="var(--navy)"
          onClick={() => onNav("bankroll")}
        />
        <KpiCard
          label="Análisis"
          value={predictions.length||"0"}
          sub={`${todayPreds.length} hoy · ${pending.length} pendiente${pending.length!==1?"s":""}`}
          color="var(--teal)"
          onClick={() => onNav("predicciones")}
        />
      </div>

      {/* ── Win rate + Leaders + Quick actions ── */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"16px", alignItems:"start" }}>

        {/* Win rate ring */}
        {hasBankroll && settled.length > 0 && (
          <div style={{ ...S.card, padding:"20px", textAlign:"center", minWidth:"110px" }}>
            <span style={{ ...S.label, display:"block", marginBottom:"12px" }}>Win Rate</span>
            <WinRateRing pct={stats.winRate} />
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"8px" }}>
              {stats.wins}W · {stats.losses}L
            </div>
          </div>
        )}

        {/* Division leaders */}
        <div style={{ ...S.card, padding:"18px 20px" }}>
          <span style={{ ...S.label, display:"block", marginBottom:"12px" }}>Líderes por división</span>
          {standings
            ? <LeadersStrip standings={standings} />
            : <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"38px" }} />)}
              </div>
          }
        </div>

        {/* Quick actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", minWidth:"220px" }}>
          <span style={{ ...S.label, display:"block", marginBottom:"4px" }}>Accesos rápidos</span>
          <QuickAction label="Analizar partido" sub={`${todayGames.length} partidos hoy`} color="var(--teal)"   onClick={() => onNav("analizar")} />
          <QuickAction label="Bankroll"         sub={hasBankroll?`$${stats.bank.toFixed(2)} actual`:"Configurar capital"} color="var(--navy)"  onClick={() => onNav("bankroll")} />
          <QuickAction label="Predicciones"     sub={`${predictions.length} guardadas`}    color="#8b5cf6"    onClick={() => onNav("predicciones")} />
          <QuickAction label="Equipos"          sub="Standings MLB 2025"                    color="var(--green)" onClick={() => onNav("equipos")} />
          <QuickAction label="Estadísticas"     sub="Rendimiento y métricas"                color="var(--yellow)" onClick={() => onNav("estadisticas")} />
        </div>
      </div>

      {/* ── Recent predictions ── */}
      {predictions.length > 0 && (
        <div style={{ ...S.card, padding:"18px 20px", marginTop:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <span style={S.label}>Últimas predicciones</span>
            <button onClick={() => onNav("predicciones")} style={{ background:"none", border:"none", fontSize:"12px", color:"var(--teal)", fontWeight:"600", cursor:"pointer" }}>
              Ver todas →
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {predictions.slice(0,4).map(p => (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", gap:"14px",
                padding:"10px 14px",
                background:"rgba(0,0,0,0.02)",
                border:"1px solid var(--border)",
                borderRadius:"var(--r-sm)",
              }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)", minWidth:"44px" }}>
                  {new Date(p.date).toLocaleDateString("es-MX",{month:"short",day:"numeric"})}
                </div>
                <div style={{ flex:1, fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)" }}>
                  {p.homeTeam?.split(" ").slice(-1)[0]} <span style={{ color:"var(--muted)", fontWeight:"400" }}>vs</span> {p.awayTeam?.split(" ").slice(-1)[0]}
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  {p.picks?.slice(0,2).map((pick,i) => (
                    <span key={i} style={{
                      fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700",
                      background:`${pick.confianza>=65?"rgba(24,132,133,0.1)":"rgba(245,158,11,0.1)"}`,
                      color: pick.confianza>=65?"var(--teal)":"var(--yellow)",
                      border:`1px solid ${pick.confianza>=65?"rgba(24,132,133,0.2)":"rgba(245,158,11,0.2)"}`,
                      borderRadius:"4px", padding:"2px 7px",
                    }}>{pick.confianza}%</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
