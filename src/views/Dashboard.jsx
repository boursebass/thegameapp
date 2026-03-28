import { MLB_TEAMS } from "../constants/teams";
import { computeBankroll } from "../lib/math";

const S = {
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px 20px", boxShadow:"var(--shadow)" },
};

function StatCard({ label, value, sub, accentColor }) {
  return (
    <div style={{ ...S.card, borderTop:`3px solid ${accentColor||"var(--border)"}` }}>
      <span style={S.label}>{label}</span>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"22px", fontWeight:"500", color:accentColor||"var(--text)", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)", marginTop:"5px" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ todayGames, loadingGames, predictions, bankroll, bets, onPickGame, onNav }) {
  const stats     = computeBankroll(bankroll?.starting || 0, bets);
  const pending   = bets.filter(b => !b.result || b.result === "pending");
  const todayPreds= predictions.filter(p => new Date(p.date).toDateString() === new Date().toDateString());

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom:"28px" }}>
        <div style={{ ...S.label, marginBottom:"8px" }}>
          {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(24px,3vw,32px)", fontWeight:"800", color:"var(--navy)", margin:"0 0 4px", letterSpacing:"-0.5px" }}>
          Inicio
        </h1>
        <p style={{ color:"var(--muted)", fontSize:"13px" }}>Panel de control · TheGameApp</p>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"12px", marginBottom:"28px" }}>
        <StatCard
          label="Capital"
          value={bankroll?.starting ? `$${stats.bank.toFixed(2)}` : "—"}
          sub={bankroll?.starting ? `Inicio: $${bankroll.starting.toFixed(2)}` : "Sin configurar"}
          accentColor={stats.totalProfit >= 0 ? "var(--teal)" : "var(--red)"}
        />
        <StatCard
          label="P&L"
          value={bankroll?.starting ? `${stats.totalProfit >= 0 ? "+" : ""}$${stats.totalProfit.toFixed(2)}` : "—"}
          sub={bankroll?.starting ? `ROI: ${stats.roi.toFixed(1)}%` : "—"}
          accentColor={stats.totalProfit >= 0 ? "var(--green)" : "var(--red)"}
        />
        <StatCard
          label="Record"
          value={stats.wins + stats.losses > 0 ? `${stats.wins}-${stats.losses}-${stats.pushes}` : "—"}
          sub={`Win rate: ${stats.winRate.toFixed(0)}%`}
          accentColor="var(--navy)"
        />
        <StatCard
          label="Análisis hoy"
          value={todayPreds.length || "0"}
          sub={`${predictions.length} total guardados`}
          accentColor="var(--teal)"
        />
      </div>

      {/* Today's games */}
      <div style={{ marginBottom:"28px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:"600", fontSize:"15px", color:"var(--navy)" }}>Partidos de hoy</span>
          <button onClick={() => onNav("analizar")} style={{
            background:"none", border:"none",
            fontSize:"12px", color:"var(--teal)", fontWeight:"600", cursor:"pointer",
          }}>Analizar →</button>
        </div>

        {loadingGames ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:"8px" }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"100px" }} />)}
          </div>
        ) : todayGames.length === 0 ? (
          <div style={{ ...S.card, textAlign:"center", padding:"32px", color:"var(--muted)" }}>Sin partidos programados para hoy</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:"8px" }}>
            {todayGames.slice(0,14).map((g, i) => {
              const hAbbr = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id)?.abbr || "?";
              const aAbbr = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id)?.abbr || "?";
              const gt    = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
              const live  = g.status?.detailedState === "In Progress";
              const fin   = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
              const hR    = g.teams?.home?.score;
              const aR    = g.teams?.away?.score;
              const hasScore = hR !== undefined && aR !== undefined;
              return (
                <div key={i} className="card-hover"
                  onClick={() => { onPickGame(g); onNav("analizar"); }}
                  style={{
                    ...S.card,
                    textAlign:"center", cursor:"pointer",
                    borderTop: `3px solid ${live ? "var(--red)" : "var(--border)"}`,
                    background: live ? "#fff8f8" : "var(--bg-card)",
                    padding:"14px 10px",
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", marginBottom:"10px" }}>
                    {live && <span className="live-dot" style={{ width:"5px", height:"5px" }} />}
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color: live?"var(--red)":fin?"var(--faint)":"var(--teal)", fontWeight:"600" }}>
                      {live ? "EN VIVO" : fin ? "FINAL" : gt}
                    </span>
                  </div>
                  {hasScore ? (
                    <>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700", color:"var(--text)" }}>{aAbbr}</span>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"700", color:"var(--text)" }}>{aR}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700", color:"var(--text)" }}>{hAbbr}</span>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"700", color:"var(--text)" }}>{hR}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"600", color:"var(--text)", marginBottom:"4px" }}>{aAbbr}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--faint)", marginBottom:"4px" }}>@</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"600", color:"var(--text)" }}>{hAbbr}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two columns: Recent predictions + Pending bets */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

        {/* Recent predictions */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:"600", fontSize:"14px", color:"var(--navy)" }}>Últimas predicciones</span>
            <button onClick={() => onNav("predicciones")} style={{ background:"none", border:"none", fontSize:"12px", color:"var(--teal)", fontWeight:"600", cursor:"pointer" }}>Ver todas →</button>
          </div>
          {predictions.length === 0 ? (
            <div style={{ ...S.card, color:"var(--muted)", fontSize:"13px", textAlign:"center", padding:"24px" }}>Sin predicciones aún</div>
          ) : predictions.slice(0,5).map(p => (
            <div key={p.id} style={{ ...S.card, marginBottom:"8px", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {p.homeTeam?.split(" ").slice(-1)[0]} vs {p.awayTeam?.split(" ").slice(-1)[0]}
                </div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"2px" }}>
                  {new Date(p.date).toLocaleDateString("es-MX",{month:"short",day:"numeric"})} · {p.picks?.length||0} picks
                </div>
              </div>
              {p.picks?.length > 0 && (
                <span style={{
                  fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"600",
                  background:"rgba(24,132,133,0.1)", color:"var(--teal)",
                  border:"1px solid rgba(24,132,133,0.2)",
                  borderRadius:"4px", padding:"2px 7px",
                }}>{p.picks[0].confianza}%</span>
              )}
            </div>
          ))}
        </div>

        {/* Pending bets */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:"600", fontSize:"14px", color:"var(--navy)" }}>
              Apuestas pendientes
              {pending.length > 0 && <span style={{ marginLeft:"6px", background:"var(--red)", color:"#fff", borderRadius:"10px", padding:"0 7px", fontSize:"9px", fontWeight:"800" }}>{pending.length}</span>}
            </span>
            <button onClick={() => onNav("bankroll")} style={{ background:"none", border:"none", fontSize:"12px", color:"var(--teal)", fontWeight:"600", cursor:"pointer" }}>Bankroll →</button>
          </div>
          {pending.length === 0 ? (
            <div style={{ ...S.card, color:"var(--muted)", fontSize:"13px", textAlign:"center", padding:"24px" }}>Sin apuestas pendientes</div>
          ) : pending.slice(0,5).map(b => (
            <div key={b.id} style={{ ...S.card, marginBottom:"8px", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderLeft:"3px solid var(--teal)" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"500", color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {b.match}
                </div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"2px" }}>
                  {b.market} · ${b.stake} @ {b.odds}
                </div>
              </div>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--faint)" }}>{b.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
