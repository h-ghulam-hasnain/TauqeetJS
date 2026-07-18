const fs = require('fs');

const content = fs.readFileSync('./src/astronomy/theories/elp2000/elp2000Data.ts', 'utf-8');
const lines = content.split('\n').filter(line => !line.startsWith('//'));
const jsonStr = lines.join('').replace('export const elp2000Data = ', '').trim().replace(/;$/, '');
const obj = JSON.parse(jsonStr);

console.log('ELP01 keys:', Object.keys(obj.ELP01[0]));
console.log('ELP04 keys:', Object.keys(obj.ELP04[0]));
console.log('ELP10 keys:', Object.keys(obj.ELP10[0]));
console.log('ELP16 keys:', Object.keys(obj.ELP16[0]));
