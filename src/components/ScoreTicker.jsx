import { MLB_TEAMS } from "../constants/teams";

export default function ScoreTicker({ games, loading }) {
  const display = [
    ...games.filter(g => g.status?.detailedState === "In Progress"),
    ...games.filter(g => ["Scheduled","Pre-Game","Warmup"].includes(g.status?.detailedState)),
    ...games.filter(g => ["Final","Game Over","Completed Early"].includes(g.status?.detailedState)),
  ].slice(0, 16);

  const today  = new Date();
  const dayStr = today.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase();
  const dtStr  = today.toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase();

  return (
    <div style={{
      background: "rgba(7,21,37,0.5)",
      backdropFilter: "blur(16px) saturate(160%)",
      WebkitBackdropFilter: "blur(16px) saturate(160%)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      overflowX: "auto", whiteSpace: "nowrap",
      userSelect: "none",
    }}>
      <div style={{ display:"inline-flex", alignItems:"stretch", minHeight:"68px" }}>

        {/* Date pill */}
        <div style={{
          display:"inline-flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"0 16px",
          borderRight:"1px solid rgba(255,255,255,0.07)", minWidth:"54px",
          background:"rgba(255,255,255,0.03)", flexShrink:0,
        }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.7)", letterSpacing:"0.5px" }}>{dayStr}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"10px", fontWeight:"400", color:"rgba(255,255,255,0.35)", marginTop:"2px" }}>{dtStr}</span>
        </div>

        {loading ? (
          <div style={{ display:"inline-flex", alignItems:"center", padding:"0 24px", fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>
            Cargando partidos...
          </div>
        ) : display.length === 0 ? (
          <div style={{ display:"inline-flex", alignItems:"center", padding:"0 24px", fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>
            Sin partidos programados hoy
          </div>
        ) : display.map((g, i) => {
          const hObj = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id);
          const aObj = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id);
          const hA   = hObj?.abbr || "?";
          const aA   = aObj?.abbr || "?";
          const hR   = g.teams?.home?.score;
          const aR   = g.teams?.away?.score;
          const hRec = g.teams?.home?.leagueRecord;
          const aRec = g.teams?.away?.leagueRecord;
          const live = g.status?.detailedState === "In Progress";
          const fin  = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
          const hasScore = hR !== undefined && aR !== undefined;
          const hWin = fin && hasScore && parseInt(hR) > parseInt(aR);
          const aWin = fin && hasScore && parseInt(aR) > parseInt(hR);
          const inningState = g.linescore?.inningState || "";
          const inningOrd   = g.linescore?.currentInningOrdinal || "";
          const inningNum   = g.linescore?.currentInning || "";
          const gt = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}) : "--";

          const statusLabel = live
            ? ((inningState==="Bottom"?"Bot ":inningState==="Top"?"Top ":inningState==="Middle"?"Mid ":"") + inningOrd)
            : fin ? (g.status?.detailedState==="Completed Early"?`Final/${inningNum}`:"Final")
            : gt;

          return (
            <div key={i} style={{
              display:"inline-flex", flexDirection:"column",
              justifyContent:"space-between",
              padding:"8px 14px",
              borderRight:"1px solid rgba(255,255,255,0.06)",
              minWidth:"155px",
              background: live ? "rgba(248,113,113,0.08)" : "transparent",
              borderTop: live ? "2px solid rgba(248,113,113,0.6)" : "2px solid transparent",
              verticalAlign:"top",
              transition:"background .2s",
            }}>
              {/* Status */}
              <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"5px" }}>
                {live && <span className="live-dot" />}
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"10px", fontWeight:"600",
                  color: live ? "#f87171" : fin ? "rgba(255,255,255,0.3)" : "#2dd4bf",
                  letterSpacing:"0.2px",
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* Away */}
              <div style={{ display:"flex", alignItems:"center", marginBottom:"3px" }}>
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"13px",
                  fontWeight: aWin ? "700" : "500",
                  color: aWin ? "#fff" : "rgba(255,255,255,0.65)",
                  minWidth:"38px", letterSpacing:"0.3px",
                }}>{aA}</span>
                {aRec && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", color:"rgba(255,255,255,0.2)", marginLeft:"4px", marginRight:"auto" }}>{aRec?.wins}-{aRec?.losses}</span>}
                {hasScore && (
                  <span style={{
                    fontFamily:"'DM Mono',monospace", fontSize:"14px",
                    fontWeight: aWin ? "700" : "400",
                    color: aWin ? "#fff" : "rgba(255,255,255,0.35)",
                    marginLeft:"8px", minWidth:"18px", textAlign:"right",
                  }}>{aR}</span>
                )}
              </div>

              {/* Home */}
              <div style={{ display:"flex", alignItems:"center" }}>
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"13px",
                  fontWeight: hWin ? "700" : "500",
                  color: hWin ? "#fff" : "rgba(255,255,255,0.65)",
                  minWidth:"38px", letterSpacing:"0.3px",
                }}>{hA}</span>
                {hRec && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", color:"rgba(255,255,255,0.2)", marginLeft:"4px", marginRight:"auto" }}>{hRec?.wins}-{hRec?.losses}</span>}
                {hasScore && (
                  <span style={{
                    fontFamily:"'DM Mono',monospace", fontSize:"14px",
                    fontWeight: hWin ? "700" : "400",
                    color: hWin ? "#fff" : "rgba(255,255,255,0.35)",
                    marginLeft:"8px", minWidth:"18px", textAlign:"right",
                  }}>{hR}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
