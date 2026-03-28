const get = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
};
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const storage = {
  getPredictions:  ()    => get("tga_predictions", []),
  setPredictions:  (v)   => set("tga_predictions", v),
  getBets:         ()    => get("tga_bets", []),
  setBets:         (v)   => set("tga_bets", v),
  getBankroll:     ()    => get("tga_bankroll", null),
  setBankroll:     (v)   => set("tga_bankroll", v),
  getAnthropicKey: ()    => localStorage.getItem("tga_anthropic_key") || "",
  setAnthropicKey: (v)   => localStorage.setItem("tga_anthropic_key", v),
  getOddsKey:      ()    => localStorage.getItem("tga_odds_key") || "",
  setOddsKey:      (v)   => localStorage.setItem("tga_odds_key", v),
  getInstructions: ()    => localStorage.getItem("tga_instructions") || "",
  setInstructions: (v)   => localStorage.setItem("tga_instructions", v),
  getCachedPred:   (k)   => localStorage.getItem(`tga_pred_${k}`) || "",
  setCachedPred:   (k,v) => localStorage.setItem(`tga_pred_${k}`, v),
};
