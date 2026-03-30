import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle, Wallet, Trophy, Sparkles, AlertCircle } from "lucide-react";
import { buildDailyPicksPrompt, parseDailyPicks, callClaude } from "../lib/claude";
import { storage } from "../lib/storage";

/* ── Math ── */
const toDecimal  = o => { const n = parseFloat(o); return isNaN(n) ? 1 : n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1; };
const fmtOdds    = o => { const n = parseFloat(String(o).replace(/[^0-9.+-]/g,"")); return isNaN(n) ? (o||"—") : n > 0 ? `+${n}` : `${n}`; };
const pickPnl    = (result, momio, units, bankroll) => {
  const o = parseFloat(String(momio).replace(/[^0-9.+-]/g,"")), stake = units * (bankroll * 0.01);
  if (isNaN(o) || isNaN(stake) || result === "pending" || result === "push") return 0;
  return result === "won" ? (o > 0 ? (o / 100) * stake : (100 / Math.abs(o)) * stake) : -stake;
};
const parlayOdds = legs => {
  if (!legs?.length) return null;
  const odds = legs.map(l => parseFloat(String(l.momio).replace(/[^0-9.+-]/g,"")));
  if (odds.some(isNaN)) return null;
  const d = odds.reduce((a, o) => a * toDecimal(o), 1);
  return d >= 2 ? `+${Math.round((d - 1) * 100)}` : `${Math.round(-100 / (d - 1))}`;
};

const CASINOS     = ["PlayDoit", "Caliente", "Codere", "Betcris", "Ganabet", "Otro"];
const RESULT_COL  = { pending:"var(--muted)", won:"var(--green)", lost:"var(--red)", push:"var(--yellow)" };
const CONF_COL    = v => v >= 70 ? "var(--teal)" : v >= 60 ? "var(--green)" : v >= 55 ? "#f59e0b" : "var(--red)";

const S = {
  card:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label:   { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
  head:    { fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:"800", color:"var(--navy)", letterSpacing:"0.8px", textTransform:"uppercase" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
};

/* ══════════════════════════════════════════════
   MODAL: NUEVA PARTIDA
══════════════════════════════════════════════ */
function NuevaPartidaModal({ onAdd, onClose }) {
  const [casino, setCasino]           = useState("");
  const [casinoCustom, setCasinoCustom] = useState("");
  const [bank, setBank]               = useState("");

  function handleAdd() {
    const name = casino === "Otro" ? casinoCustom.trim() : casino;
    if (!name || !bank) return;
    onAdd({ id: Date.now(), casino: name, bank: parseFloat(bank), date: new Date().toISOString().split("T")[0], status:"active" });
    onClose();
  }

  const canAdd = (casino && casino !== "Otro" || casinoCustom.trim()) && bank;

  return createPortal(
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.card, width:"100%", maxWidth:"400px", padding:"28px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
          <div>
            <span style={S.label}>Nueva sesión</span>
            <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"20px", fontWeight:"800", color:"var(--navy)", margin:0 }}>Nueva partida</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", display:"flex", padding:"4px" }}><X size={18}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
          <div>
            <label style={S.label}>Casino</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {CASINOS.map(c => (
                <button key={c} onClick={() => setCasino(c)} style={{
                  padding:"6px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:"600",
                  border:`1px solid ${casino === c ? "var(--teal)" : "var(--border-md)"}`,
                  background: casino === c ? "rgba(24,132,133,0.1)" : "transparent",
                  color: casino === c ? "var(--teal)" : "var(--muted)", cursor:"pointer", transition:"all .12s",
                }}>{c}</button>
              ))}
            </div>
            {casino === "Otro" && (
              <input value={casinoCustom} onChange={e => setCasinoCustom(e.target.value)}
                placeholder="Nombre del casino..." style={{ marginTop:"10px" }} />
            )}
          </div>
          <div>
            <label style={S.label}>Bankroll de sesión (USD)</label>
            <input type="number" value={bank} onChange={e => setBank(e.target.value)} placeholder="Ej. 200"/>
          </div>
          <button onClick={handleAdd} disabled={!canAdd} style={{
            padding:"13px", background:"var(--teal)", color:"#fff", border:"none",
            borderRadius:"var(--r)", fontSize:"14px", fontWeight:"700",
            cursor: canAdd ? "pointer" : "not-allowed", opacity: canAdd ? 1 : 0.45, marginTop:"4px",
          }}>Iniciar partida</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════
   PICK CARD (generado por IA)
══════════════════════════════════════════════ */
function PickCard({ pick, bankroll, onResult, onDelete }) {
  const col  = CONF_COL(pick.confianza);
  const pnl  = pickPnl(pick.result, pick.momio, pick.unidades, bankroll);
  const rCol = RESULT_COL[pick.result];

  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:"12px", padding:"14px 16px",
      borderBottom:"1px solid rgba(0,0,0,0.05)",
      background: pick.result === "won" ? "rgba(132,203,138,0.03)" : pick.result === "lost" ? "rgba(200,16,46,0.03)" : "transparent",
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        {/* Partido + mercado */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--muted)", letterSpacing:"1px" }}>
            {pick.partido}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)" }}>{pick.mercado}</span>
        </div>
        {/* Pick */}
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"800", color:"var(--navy)", marginBottom:"4px", letterSpacing:"-0.2px" }}>
          {pick.pick}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"600", color:"var(--teal)", marginLeft:"8px" }}>{fmtOdds(pick.momio)}</span>
        </div>
        {/* Razón */}
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"var(--muted)", lineHeight:"1.5" }}>{pick.razon}</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
        {/* Confianza + unidades */}
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--muted)" }}>{pick.unidades}u</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"800", color:col }}>{pick.confianza}%</span>
        </div>
        {/* P&L */}
        {pick.result !== "pending" && (
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"800", color:rCol }}>
            {pnl > 0 ? "+" : ""}{pnl.toFixed(2)}
          </span>
        )}
        {/* Botones resultado */}
        <div style={{ display:"flex", gap:"3px" }}>
          {[["won","var(--green)"],["push","var(--yellow)"],["lost","var(--red)"]].map(([r, c]) => (
            <button key={r} onClick={() => onResult(pick.id, pick.result === r ? "pending" : r)} style={{
              width:"24px", height:"24px", borderRadius:"50%",
              border:`1px solid ${pick.result === r ? c : "var(--border)"}`,
              background: pick.result === r ? `${c}22` : "transparent",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: pick.result === r ? c : "var(--faint)", transition:"all .12s",
            }}>
              {r === "won" ? <CheckCircle size={12}/> : r === "lost" ? <XCircle size={12}/> : <MinusCircle size={12}/>}
            </button>
          ))}
          <button onClick={() => onDelete(pick.id)} style={{ width:"24px", height:"24px", borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--faint)" }}>
            <X size={11}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PARLAY SECTION (generado por IA)
══════════════════════════════════════════════ */
function ParlaySection({ parlay, onStake, onResult }) {
  const legs    = parlay?.legs || [];
  const combined = parlayOdds(legs);
  const payout  = parlay?.stake && combined ? (toDecimal(combined) - 1) * parseFloat(parlay.stake) : 0;
  const pnl     = parlay?.result === "won" ? payout : parlay?.result === "lost" ? -parseFloat(parlay?.stake || 0) : null;

  if (!legs.length) return null;

  return (
    <div style={{ borderTop:"2px solid var(--border)" }}>
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(245,158,11,0.03)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <Trophy size={13} color="#f59e0b" strokeWidth={2.5}/>
          <span style={S.head}>Parlay sugerido por IA</span>
          {combined && (
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"800", color:"#f59e0b" }}>{combined}</span>
          )}
          {pnl !== null && (
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Legs */}
      {legs.map((leg, i) => (
        <div key={leg.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 16px", borderTop:"1px solid rgba(0,0,0,0.04)" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"700", color:"#f59e0b", minWidth:"22px" }}>L{i+1}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700", color:"var(--navy)" }}>{leg.pick}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginLeft:"8px" }}>
              {leg.partido} · {leg.mercado} · {fmtOdds(leg.momio)}
            </span>
          </div>
        </div>
      ))}

      {/* Stake + Result */}
      <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", background:"rgba(0,0,0,0.01)", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <label style={{ ...S.label, marginBottom:0 }}>Stake</label>
          <input type="number" value={parlay?.stake||""} onChange={e => onStake(e.target.value)}
            placeholder="$" style={{ width:"80px", height:"32px", padding:"4px 10px", fontSize:"13px" }}/>
        </div>
        {parlay?.stake > 0 && combined && (
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)" }}>
            Win: <span style={{ color:"var(--teal)", fontWeight:"700" }}>${payout.toFixed(2)}</span>
          </span>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px" }}>
          {[["won","var(--green)","Ganó"],["lost","var(--red)","Perdió"]].map(([r,c,lbl]) => (
            <button key={r} onClick={() => onResult(parlay?.result === r ? "pending" : r)} style={{
              padding:"4px 12px", borderRadius:"var(--r-sm)", fontSize:"11px", fontWeight:"700",
              border:`1px solid ${parlay?.result === r ? c : "var(--border)"}`,
              background: parlay?.result === r ? `${c}18` : "transparent",
              color: parlay?.result === r ? c : "var(--muted)", cursor:"pointer", transition:"all .12s",
            }}>{lbl}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PARTIDA CARD
══════════════════════════════════════════════ */
function PartidaCard({ partida, picks, parlay, todayGames, onGenerate, onPickResult, onDeletePick, onParlayStake, onParlayResult, onClose, generating, genError, resumen }) {
  const [open, setOpen] = useState(partida.status === "active");

  const myPicks   = picks.filter(p => p.partidaId === partida.id);
  const picksPnl  = myPicks.reduce((a, p) => a + pickPnl(p.result, p.momio, p.unidades, partida.bank), 0);
  const parlayPnl = (() => {
    if (!parlay?.stake) return 0;
    const legs = parlay.legs || [];
    const combined = parlayOdds(legs);
    if (!combined) return 0;
    if (parlay.result === "won")  return (toDecimal(combined) - 1) * parseFloat(parlay.stake);
    if (parlay.result === "lost") return -parseFloat(parlay.stake);
    return 0;
  })();
  const grandPnl  = picksPnl + parlayPnl;
  const settled   = myPicks.filter(p => p.result !== "pending").length;
  const hasData   = myPicks.length > 0;
  const hasKey    = !!storage.getAnthropicKey();

  return (
    <div style={{ ...S.card, overflow:"hidden" }}>
      {/* ── Header ── */}
      <div onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"16px 20px", cursor:"pointer", userSelect:"none" }}>
        <div style={{
          width:"8px", height:"8px", borderRadius:"50%", flexShrink:0,
          background: partida.status === "active" ? "var(--green)" : "var(--faint)",
          boxShadow: partida.status === "active" ? "0 0 6px rgba(132,203,138,0.7)" : "none",
        }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"8px" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"800", color:"var(--navy)" }}>{partida.casino}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--muted)" }}>${partida.bank}</span>
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"2px" }}>
            {new Date(partida.date + "T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"}).toUpperCase()}
            {" · "}{myPicks.length} picks · {settled} resueltos
          </div>
        </div>
        {hasData && (
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"800", color: grandPnl >= 0 ? "var(--green)" : "var(--red)", flexShrink:0 }}>
            {grandPnl >= 0 ? "+" : ""}{grandPnl.toFixed(2)}
          </span>
        )}
        {open ? <ChevronUp size={16} color="var(--muted)"/> : <ChevronDown size={16} color="var(--muted)"/>}
      </div>

      {open && (
        <>
          {/* ── Generar con IA ── */}
          <div style={{ borderTop:"1px solid var(--border)", padding:"16px 20px", background:"rgba(0,0,0,0.01)" }}>
            {!hasKey ? (
              <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", background:"rgba(200,16,46,0.05)", border:"1px solid rgba(200,16,46,0.15)", borderRadius:"var(--r-sm)" }}>
                <AlertCircle size={14} color="var(--red)"/>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--red)" }}>
                  Necesitas configurar tu Anthropic API key en Ajustes
                </span>
              </div>
            ) : generating ? (
              <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 0" }}>
                <span className="spin-anim" style={{ width:"16px", height:"16px", border:"2px solid var(--border)", borderTopColor:"var(--teal)", borderRadius:"50%", display:"inline-block", flexShrink:0 }}/>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)" }}>Analizando {todayGames.length} partidos del día...</span>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
                <div>
                  {resumen && (
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"var(--text-sub)", lineHeight:"1.6", margin:0 }}>{resumen}</p>
                  )}
                  {genError && (
                    <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--red)", margin:0 }}>{genError}</p>
                  )}
                  {!resumen && !genError && (
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)" }}>
                      {todayGames.length} partidos disponibles hoy
                    </span>
                  )}
                </div>
                <button onClick={onGenerate} style={{
                  display:"flex", alignItems:"center", gap:"6px", padding:"8px 18px",
                  background:"var(--navy)", color:"#fff", border:"none",
                  borderRadius:"var(--r-sm)", fontSize:"12px", fontWeight:"700", cursor:"pointer",
                  flexShrink:0,
                }}>
                  <Sparkles size={13} strokeWidth={2.5}/>
                  {myPicks.length > 0 ? "Regenerar picks" : "Generar picks del día"}
                </button>
              </div>
            )}
          </div>

          {/* ── Picks del día ── */}
          {myPicks.length > 0 && (
            <div style={{ borderTop:"1px solid var(--border)" }}>
              <div style={{ padding:"11px 16px", background:"rgba(0,0,0,0.01)", display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={S.head}>Picks del día</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>{myPicks.length} picks · {partida.bank * 0.01} USD/unidad</span>
              </div>
              {myPicks.map(p => (
                <PickCard key={p.id} pick={p} bankroll={partida.bank} onResult={onPickResult} onDelete={onDeletePick}/>
              ))}
            </div>
          )}

          {/* ── Parlay ── */}
          <ParlaySection
            parlay={parlay}
            onStake={onParlayStake}
            onResult={onParlayResult}
          />

          {/* ── Footer ── */}
          {partida.status === "active" && (
            <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", display:"flex", justifyContent:"flex-end" }}>
              <button onClick={onClose} style={{
                padding:"6px 16px", borderRadius:"var(--r-sm)", fontSize:"11px", fontWeight:"600",
                border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer",
              }}>Cerrar sesión</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function Picks({ todayGames, partidas, setPartidas, picks, setPicks, parlays, setParlays }) {
  const [showNuevaPartida, setShowNuevaPartida] = useState(false);
  const [generatingFor, setGeneratingFor]       = useState(null);  // partidaId
  const [genError, setGenError]                 = useState({});    // { [partidaId]: string }
  const [resumenes, setResumenes]               = useState({});    // { [partidaId]: string }

  const activePartidas = partidas.filter(p => p.status === "active");
  const closedPartidas = partidas.filter(p => p.status === "closed");

  function addPartida(p) { setPartidas(prev => [p, ...prev]); }

  async function generatePicks(partida) {
    if (!todayGames.length) { setGenError(e => ({ ...e, [partida.id]: "Sin partidos hoy." })); return; }
    setGeneratingFor(partida.id);
    setGenError(e => ({ ...e, [partida.id]: "" }));
    try {
      const prompt = buildDailyPicksPrompt(todayGames, partida.bank, partida.casino);
      const raw    = await callClaude(prompt, 1600);
      const { picks: newPicks, parlayLegs, resumen } = parseDailyPicks(raw);

      if (!newPicks.length) throw new Error("La IA no generó picks válidos. Intenta de nuevo.");

      // Reemplazar picks de esta partida
      setPicks(prev => {
        const others = prev.filter(p => p.partidaId !== partida.id);
        return [...others, ...newPicks.map(p => ({ ...p, partidaId: partida.id, id: Date.now() + Math.random() }))];
      });

      // Parlay
      if (parlayLegs.length >= 2) {
        setParlays(prev => {
          const others = prev.filter(p => p.partidaId !== partida.id);
          return [...others, { id: Date.now(), partidaId: partida.id, stake:"", result:"pending", legs: parlayLegs }];
        });
      }

      if (resumen) setResumenes(r => ({ ...r, [partida.id]: resumen }));
    } catch(e) {
      setGenError(err => ({ ...err, [partida.id]: e.message }));
    } finally {
      setGeneratingFor(null);
    }
  }

  function setPickResult(id, result){ setPicks(prev => prev.map(p => p.id === id ? { ...p, result } : p)); }
  function deletePick(id)           { setPicks(prev => prev.filter(p => p.id !== id)); }
  function closePartida(id)         { setPartidas(prev => prev.map(p => p.id === id ? { ...p, status:"closed" } : p)); }

  function setParlayStake(partidaId, stake) {
    setParlays(prev => prev.map(p => p.partidaId === partidaId ? { ...p, stake } : p));
  }
  function setParlayResult(partidaId, result) {
    setParlays(prev => prev.map(p => p.partidaId === partidaId ? { ...p, result } : p));
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" }}>Sesiones de apuestas</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", margin:"6px 0 0" }}>Picks</h1>
        </div>
        <button onClick={() => setShowNuevaPartida(true)} style={{
          display:"flex", alignItems:"center", gap:"6px",
          padding:"10px 20px", background:"var(--teal)", color:"#fff",
          border:"none", borderRadius:"var(--r)", fontSize:"13px", fontWeight:"700", cursor:"pointer",
        }}>
          <Plus size={14} strokeWidth={2.5}/> Nueva partida
        </button>
      </div>

      {/* Content */}
      {partidas.length === 0 ? (
        <div style={{ ...S.card, padding:"64px", textAlign:"center" }}>
          <div style={{ marginBottom:"16px", display:"flex", justifyContent:"center" }}>
            <Wallet size={36} color="var(--faint)"/>
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"700", color:"var(--muted)", marginBottom:"6px" }}>Sin partidas activas</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--faint)" }}>
            Crea una partida para que la IA genere los picks del día
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {[...activePartidas, ...closedPartidas].map(partida => (
            <PartidaCard
              key={partida.id}
              partida={partida}
              picks={picks}
              parlay={parlays.find(p => p.partidaId === partida.id)}
              todayGames={todayGames}
              onGenerate={() => generatePicks(partida)}
              onPickResult={setPickResult}
              onDeletePick={deletePick}
              onParlayStake={stake  => setParlayStake(partida.id, stake)}
              onParlayResult={result => setParlayResult(partida.id, result)}
              onClose={() => closePartida(partida.id)}
              generating={generatingFor === partida.id}
              genError={genError[partida.id] || ""}
              resumen={resumenes[partida.id] || ""}
            />
          ))}
        </div>
      )}

      {showNuevaPartida && (
        <NuevaPartidaModal onAdd={addPartida} onClose={() => setShowNuevaPartida(false)}/>
      )}
    </div>
  );
}
