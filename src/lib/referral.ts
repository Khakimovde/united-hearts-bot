export function calculateReferralPayout(earnedCoins: number, percent: number, carry = 0) {
  const safeEarnedCoins = Number.isFinite(earnedCoins) ? Math.max(0, Math.floor(earnedCoins)) : 0;
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  const safeCarry = Number.isFinite(carry) ? Math.max(0, Math.floor(carry)) : 0;

  const totalUnits = safeEarnedCoins * safePercent + safeCarry;

  return {
    payoutCoins: Math.floor(totalUnits / 100),
    nextCarry: totalUnits % 100,
  };
}