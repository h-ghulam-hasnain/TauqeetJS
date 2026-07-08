import {
  toHijri,
  HijriMethod,
  HIJRI_MONTH_NAMES
} from '../../dist/index.js';

async function runTests() {
  console.log("==================================================");
  console.log("📅 HIJRI MODULE: METHODS COMPARISON TEST 📅");
  console.log("==================================================\n");

  // Let's pick a date near a new moon.
  // 9 April 2024 was around Eid al-Fitr (1 Shawwal).
  const testDate = new Date(Date.UTC(2024, 3, 9, 12, 0, 0)); // 9 April 2024, 12:00 UTC
  console.log(`Test Date: ${testDate.toUTCString()}\n`);

  function formatHijri(h) {
    return `${h.day.toString().padStart(2, '0')} ${HIJRI_MONTH_NAMES[h.month - 1]} ${h.year} AH`;
  }

  console.log("--- Comparing Methods ---");

  // 1. Civil
  const civilResult = toHijri(testDate, HijriMethod.CIVIL);
  console.log(`[Civil]       : ${formatHijri(civilResult)}`);

  // 2. Conjunction
  const conjResult = toHijri(testDate, HijriMethod.CONJUNCTION);
  console.log(`[Conjunction] : ${formatHijri(conjResult)}`);

  // 3. Umm al-Qura
  const ummResult = toHijri(testDate, HijriMethod.UMM_AL_QURA);
  console.log(`[Umm al-Qura] : ${formatHijri(ummResult)}`);

  // 4. Visibility (requires location)
  // Mecca: Lat 21.4225, Lon 39.8262
  try {
    const visResult = toHijri(testDate, HijriMethod.VISIBILITY, {
      location: { latitude: 21.4225, longitude: 39.8262 }
    });
    console.log(`[Visibility]  : ${formatHijri(visResult)} (Mecca, SA)`);
  } catch (e) {
    console.log(`[Visibility]  : Error (Mecca, SA) - ${e.stack}`);
  }

  try {
    const visResultLondon = toHijri(testDate, HijriMethod.VISIBILITY, {
      location: { latitude: 51.5074, longitude: -0.1278 }
    });
    console.log(`[Visibility]  : ${formatHijri(visResultLondon)} (London, UK)`);
  } catch (e) {
    console.log(`[Visibility]  : Error (London, UK) - ${e.message}`);
  }

  console.log("");
}

runTests().catch(console.error);
