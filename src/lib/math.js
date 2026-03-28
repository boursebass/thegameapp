export function impliedProb(americanOdds) {
  const o = parseInt(americanOdds);
  if (isNaN(o)) return null;
  return o > 0 ? 100 / (o + 100) : Math.abs(o) / (Math.abs(o) + 100);
}

export function calcEV(realProb, americanOdds, stake = 1) {
  const o = parseInt(americanOdds);
  if (isNaN(o)) return null;
  const payout = o > 0 ? stake * (o / 100) : stake * (100 / Math.abs(o));
  return (realProb * payout) - ((1 - realProb) * stake);
}

export function kellyStake(realProb, americanOdds) {
  const o = parseInt(americanOdds);
  if (isNaN(o) || realProb <= 0) return 0;
  const b = o > 0 ? o / 100 : 100 / Math.abs(o);
  const q = 1 - realProb;
  const kelly = (b * realProb - q) / b;
  return parseFloat((Math.max(0, kelly * 0.25) * 100).toFixed(1));
}

export function calcPayout(stake, odds) {
  const o = parseInt(odds);
  if (isNaN(o)) return 0;
  return o > 0 ? stake * (o / 100) : stake * (100 / Math.abs(o));
}

export function computeBankroll(starting, bets) {
  let bank = starting, totalStaked = 0, totalProfit = 0;
  let wins = 0, losses = 0, pushes = 0;
  let streak = 0, streakType = null;
  let bestWin = null, worstLoss = null;

  for (const b of bets) {
    if (!b.result || b.result === "pending") continue;
    const stake = parseFloat(b.stake) || 0;
    totalStaked += stake;
    if (b.result === "W") {
      const profit = calcPayout(stake, b.odds);
      bank += profit; totalProfit += profit; wins++;
      if (streakType === "W") streak++; else { streakType = "W"; streak = 1; }
      if (!bestWin || profit > bestWin.profit) bestWin = { ...b, profit };
    } else if (b.result === "L") {
      bank -= stake; totalProfit -= stake; losses++;
      if (streakType === "L") streak++; else { streakType = "L"; streak = 1; }
      if (!worstLoss || stake > worstLoss.stake) worstLoss = { ...b };
    } else {
      pushes++;
    }
  }
  const roi     = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  return { bank, totalProfit, roi, winRate, wins, losses, pushes, streak, streakType, bestWin, worstLoss, totalStaked };
}
