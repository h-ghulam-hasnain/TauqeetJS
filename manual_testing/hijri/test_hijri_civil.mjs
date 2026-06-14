import {
  toHijri,
  toGregorian,
  HijriMethod,
  HIJRI_MONTH_NAMES,
  HijriEngine
} from '../../dist/index.js';

async function runTests() {
  console.log("==================================================");
  console.log("📅 HIJRI MODULE: MANUAL CIVIL CALENDAR TEST 📅");
  console.log("==================================================\n");

  const today = new Date();
  console.log(`Current Gregorian Date: ${today.toUTCString()}\n`);

  console.log("--- 1. Simple Conversion (Gregorian -> Civil Hijri) ---");
  const hijriToday = toHijri(today, HijriMethod.CIVIL);
  console.log(`Hijri Date: ${hijriToday.day} ${HIJRI_MONTH_NAMES[hijriToday.month - 1]} ${hijriToday.year} AH`);

  console.log("\n--- 2. Reverse Conversion (Civil Hijri -> Gregorian) ---");
  const backToGregorian = toGregorian(hijriToday, HijriMethod.CIVIL);
  console.log(`Converted Back: ${backToGregorian.toUTCString()}`);

  console.log("\n--- 3. Epoch Verification (1 Muharram 1 AH) ---");
  const epochHijri = { year: 1, month: 1, day: 1 };
  const epochGregorian = toGregorian(epochHijri, HijriMethod.CIVIL);
  console.log(`1 Muharram 1 AH corresponds to: ${epochGregorian.toUTCString()}`);

  console.log("\n--- 4. Month Grid (Calendar view for current month) ---");
  const engine = new HijriEngine(HijriMethod.CIVIL);
  const grid = engine.getMonthGrid(hijriToday.year, hijriToday.month);
  console.log(`Calendar for ${HIJRI_MONTH_NAMES[hijriToday.month - 1]} ${hijriToday.year} AH:`);
  console.log(" Su  Mo  Tu  We  Th  Fr  Sa");
  for (const week of grid) {
    const row = week.map(d => d ? d.day.toString().padStart(3, ' ') : "   ").join(" ");
    console.log(row);
  }
  console.log("");
}

runTests().catch(console.error);
