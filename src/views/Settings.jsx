import { useState } from "react";
import { storage } from "../lib/storage";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"22px 24px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
  lbl:   { fontFamily:"'DM Mono',monospace", fontSize:"10px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"5px" },
};

function Section({ title, children }) {
  return (
    <div style={{ ...S.card, marginBottom:"16px" }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"700", color:"var(--navy)", marginBottom:"18px", paddingBottom:"12px", borderBottom:"1px solid var(--border)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [anthropicKey,   setAnthropicKeyState]  = useState(storage.getAnthropicKey() || "");
  const [oddsKey,        setOddsKeyState]        = useState(storage.getOddsKey() || "");
  const [instructions,   setInstructionsState]   = useState(storage.getInstructions() || "");
  const [saved,          setSaved]               = useState(false);
  const [showAnthropic,  setShowAnthropic]        = useState(false);
  const [showOdds,       setShowOdds]             = useState(false);

  function save() {
    storage.setAnthropicKey(anthropicKey.trim());
    storage.setOddsKey(oddsKey.trim());
    storage.setInstructions(instructions.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clearAll() {
    if (!confirm("¿Borrar todas las API keys guardadas?")) return;
    storage.setAnthropicKey("");
    storage.setOddsKey("");
    setAnthropicKeyState("");
    setOddsKeyState("");
  }

  const inputStyle = {
    fontFamily:"'DM Mono',monospace", fontSize:"12px",
    letterSpacing:"0.5px",
  };

  return (
    <div className="fade-up" style={{ maxWidth:"680px" }}>
      {/* Header */}
      <div style={{ marginBottom:"28px" }}>
        <span style={S.label}>Configuración</span>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Ajustes</h1>
        <p style={{ fontSize:"12px", color:"var(--muted)" }}>Las API keys se guardan solo en tu navegador (localStorage).</p>
      </div>

      {/* Anthropic */}
      <Section title="Anthropic API">
        <span style={S.lbl}>API Key</span>
        <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
          <input
            type={showAnthropic ? "text" : "password"}
            value={anthropicKey}
            onChange={e => setAnthropicKeyState(e.target.value)}
            placeholder="sk-ant-..."
            style={{ ...inputStyle, flex:1 }}
          />
          <button onClick={() => setShowAnthropic(!showAnthropic)} style={{
            padding:"0 12px", background:"var(--bg-sub)", border:"1px solid var(--border)",
            borderRadius:"var(--r-sm)", fontSize:"11px", color:"var(--muted)", cursor:"pointer",
          }}>{showAnthropic ? "Ocultar" : "Ver"}</button>
        </div>
        <p style={{ fontSize:"11px", color:"var(--muted)", margin:0 }}>
          Requerida para análisis de partidos. Obtén tu key en <strong>console.anthropic.com</strong>.
          Modelo: claude-sonnet-4-20250514
        </p>
      </Section>

      {/* Odds API */}
      <Section title="The Odds API">
        <span style={S.lbl}>API Key</span>
        <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
          <input
            type={showOdds ? "text" : "password"}
            value={oddsKey}
            onChange={e => setOddsKeyState(e.target.value)}
            placeholder="Tu key de the-odds-api.com"
            style={{ ...inputStyle, flex:1 }}
          />
          <button onClick={() => setShowOdds(!showOdds)} style={{
            padding:"0 12px", background:"var(--bg-sub)", border:"1px solid var(--border)",
            borderRadius:"var(--r-sm)", fontSize:"11px", color:"var(--muted)", cursor:"pointer",
          }}>{showOdds ? "Ocultar" : "Ver"}</button>
        </div>
        <p style={{ fontSize:"11px", color:"var(--muted)", margin:0 }}>
          Opcional — para mostrar momios reales en el análisis. Plan gratuito: 500 req/mes.
        </p>
      </Section>

      {/* Personal instructions */}
      <Section title="Instrucciones personales para el análisis">
        <span style={S.lbl}>Prompt adicional</span>
        <textarea
          value={instructions}
          onChange={e => setInstructionsState(e.target.value)}
          placeholder={"Ej:\n- Prefiero apuestas de runline\n- Stake máximo $50\n- Soy conservador, mínimo 65% confianza\n- Evitar equipos con ERA > 5.00"}
          style={{ minHeight:"120px", resize:"vertical", marginBottom:"8px" }}
        />
        <p style={{ fontSize:"11px", color:"var(--muted)", margin:0 }}>
          Se incluirán en cada análisis de Claude para personalizar las recomendaciones.
        </p>
      </Section>

      {/* Actions */}
      <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
        <button onClick={save} style={{
          padding:"11px 28px", background:"var(--teal)", color:"#fff",
          border:"none", borderRadius:"var(--r-sm)", fontSize:"13px",
          fontWeight:"700", cursor:"pointer",
        }}>
          {saved ? "✓ Guardado" : "Guardar ajustes"}
        </button>
        <button onClick={clearAll} style={{
          padding:"11px 20px", background:"none",
          border:"1px solid #fecaca", borderRadius:"var(--r-sm)",
          fontSize:"12px", color:"var(--red)", cursor:"pointer",
        }}>Borrar keys</button>
      </div>

      {/* Info */}
      <div style={{ ...S.card, marginTop:"28px", background:"rgba(24,132,133,0.04)", border:"1px solid rgba(24,132,133,0.15)" }}>
        <span style={S.label}>Información</span>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginTop:"8px" }}>
          {[
            { l:"Modelo Claude",    v:"claude-sonnet-4-20250514" },
            { l:"Almacenamiento",   v:"localStorage (local)" },
            { l:"Prefix storage",   v:"tga_" },
            { l:"Versión",          v:"1.0.0" },
          ].map(i => (
            <div key={i.l}>
              <span style={{ ...S.lbl, marginBottom:"2px" }}>{i.l}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--text)" }}>{i.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
