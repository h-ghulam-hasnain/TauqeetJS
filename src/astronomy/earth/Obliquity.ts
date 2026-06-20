export function computeMeanObliquity(te: number): number {
  return 23.4392911111111 + (te * (te * (te * 0.001813 - 0.00059) - 46.815)) / 3600;
}

export function computeTrueObliquity(eps0: number, deltaEps: number): number {
  return eps0 + deltaEps;
}
