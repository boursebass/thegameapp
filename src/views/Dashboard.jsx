import { MLB_TEAMS } from "../constants/teams";
import { computeBankroll } from "../lib/math";

const S = {
  card: { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" },
};

function StatPill({ label, value, sub, color }) {
  return (
    <div style={{
      ...S.card,
      padding:"14px 20px",
      display:"flex", flexDirection:"column", gap:"4px",
      borderLeft:`3px solid ${color||"var(--border)"}`,
    }}>
      <span style={S.label}>{label}</span>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"20px", fontWeight:"600", color:color||"var(--text)", lineHeight:1 }}>{value}</span>
      {sub && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>{sub}</span>}
    </div>
  );
}

function GameCard({ g, onAnalyze }) {
  const hObj = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id);
  const aObj = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id);
  const hA   = hObj?.abbr || "?";
  const aA   = aObj?.abbr || "?";
  const hN   = g.teams?.home?.team?.teamName || g.teams?.home?.team?.name?.split(" ").slice(-1)[0] || "";
  const aN   = g.teams?.away?.team?.teamName || g.teams?.away?.team?.name?.split(" ").slice(-1)[0] || "";
  const hR   = g.teams?.home?.score;
  const aR   = g.teams?.away?.score;
  const hPit = g.teams?.home?.probablePitcher?.fullName;
  const aPit = g.teams?.away?.probablePitcher?.fullName;
  const live = g.status?.detailedState === "In Progress";
  const fin  = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
  const hasScore = hR !== undefined && aR !== undefined;
  const hWin = fin && hasScore && parseInt(hR) > parseInt(aR);
  const aWin = fin && hasScore && parseInt(aR) > parseInt(hR);
  const gt   = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";

  const inningState = g.linescore?.inningState || "";
  const inningOrd   = g.linescore?.currentInningOrdinal || "";
  const statusLabel = live
    ? `${inningState==="Bottom"?"Bot ":inningState==="Top"?"Top ":inningState==="Middle"?"Mid ":""}${inningOrd}`
    : fin ? "Final" : gt;

  return (
    <div className="card-hover" style={{
      ...S.card,
      overflow:"hidden",
      borderTop:`3px solid ${live?"var(--red)":fin?"var(--border)":"var(--teal)"}`,
      cursor:"pointer",
      display:"flex", flexDirection:"column",
    }} onClick={onAnalyze}>

      {/* Status bar */}
      <div style={{
        padding:"8px 14px",
        background: live ? "rgba(200,16,46,0.05)" : "rgba(0,0,0,0.02)",
        borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          {live && <span className="live-dot" style={{ width:"6px", height:"6px" }} />}
          <span style={{
            fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"700",
            color: live ? "var(--red)" : fin ? "var(--muted)" : "var(--teal)",
            letterSpacing:"0.5px",
          }}>{statusLabel}</span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>
          {g.venue?.name ? g.venue.name.split(" ").slice(-1)[0] : ""}
        </span>
      </div>

      {/* Teams */}
      <div style={{ padding:"16px 14px", flex:1 }}>

        {/* Away */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
              <span style={{
                fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"700",
                color: aWin ? "var(--navy)" : "var(--text)",
              }}>{aA}</span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"var(--muted)", fontWeight:"500" }}>{aN}</span>
            </div>
            {aPit && (
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)", letterSpacing:"0.3px" }}>
                {aPit.split(" ").slice(-1)[0]}
              </span>
            )}
          </div>
          {hasScore && (
            <span style={{
              fontFamily:"'DM Mono',monospace", fontSize:"24px", fontWeight: aWin?"700":"400",
              color: aWin?"var(--navy)":"var(--muted)", minWidth:"28px", textAlign:"right",
            }}>{aR}</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:"1px", background:"var(--border)", marginBottom:"10px" }} />

        {/* Home */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
              <span style={{
                fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"700",
                color: hWin ? "var(--navy)" : "var(--text)",
              }}>{hA}</span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"var(--muted)", fontWeight:"500" }}>{hN}</span>
            </div>
            {hPit && (
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)", letterSpacing:"0.3px" }}>
                {hPit.split(" ").slice(-1)[0]}
              </span>
            )}
          </div>
          {hasScore && (
            <span style={{
              fontFamily:"'DM Mono',monospace", fontSize:"24px", fontWeight: hWin?"700":"400",
              color: hWin?"var(--navy)":"var(--muted)", minWidth:"28px", textAlign:"right",
            }}>{hR}</span>
          )}
        </div>
      </div>

      {/* Analyze button */}
      <div style={{
        padding:"10px 14px",
        borderTop:"1px solid var(--border)",
        background:"rgba(24,132,133,0.03)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.5px" }}>
          {hObj?.city||""} vs {aObj?.city||""}
        </span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:"700", color:"var(--teal)" }}>
          Analizar →
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ todayGames, loadingGames, predictions, bankroll, bets, onPickGame, onNav }) {
  const stats   = computeBankroll(bankroll?.starting || 0, bets);
  const settled = bets.filter(b => b.result && b.result !== "pending");
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const live    = todayGames.filter(g => g.status?.detailedState === "In Progress");

  // Sort: live first, then scheduled, then final
  const sorted = [
    ...todayGames.filter(g => g.status?.detailedState === "In Progress"),
    ...todayGames.filter(g => ["Scheduled","Pre-Game","Warmup"].includes(g.status?.detailedState)),
    ...todayGames.filter(g => ["Final","Game Over","Completed Early"].includes(g.status?.detailedState)),
  ];

  return (
    <div className="fade-up">

      {/* Date + live indicator */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <span style={{ ...S.label, display:"block", marginBottom:"4px" }}>
            {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:"800", color:"var(--navy)", letterSpacing:"-0.5px" }}>
              {todayGames.length > 0 ? `${todayGames.length} partidos hoy` : "Sin partidos hoy"}
            </h1>
            {live.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(200,16,46,0.08)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
                <span className="live-dot" style={{ width:"5px", height:"5px" }} />
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--red)" }}>{live.length} EN VIVO</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onNav("analizar")} style={{
          padding:"10px 20px", background:"var(--navy)", color:"#fff",
          border:"none", borderRadius:"var(--r-sm)", fontSize:"12px",
          fontWeight:"700", cursor:"pointer", letterSpacing:"0.3px",
        }}>Analizar partido →</button>
      </div>

      {/* Bankroll strip — solo si está configurado */}
      {bankroll?.starting ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"10px", marginBottom:"24px" }}>
          <StatPill
            label="Capital"
            value={`$${stats.bank.toFixed(2)}`}
            sub={`Inicio $${bankroll.starting.toFixed(2)}`}
            color={stats.totalProfit>=0?"var(--teal)":"var(--red)"}
          />
          <StatPill
            label="P&L"
            value={`${stats.totalProfit>=0?"+":""}$${stats.totalProfit.toFixed(2)}`}
            sub={`ROI ${stats.roi.toFixed(1)}%`}
            color={stats.totalProfit>=0?"var(--green)":"var(--red)"}
          />
          <StatPill
            label="Record"
            value={settled.length>0?`${stats.wins}-${stats.losses}-${stats.pushes}`:"—"}
            sub={`Win rate ${stats.winRate.toFixed(0)}%`}
            color="var(--navy)"
          />
          <StatPill
            label="Racha"
            value={stats.wins+stats.losses>0?`${stats.streakType}${stats.streak}`:"—"}
            sub={pending.length>0?`${pending.length} pendiente${pending.length>1?"s":""}`:undefined}
            color={stats.streakType==="W"?"var(--green)":stats.streakType==="L"?"var(--red)":"var(--muted)"}
          />
        </div>
      ) : (
        <div style={{
          ...S.card, padding:"14px 20px", marginBottom:"24px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderLeft:"3px solid var(--border)",
        }}>
          <span style={{ fontSize:"12px", color:"var(--muted)" }}>Bankroll no configurado — configúralo para ver métricas reales</span>
          <button onClick={() => onNav("bankroll")} style={{
            padding:"7px 14px", background:"var(--teal)", color:"#fff",
            border:"none", borderRadius:"var(--r-sm)", fontSize:"11px",
            fontWeight:"700", cursor:"pointer",
          }}>Configurar →</button>
        </div>
      )}

      {/* Games grid */}
      {loadingGames ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px" }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"160px" }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ ...S.card, padding:"60px", textAlign:"center", color:"var(--muted)", fontSize:"13px" }}>
          Sin partidos programados para hoy
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px" }}>
          {sorted.map((g, i) => (
            <GameCard
              key={i}
              g={g}
              onAnalyze={() => { onPickGame(g); onNav("analizar"); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
