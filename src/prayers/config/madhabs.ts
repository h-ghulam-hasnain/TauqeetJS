export enum Madhab {
  HANAFI = 'Hanafi',
  SHAFI = 'Shafi',
  MALIKI = 'Maliki',
  HANBALI = 'Hanbali',
  JAAFARI = 'Jaafari',
}

export const ASR_SHADOW_FACTOR: Record<Madhab, number> = {
  [Madhab.HANAFI]: 2,
  [Madhab.SHAFI]: 1,
  [Madhab.MALIKI]: 1,
  [Madhab.HANBALI]: 1,
  [Madhab.JAAFARI]: 1,
};
