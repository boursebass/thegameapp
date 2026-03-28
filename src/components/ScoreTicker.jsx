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
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      overflowX: "auto", whiteSpace: "nowrap",
      userSelect: "none",
    }}>
      <div style={{ display:"inline-flex", alignItems:"stretch", minHeight:"72px" }}>

        {/* Date pill */}
        <div style={{
          display:"inline-flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"0 16px",
          borderRight:"1px solid #e5e7eb", minWidth:"54px",
          background:"#f9fafb", flexShrink:0,
        }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", fontWeight:"700", color:"#374151", letterSpacing:"0.5px" }}>{dayStr}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"10px", fontWeight:"400", color:"#6b7280", marginTop:"2px" }}>{dtStr}</span>
        </div>

        {loading ? (
          <div style={{ display:"inline-flex", alignItems:"center", padding:"0 24px", fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"#9ca3af" }}>
            Cargando partidos...
          </div>
        ) : display.length === 0 ? (
          <div style={{ display:"inline-flex", alignItems:"center", padding:"0 24px", fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"#9ca3af" }}>
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
              borderRight:"1px solid #f3f4f6",
              minWidth:"160px",
              background: live ? "#fff8f8" : "#fff",
              borderTop: live ? "2px solid #c8102e" : "2px solid transparent",
              verticalAlign:"top",
            }}>
              {/* Status */}
              <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"5px" }}>
                {live && <span className="live-dot" />}
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"10px", fontWeight:"600",
                  color: live ? "#c8102e" : fin ? "#6b7280" : "#188485",
                  letterSpacing:"0.2px",
                }}>
                  {live ? statusLabel : statusLabel}
                </span>
              </div>

              {/* Away */}
              <div style={{ display:"flex", alignItems:"center", marginBottom:"3px" }}>
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"13px",
                  fontWeight: aWin ? "700" : "500",
                  color: aWin ? "#111827" : "#374151",
                  minWidth:"38px", letterSpacing:"0.3px",
                }}>{aA}</span>
                {hRec && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", color:"#d1d5db", marginLeft:"4px", marginRight:"auto" }}>{aRec?.wins}-{aRec?.losses}</span>}
                {hasScore && (
                  <span style={{
                    fontFamily:"'DM Mono',monospace", fontSize:"14px",
                    fontWeight: aWin ? "700" : "400",
                    color: aWin ? "#111827" : "#9ca3af",
                    marginLeft:"8px", minWidth:"18px", textAlign:"right",
                  }}>{aR}</span>
                )}
              </div>

              {/* Home */}
              <div style={{ display:"flex", alignItems:"center" }}>
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"13px",
                  fontWeight: hWin ? "700" : "500",
                  color: hWin ? "#111827" : "#374151",
                  minWidth:"38px", letterSpacing:"0.3px",
                }}>{hA}</span>
                {hRec && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9px", color:"#d1d5db", marginLeft:"4px", marginRight:"auto" }}>{hRec?.wins}-{hRec?.losses}</span>}
                {hasScore && (
                  <span style={{
                    fontFamily:"'DM Mono',monospace", fontSize:"14px",
                    fontWeight: hWin ? "700" : "400",
                    color: hWin ? "#111827" : "#9ca3af",
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
