import { CalendarService } from '../../dist/index.js';

const service = new CalendarService();

// =============================================================
// 📅 EXAMPLE 2: MONTHLY CALENDAR — ALL PARAMETERS EXHAUSTED
// =============================================================
// Demonstrates every available config option passed explicitly.
// We are passing the exact SAME values that the library uses
// as defaults internally.
// =============================================================

/** Convert a UTC ISO string to HH:MM in the specified timezone. */
function utcToLocal(iso: string | null, timeZone: string): string {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(d);
    const hh = parts.find(p => p.type === 'hour')?.value;
    const mm = parts.find(p => p.type === 'minute')?.value;
    const hour = hh === '24' ? '00' : hh;
    return `${hour}:${mm}`;
}

const TZ_LABEL = Intl.DateTimeFormat().resolvedOptions().timeZone;

console.log(`\n=============================================================`);
console.log(`📅 EXAMPLE 2: MONTHLY CALENDAR — ALL PARAMETERS EXHAUSTED`);
console.log(`=============================================================`);

const fullConfig = {
    // Geographic coordinates
    lat:  31.39965,
    long: 73.02003,

    // Timezone (System local timezone string, e.g., 'Asia/Karachi')
    timeZone: TZ_LABEL,

    // Calculation method and juristic school
    method: 'Karachi',
    madhab: 'Hanafi' as const,

    // Topographical and climatic corrections
    elevation: { value: 0, unit: 'meters' as const },
    temperatureC: 10,
    pressureMbar: 1010,

    // High-latitude fallback strategy
    highLatitudeStrategy: 'MiddleOfNight' as const,
    regionalFallbackLatitude: 45,

    // Fine-tuning per-prayer minute adjustments
    adjustments: {
        fajr:    0,
        sunrise: 0,
        dhuhr:   0,
        asr:     0,
        maghrib: 0,
        isha:    0,
    },
};

console.log(`\nConfig:`);
console.log(JSON.stringify(fullConfig, null, 2));

try {
    const monthlyFull = service.generateMonthlyCalendar(
        2026, // year
        9,    // month (September)
        fullConfig
    );

    console.log(`\nYear  : ${monthlyFull.year}`);
    console.log(`Month : ${monthlyFull.month}`);
    console.log(`Days  : ${monthlyFull.days.length}`);
    console.log(`Times shown in ${TZ_LABEL} (Local Time)\n`);

    for (const day of monthlyFull.days) {
        console.log(
            `  ${day.date}  ` +
            `Fajr: ${utcToLocal(day.fajr, TZ_LABEL)}  ` +
            `Sunrise: ${utcToLocal(day.sunrise, TZ_LABEL)}  ` +
            `Dhuhr: ${utcToLocal(day.dhuhr, TZ_LABEL)}  ` +
            `Asr: ${utcToLocal(day.asr, TZ_LABEL)}  ` +
            `Maghrib: ${utcToLocal(day.maghrib, TZ_LABEL)}  ` +
            `Isha: ${utcToLocal(day.isha, TZ_LABEL)}  (${TZ_LABEL})`
        );
    }

} catch (err) {
    console.error(`Monthly Calendar (all params) failed:`, err);
}

console.log(`=============================================================\n`);
