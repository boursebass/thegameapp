import { useState } from "react";
import { computeBankroll } from "../lib/math";
import { storage } from "../lib/storage";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px 20px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
  lbl:   { fontFamily:"'DM Mono',monospace", fontSize:"10px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"5px" },
};

const today = () => new Date().toISOString().split("T")[0];

export default function Bankroll({ bankroll, setBankroll, bets, setBets }) {
  const [setupMode,    setSetupMode]    = useState(!bankroll?.starting);
  const [startInput,   setStartInput]   = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [filterResult, setFilterResult] = useState("all");
  const [newBet, setNewBet] = useState({ date:today(), match:"", market:"", pick:"", stake:"", odds:"", notes:"", result:"pending" });

  const stats   = computeBankroll(bankroll?.starting || 0, bets);
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const settled = bets.filter(b => b.result && b.result !== "pending");

  function setup() {
    const v = parseFloat(startInput); if (!v || v <= 0) return;
    const br = { starting: v, created: today() };
    setBankroll(br); storage.setBankroll(br); setSetupMode(false);
  }

  function addBet() {
    if (!newBet.match || !newBet.stake || !newBet.odds) return;
    const bet = { ...newBet, id: Date.now() };
    const updated = [...bets, bet];
    setBets(updated); storage.setBets(updated);
    setNewBet({ date:today(), match:"", market:"", pick:"", stake:"", odds:"", notes:"", result:"pending" });
    setShowAdd(false);
  }

  function setResult(id, result) {
    const updated = bets.map(b => b.id === id ? { ...b, result } : b);
    setBets(updated); storage.setBets(updated);
  }

  function deleteBet(id) {
    const updated = bets.filter(b => b.id !== id);
    setBets(updated); storage.setBets(updated);
  }

  function reset() {
    if (!confirm("¿Resetear bankroll y todos los registros?")) return;
    setBankroll(null); setBets([]);
    storage.setBankroll(null); storage.setBets([]);
    setSetupMode(true); setStartInput("");
  }

  if (setupMode) return (
    <div className="fade-up" style={{ maxWidth:"420px", margin:"80px auto", textAlign:"center" }}>
      <span style={S.label}>Configuración inicial</span>
      <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"28px", fontWeight:"800", color:"var(--navy)", marginBottom:"8px" }}>Bankroll Tracker</h1>
      <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"32px", lineHeight:"1.7" }}>Define tu capital inicial para comenzar a registrar apuestas y calcular métricas reales.</p>
      <div style={S.card}>
        <span style={S.lbl}>Capital inicial (USD)</span>
        <input type="number" value={startInput} onChange={e=>setStartInput(e.target.value)} placeholder="Ej. 500.00" style={{ marginBottom:"12px" }} />
        <button onClick={setup} style={{ width:"100%", padding:"12px", background:"var(--teal)", color:"#fff", border:"none", borderRadius:"var(--r)", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
          Comenzar con ${parseFloat(startInput||0).toFixed(2)}
        </button>
      </div>
    </div>
  );

  const filtered = filterResult === "all" ? bets : bets.filter(b => b.result === filterResult);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={S.label}>Bankroll tracker</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Capital & Rendimiento</h1>
          <p style={{ fontSize:"12px", color:"var(--muted)" }}>Capital inicial: <span style={{ fontFamily:"'DM Mono',monospace", color:"var(--text)" }}>${bankroll.starting.toFixed(2)}</span></p>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding:"9px 16px", background:"var(--teal)", color:"#fff", border:"none", borderRadius:"var(--r-sm)", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
            + Nueva apuesta
          </button>
          <button onClick={reset} style={{ padding:"9px 16px", background:"none", border:"1px solid var(--border-md)", borderRadius:"var(--r-sm)", fontSize:"12px", color:"var(--muted)", cursor:"pointer" }}>
            Resetear
          </button>
        </div>
      </div>

      {/* Main capital card */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
        <div style={{ ...S.card, borderTop:`3px solid ${stats.totalProfit >= 0 ? "var(--teal)" : "var(--red)"}`, padding:"24px" }}>
          <span style={S.label}>Capital actual</span>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"40px", fontWeight:"500", color:"var(--text)", lineHeight:1 }}>${stats.bank.toFixed(2)}</div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"10px" }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"500", color:stats.totalProfit>=0?"var(--teal)":"var(--red)" }}>
              {stats.totalProfit>=0?"+":""}{stats.totalProfit.toFixed(2)}
            </span>
            <span style={{ fontSize:"11px", color:"var(--muted)" }}>P&L total</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {[
            { label:"ROI",      value:`${stats.roi>=0?"+":""}${stats.roi.toFixed(1)}%`, col:stats.roi>=0?"var(--teal)":"var(--red)" },
            { label:"Win Rate", value:`${stats.winRate.toFixed(1)}%`, col:stats.winRate>=55?"var(--green)":stats.winRate>=45?"#f59e0b":"var(--red)" },
            { label:"Record",   value:`${stats.wins}-${stats.losses}-${stats.pushes}`, col:"var(--navy)" },
            { label:"Racha",    value:stats.wins+stats.losses>0?`${stats.streakType}${stats.streak}`:"—", col:stats.streakType==="W"?"var(--green)":stats.streakType==="L"?"var(--red)":"var(--muted)" },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding:"14px" }}>
              <span style={S.label}>{s.label}</span>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"18px", fontWeight:"600", color:s.col, lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"24px" }}>
        {[
          { label:"Total apostado", value:`$${stats.totalStaked.toFixed(2)}`, col:"var(--navy)" },
          { label:"Mejor apuesta",  value:stats.bestWin  ? `+$${stats.bestWin.profit.toFixed(2)}` : "—", col:"var(--teal)" },
          { label:"Peor apuesta",   value:stats.worstLoss ? `-$${parseFloat(stats.worstLoss.stake).toFixed(2)}` : "—", col:"var(--red)" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, padding:"14px" }}>
            <span style={S.label}>{s.label}</span>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"16px", fontWeight:"600", color:s.col }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add bet form */}
      {showAdd && (
        <div style={{ ...S.card, borderTop:"2px solid var(--teal)", marginBottom:"20px" }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"700", color:"var(--navy)", marginBottom:"16px" }}>Nueva apuesta</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <span style={S.lbl}>Partido / descripción</span>
              <input value={newBet.match} onChange={e=>setNewBet(p=>({...p,match:e.target.value}))} placeholder="Ej. Yankees vs Red Sox — ML NYY" />
            </div>
            <div>
              <span style={S.lbl}>Mercado</span>
              <input value={newBet.market} onChange={e=>setNewBet(p=>({...p,market:e.target.value}))} placeholder="ML / Run Line / Over..." />
            </div>
            <div>
              <span style={S.lbl}>Pick</span>
              <input value={newBet.pick} onChange={e=>setNewBet(p=>({...p,pick:e.target.value}))} placeholder="Ej. NYY -1.5" />
            </div>
            <div>
              <span style={S.lbl}>Stake ($)</span>
              <input type="number" value={newBet.stake} onChange={e=>setNewBet(p=>({...p,stake:e.target.value}))} placeholder="0.00" />
            </div>
            <div>
              <span style={S.lbl}>Momio americano</span>
              <input value={newBet.odds} onChange={e=>setNewBet(p=>({...p,odds:e.target.value}))} placeholder="-110 / +150" />
            </div>
            <div>
              <span style={S.lbl}>Fecha</span>
              <input type="date" value={newBet.date} onChange={e=>setNewBet(p=>({...p,date:e.target.value}))} />
            </div>
            <div>
              <span style={S.lbl}>Resultado</span>
              <select value={newBet.result} onChange={e=>setNewBet(p=>({...p,result:e.target.value}))}>
                <option value="pending">Pendiente</option>
                <option value="W">Ganada (W)</option>
                <option value="L">Perdida (L)</option>
                <option value="P">Push (P)</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
            <button onClick={addBet} style={{ padding:"10px 20px", background:"var(--teal)", color:"#fff", border:"none", borderRadius:"var(--r-sm)", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>Guardar</button>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"10px 20px", background:"none", border:"1px solid var(--border-md)", borderRadius:"var(--r-sm)", fontSize:"13px", color:"var(--muted)", cursor:"pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
        {[["all","Todas"],["pending","Pendientes"],["W","Ganadas"],["L","Perdidas"],["P","Push"]].map(([val,label]) => (
          <button key={val} onClick={()=>setFilterResult(val)} style={{
            padding:"6px 14px", borderRadius:"var(--r-sm)", border:`1px solid ${filterResult===val?"var(--teal)":"var(--border)"}`,
            background:filterResult===val?"rgba(24,132,133,0.1)":"var(--bg-card)",
            color:filterResult===val?"var(--teal)":"var(--muted)",
            fontSize:"12px", fontWeight:filterResult===val?"600":"400", cursor:"pointer",
          }}>
            {label}
            {val==="pending" && pending.length > 0 && (
              <span style={{ marginLeft:"5px", background:"var(--red)", color:"#fff", borderRadius:"10px", padding:"0 6px", fontSize:"9px", fontWeight:"800" }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bets list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)", fontSize:"13px" }}>Sin apuestas en esta categoría</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtered.map(b => {
            const col = b.result==="W"?"var(--green)":b.result==="L"?"var(--red)":b.result==="P"?"#f59e0b":"var(--faint)";
            return (
              <div key={b.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap", borderLeft:`3px solid ${col}` }}>
                <div style={{ flex:1, minWidth:"180px" }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)" }}>{b.match}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginTop:"3px" }}>
                    {b.market}{b.pick?` · ${b.pick}`:""} · ${b.stake} @ {b.odds} · {b.date}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"4px" }}>
                  {["W","L","P","pending"].map(r => (
                    <button key={r} onClick={() => setResult(b.id, r)} style={{
                      fontFamily:"'DM Mono',monospace", fontSize:"9px", padding:"5px 10px",
                      borderRadius:"4px", border:`1px solid ${b.result===r?col:"var(--border)"}`,
                      background:b.result===r?`${col}18`:"transparent",
                      color:b.result===r?col:"var(--muted)", cursor:"pointer", fontWeight:b.result===r?"700":"400",
                    }}>{r==="pending"?"PEND":r}</button>
                  ))}
                </div>
                <button onClick={() => deleteBet(b.id)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:"4px", padding:"5px 10px", fontSize:"11px", color:"var(--faint)", cursor:"pointer" }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
