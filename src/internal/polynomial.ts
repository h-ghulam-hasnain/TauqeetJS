export function kahanSum(values: number[]): number {
  let sum = 0;
  let c = 0;
  for (const value of values) {
    const y = value - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }
  return sum;
}
