export enum Madhab {
  SHAFI = 'Shafi',
  HANAFI = 'Hanafi'
}

export const ASR_SHADOW_FACTOR: Record<Madhab, number> = {
  [Madhab.SHAFI]: 1,
  [Madhab.HANAFI]: 2
};
