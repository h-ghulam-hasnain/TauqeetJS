export function dot(a: readonly number[], b: readonly number[]): number {
  let result = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const ai = a[i]!;
    const bi = b[i]!;
    result += ai * bi;
  }
  return result;
}
