import { useState, useEffect, useCallback } from "react";
import { storage } from "./lib/storage";
import { fetchTodayGames } from "./lib/mlb";

import Login        from "./components/Login";
import TopNav       from "./components/TopNav";
import Dashboard    from "./views/Dashboard";
import Analizar     from "./views/Analizar";
import Equipos      from "./views/Equipos";
import Predicciones from "./views/Predicciones";
import Bankroll     from "./views/Bankroll";
import Estadisticas from "./views/Estadisticas";
import Settings     from "./views/Settings";

// ── Auth wrapper ─────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("tga_auth") === "1");
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <Main />;
}

// ── Main app (all hooks safe here — always rendered) ─────────────────────────
function Main() {
  const [view,         setView]         = useState("dashboard");
  const [todayGames,   setTodayGames]   = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  const [predictions, setPredictionsState] = useState(() => storage.getPredictions());
  const [bets,        setBetsState]        = useState(() => storage.getBets());
  const [bankroll,    setBankrollState]    = useState(() => storage.getBankroll());

  const setPredictions = useCallback(v => {
    const val = typeof v === "function" ? v(storage.getPredictions()) : v;
    storage.setPredictions(val);
    setPredictionsState(val);
  }, []);

  const setBets = useCallback(v => {
    const val = typeof v === "function" ? v(storage.getBets()) : v;
    storage.setBets(val);
    setBetsState(val);
  }, []);

  const setBankroll = useCallback(v => {
    storage.setBankroll(v);
    setBankrollState(v);
  }, []);

  useEffect(() => {
    fetchTodayGames()
      .then(setTodayGames)
      .catch(() => setTodayGames([]))
      .finally(() => setLoadingGames(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      fetchTodayGames().then(setTodayGames).catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, []);

  function savePrediction(pred) {
    setPredictions(prev => {
      const withoutDup = prev.filter(p => p.id !== pred.id);
      return [pred, ...withoutDup];
    });
  }

  function addBet(bet) {
    setBets(prev => [...prev, bet]);
    setView("bankroll");
  }

  const pendingBets = bets.filter(b => !b.result || b.result === "pending").length;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", position:"relative" }}>
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <TopNav view={view} onNav={setView} pendingBets={pendingBets} />

        <main style={{
          flex:1,
          maxWidth:"1440px",
          width:"100%",
          margin:"0 auto",
          padding:"clamp(16px,2.5vw,32px) clamp(12px,2.5vw,28px)",
        }}>
          {view === "dashboard" && (
            <Dashboard
              todayGames={todayGames}
              loadingGames={loadingGames}
              predictions={predictions}
              bankroll={bankroll}
              bets={bets}
              onPickGame={g => setSelectedGame(g)}
              onNav={setView}
            />
          )}
          {view === "analizar" && (
            <Analizar
              todayGames={todayGames}
              loadingGames={loadingGames}
              selectedGame={selectedGame}
              onSavePrediction={savePrediction}
              onAddBet={addBet}
              bankroll={bankroll}
            />
          )}
          {view === "equipos"      && <Equipos />}
          {view === "predicciones" && <Predicciones predictions={predictions} setPredictions={setPredictions} />}
          {view === "bankroll"     && <Bankroll bankroll={bankroll} setBankroll={setBankroll} bets={bets} setBets={setBets} />}
          {view === "estadisticas" && <Estadisticas bets={bets} predictions={predictions} bankroll={bankroll} />}
          {view === "settings"     && <Settings />}
        </main>
      </div>
    </div>
  );
}
