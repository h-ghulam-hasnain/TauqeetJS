import { CalendarService } from '../../dist/index.js';

const service = new CalendarService();

// =============================================================
// 📅 EXAMPLE 1: MONTHLY CALENDAR — DEFAULT PARAMETERS
// =============================================================
// Only latitude, longitude, and target month/year are required.
// All other config (method, madhab, timezone, elevation, etc.)
// fall back to library defaults automatically.
//
// Defaults used internally:
// - madhab: Hanafi
// - method: Karachi
// - timeZone: System Local Timezone
// - elevation: 0
// - temperatureC: 10
// - pressureMbar: 1010
// - highLatitudeStrategy: MiddleOfNight
// =============================================================

/** Convert a UTC ISO string to HH:MM in the local system timezone. */
function utcToLocal(iso: string | null): string {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', {
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
console.log(`📅 EXAMPLE 1: MONTHLY CALENDAR — DEFAULT PARAMETERS`);
console.log(`=============================================================`);

try {
    const monthlyDefault = service.generateMonthlyCalendar(
        2026, // year
        9,    // month (September)
        {
            lat:  31.39965,
            long: 73.02003,
        }
    );

    console.log(`\nYear  : ${monthlyDefault.year}`);
    console.log(`Month : ${monthlyDefault.month}`);
    console.log(`Days  : ${monthlyDefault.days.length}`);
    console.log(`Times shown in ${TZ_LABEL} (Local Time)\n`);

    for (const day of monthlyDefault.days) {
        console.log(
            `  ${day.date}  ` +
            `Fajr: ${utcToLocal(day.fajr)}  ` +
            `Sunrise: ${utcToLocal(day.sunrise)}  ` +
            `Dhuhr: ${utcToLocal(day.dhuhr)}  ` +
            `Asr: ${utcToLocal(day.asr)}  ` +
            `Maghrib: ${utcToLocal(day.maghrib)}  ` +
            `Isha: ${utcToLocal(day.isha)}  (${TZ_LABEL})`
        );
    }
} catch (err) {
    console.error(`Monthly Calendar (default) failed:`, err);
}

console.log(`=============================================================\n`);