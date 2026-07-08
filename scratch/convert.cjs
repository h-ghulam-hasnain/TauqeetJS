const fs = require('fs');
const path = 'src/astronomy/theories/vsop87/vsop87Coefficients.ts';
let code = fs.readFileSync(path, 'utf8');

const converter = `export interface ParallelSeries {
  A: Float64Array;
  B: Float64Array;
  C: Float64Array;
}

export function convertToParallel(interleaved: Float64Array): ParallelSeries {
  const len = interleaved.length / 3;
  const A = new Float64Array(len);
  const B = new Float64Array(len);
  const C = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    A[i] = interleaved[i * 3];
    B[i] = interleaved[i * 3 + 1];
    C[i] = interleaved[i * 3 + 2];
  }
  return { A, B, C };
}`;

code = code.replace(/export type VSOPSeries = Float64Array;/, converter);

// Replace export const X = new Float64Array with const _X = new Float64Array
code = code.replace(/export const ([LBR][0-5]) = new Float64Array/g, 'const _$1 = new Float64Array');

// We need to add the export after the array definition.
// The array definition ends with `]);`
code = code.replace(/(const _([LBR][0-5]) = new Float64Array\([\s\S]*?\);)/g, '$1\nexport const $2 = convertToParallel(_$2);');

fs.writeFileSync(path, code);
console.log('Done converting vsop87Coefficients.ts');
