import type { PrayerMethodConfig } from '../types/index.js';
import { Madhab } from './madhabs.js';

/**
 * ============================================================================
 * CATEGORY 1: HANAFI MADHAB (الحَنَفِي)
 * ============================================================================
 * Foundational Criteria:
 * - Fajr: Subh al-Sadiq (True Dawn) - white horizontal light on horizon
 * - Asr: MITHL AL-THANI (مثل ثانی) - Shadow = 2× object + midday shadow
 * - Maghrib: Solar disc disappearance
 * - Isha: SHAFAQ AL-ABYADH (شفق ابیض) - White Twilight disappearance
 *
 * Verification Links:
 * - Classical Fiqh: Al-Hidayah (الهداية), Radd al-Muhtar (رد المحتار) by Ibn Abidin
 * - Asr Shadow: IslamQA Hanafi - https://islamqa.org/hanafi/fatwa-tt/134062
 * - White Twilight: Darul Iftaa - https://daruliftaa.us/fatwa/1247
 * - Modern Research: PrayTimes.org - https://praytimes.org/docs/methods
 */
export function getHanafiConfiguration(): Record<string, PrayerMethodConfig> {
  return {
    KarachiHanafi: {
      id: 'Karachi',
      isDefault: true,
      name: 'University of Islamic Sciences, Karachi (Hanafi)',
      fajrAngle: 18,
      ishaAngle: 18, // Traditional White Twilight (Shafaq al-Abyad)
      asrShadowMultiplier: 2, // Mithl al-Thani (مثل ثانی) - Double shadow
      twilightType: 'White',
      description:
        'Standard South Asian configuration. Uses 18° for Subh Sadiq and 18° for White Twilight.',
      source: 'UISK',
      // Verification: UISK Official - https://uisk.edu.pk (University of Islamic Sciences Karachi)
      // PrayTimes Method: https://praytimes.org/wiki/Calculation_Methods#Karachi
    },
    IndiaHanafi: {
      id: 'India',
      name: 'Darul Uloom Deoband / Jamiat Ulema-e-Hind',
      fajrAngle: 18,
      ishaAngle: 18,
      asrShadowMultiplier: 2,
      twilightType: 'White',
      description:
        'Widely used across Subcontinent. Strict 18° White Twilight + double-shadow Asr.',
      source: 'DUDeoband',
      // Verification: Darul Uloom Deoband - https://darululoom-deoband.com
      // Fiqh Hanafi Reference: https://islamqa.org/hanafi/qibla-hanafi/43601
    },
    MakkahHanafi: {
      id: 'Makkah',
      name: 'Umm al-Qura University (Hanafi Adaptation)',
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaMinutes: 90, // Fixed 90 min after Maghrib (120 min Ramadan)
      asrShadowMultiplier: 2, // Adapts Asr to Mithl al-Thani
      twilightType: 'Custom',
      description: 'Umm al-Qura standard angles with Hanafi Asr adaptation.',
      source: 'UAQ',
      // Verification: Umm al-Qura Official - https://ummalqura.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#Makkah
      // Library Reference: https://lib.rs/crates/salah
    },
    MWLHanafi: {
      id: 'MWL',
      name: 'Muslim World League (Hanafi Adapted)',
      fajrAngle: 18,
      ishaAngle: 17, // Standard MWL twilight angle
      asrShadowMultiplier: 2,
      twilightType: 'White',
      description: 'Adapted MWL: 18° Fajr, 17° Isha, Hanafi double-shadow Asr.',
      source: 'MWL',
      // Verification: MWL Official - https://mwl.org
      // PrayTimes Method: https://praytimes.org/wiki/Calculation_Methods#MWL
      // GitHub Methods: https://github.com/batoulapps/adhan-js/blob/master/METHODS.md
    },
    ISNAHanafi: {
      id: 'ISNA',
      name: 'Islamic Society of North America (Hanafi)',
      fajrAngle: 15,
      ishaAngle: 15, // Alternative Hanafi opinion (Sahibayn)
      asrShadowMultiplier: 2,
      twilightType: 'White',
      description:
        "North American Hanafi. 15° based on modern observation (Mufti Shafi' position).",
      source: 'ISNA',
      // Verification: ISNA Official - https://isna.net
      // Academic Paper: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
      // PrayCalc: https://praycalc.org/science/calculation-methods
    },
    CustomHanafi15Deg: {
      id: 'CustomHanafi15Deg',
      name: 'Modernist Hanafi (15° White Twilight)',
      fajrAngle: 15,
      ishaAngle: 15, // Abu Yusuf & Muhammad al-Husayn (Sahibayn) opinion
      asrShadowMultiplier: 2,
      twilightType: 'White',
      description: '15° White Twilight per Mufti Rasheed Ludhyanwi. Lower latitude alternative.',
      source: 'Modern Research',
      // Verification: Islam21c 18° Analysis - https://www.islam21c.com/special/prayer-fasting-ramadan-timetables/
      // UK Mosque Explanation: https://www.masjideumer.org.uk/salah-times-explanation-revised/
    },
  };
}

/**
 * ============================================================================
 * CATEGORY 2: SHAFI'I MADHAB (الشَّافِعِي)
 * ============================================================================
 * Foundational Criteria:
 * - Fajr: Subh al-Sadiq - white horizontal line (ijma consensus)
 * - Asr: MITHL AL-AWWAL (مثل أول) - Shadow = 1× object + midday shadow
 * - Maghrib: Solar disc disappearance
 * - Isha: SHAFAQ AL-AHMAR (شفق أحمر) - Red Twilight disappearance
 *
 * Verification Links:
 * - Classical Fiqh: Al-Majmu' (المجموع), Minhaj al-Talibin (منهج الطالبين) by Nawawi
 * - Fajr Definition: https://en.wikishia.net/view/Fajr (cross-reference)
 * - Isha Red Twilight: https://islamic-content.com/t/99663
 * - PrayTimes: https://praytimes.org/docs/methods
 */
export function getShafiConfiguration(): Record<string, PrayerMethodConfig> {
  return {
    MWLShafi: {
      id: 'MWL',
      name: 'Muslim World League (Standard Shafi/Maliki/Hanbali)',
      fajrAngle: 18,
      ishaAngle: 17, // Red Twilight transition angle
      asrShadowMultiplier: 1, // Mithl al-Awwal (مثل أول) - Single shadow
      twilightType: 'Red',
      description: 'Default across Europe, Africa, Middle East for non-Hanafi schools.',
      source: 'MWL',
      // Verification: MWL Official - https://mwl.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#MWL
      // Manpages: https://manpages.org/ipraytime
    },
    ISNAShafi: {
      id: 'ISNA',
      name: 'Islamic Society of North America (Standard)',
      fajrAngle: 15,
      ishaAngle: 15, // Red Twilight (Shafaq al-Ahmar)
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Standard North America. 15° Fajr + Isha per Fiqh Council.',
      source: 'ISNA',
      // Verification: ISNA PDF - https://archive.stmarys-ca.edu/archive-ga-23-1k-2-80/islamic-society-of-north-america-prayer-times.pdf
      // Academic: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
      // PrayCalc: https://praycalc.org/science/calculation-methods
    },
    EgyptShafi: {
      id: 'Egypt',
      name: 'Egyptian General Authority of Survey',
      fajrAngle: 19.5,
      ishaAngle: 17.5,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Egypt/Levant standard. Higher angles for precise Red Twilight.',
      source: 'EGAS',
      // Verification: PrayCalc Methods - https://praycalc.org/science/calculation-methods
      // Academic Paper: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
    },
    MakkahShafi: {
      id: 'Makkah',
      name: 'Umm al-Qura University, Makkah (Official)',
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaMinutes: 90, // Fixed 90 min (120 min Ramadan)
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Official Saudi/Hijaz configuration. Fixed minutes for Isha.',
      source: 'UAQ',
      // Verification: Umm al-Qura - https://ummalqura.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#Makkah
      // Library: https://lib.rs/crates/salah
      // Facebook Ireland: https://www.facebook.com/groups/smartazangroup/posts/661337199894766/
    },
    Algeria12Deg: {
      id: 'Algeria',
      isDefault: true,
      name: 'North African Maliki-Shafi (12° Red Twilight)',
      fajrAngle: 18,
      ishaAngle: 12, // Strict astronomical Red Twilight
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Coastal North Africa. 12° tracks exact red glow departure.',
      source: 'Ministry of Religious Affairs, Algeria',
      // Verification: Islam21c 18° Debate - https://www.islam21c.com/special/prayer-fasting-ramadan-timetables/
      // Red Twilight 12°: https://www.masjideumer.org.uk/salah-times-explanation-revised/
    },
  };
}

/**
 * ============================================================================
 * CATEGORY 3: MALIKI MADHAB (المَالِكِي)
 * ============================================================================
 * Foundational Criteria:
 * - Fajr: Subh al-Sadiq - white horizontal dawn (same as Shafi'i)
 * - Asr: MITHL AL-AWWAL (مثل أول) - Shadow exceeds object length
 * - Maghrib: Solar disc disappearance
 * - Isha: SHAFAQ AL-AHMAR (شفق أحمر) - Red Twilight (same as Shafi'/Hanbali)
 *
 * Verification Links:
 * - Classical Fiqh: Al-Mukhtasar (المختصر) by Khalil, Risalah (رسالة) by Ibn Rushd
 * - Asr Shadow: https://daruliftaa.us/fatwa/1247 (comparative)
 * - PrayTimes: https://praytimes.org/docs/methods
 * - About Islam: https://aboutislam.net/live-session/live-fatwa-general-session-5/prayer-times/
 */
export function getMalikiConfiguration(): Record<string, PrayerMethodConfig> {
  return {
    MWLMaliki: {
      id: 'MWL',
      name: 'Muslim World League (Standard Maliki)',
      fajrAngle: 18,
      ishaAngle: 17,
      asrShadowMultiplier: 1, // Mithl al-Awwal
      twilightType: 'Red',
      description: 'Standard Maliki across West Africa, North Africa. Red Twilight.',
      source: 'MWL',
      // Verification: MWL - https://mwl.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#MWL
    },
    MakkahMaliki: {
      id: 'Makkah',
      name: 'Umm al-Qura University (Maliki)',
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaMinutes: 90,
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Saudi official method for Maliki school. Fixed Isha minutes.',
      source: 'UAQ',
      // Verification: Umm al-Qura - https://ummalqura.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#Makkah
      // Library: https://lib.rs/crates/salah
    },
    AlgeriaMaliki: {
      id: 'Algeria',
      isDefault: true,
      name: 'Morocco-Algeria Maliki (12°)',
      fajrAngle: 18,
      ishaAngle: 12, // Strict Red Twilight
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'West Africa/Maghreb. Exact Red Twilight at 12°.',
      source: 'Ministry of Religious Affairs, Algeria',
      // Verification: Islam21c - https://www.islam21c.com/special/prayer-fasting-ramadan-timetables/
      // Red Twilight Debate: https://www.masjideumer.org.uk/salah-times-explanation-revised/
    },
    EgyptMaliki: {
      id: 'Egypt',
      name: 'Egyptian General Authority (Maliki)',
      fajrAngle: 19.5,
      ishaAngle: 17.5,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Egypt/North Africa standard. Higher precision angles.',
      source: 'EGAS',
      // Verification: PrayCalc - https://praycalc.org/science/calculation-methods
      // Academic: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
    },
    ISNAMaliki: {
      id: 'ISNA',
      name: 'Islamic Society of North America (Maliki)',
      fajrAngle: 15,
      ishaAngle: 15,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'North American Maliki. 15° standard per Fiqh Council.',
      source: 'ISNA',
      // Verification: ISNA PDF - https://archive.stmarys-ca.edu/archive-ga-23-1k-2-80/islamic-society-of-north-america-prayer-times.pdf
      // Academic: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
    },
  };
}

/**
 * ============================================================================
 * CATEGORY 4: HANBALI MADHAB (الحَنْبَلِي)
 * ============================================================================
 * Foundational Criteria:
 * - Fajr: Subh al-Sadiq - second dawn, white line on horizon
 * - Asr: MITHL AL-AWWAL (مثل أول) - Shadow = object + midday shadow
 * - Maghrib: Solar disc disappearance
 * - Isha: SHAFAQ AL-AHMAR (شفق أحمر) - Red Twilight disappearance
 *
 * Verification Links:
 * - Classical Fiqh: Al-Mughni (المغني) by Ibn Qudamah, Kashshaaf al-Qinaa (كشاف القناع) by Barta'i
 * - Fajr Start: https://islamqa.info/en/answers/93160
 * - Asr Shadow: https://daruliftaa.us/fatwa/1247
 * - PrayTimes: https://praytimes.org/docs/methods
 */
export function getHanbaliConfiguration(): Record<string, PrayerMethodConfig> {
  return {
    MWLHanbali: {
      id: 'MWL',
      isDefault: true,
      name: 'Muslim World League (Standard Hanbali)',
      fajrAngle: 18,
      ishaAngle: 17,
      asrShadowMultiplier: 1, // Mithl al-Awwal
      twilightType: 'Red',
      description: 'Standard Hanbali across Middle East. Red Twilight.',
      source: 'MWL',
      // Verification: MWL - https://mwl.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#MWL
      // Manpages: https://manpages.org/ipraytime
    },
    MakkahHanbali: {
      id: 'Makkah',
      name: 'Umm al-Qura University (Official Hanbali)',
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaMinutes: 90,
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Official Saudi method for Hanbali school. Fixed Isha.',
      source: 'UAQ',
      // Verification: Umm al-Qura - https://ummalqura.org
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods#Makkah
      // Library: https://lib.rs/crates/salah
      // Facebook: https://www.facebook.com/groups/smartazangroup/posts/661337199894766/
    },
    EgyptHanbali: {
      id: 'Egypt',
      name: 'Egyptian General Authority (Hanbali)',
      fajrAngle: 19.5,
      ishaAngle: 17.5,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Egypt/Levant Hanbali. Higher precision angles.',
      source: 'EGAS',
      // Verification: PrayCalc - https://praycalc.org/science/calculation-methods
      // Academic: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
    },
    ISNAHanbali: {
      id: 'ISNA',
      name: 'Islamic Society of North America (Hanbali)',
      fajrAngle: 15,
      ishaAngle: 15,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'North American Hanbali. 15° standard.',
      source: 'ISNA',
      // Verification: ISNA PDF - https://archive.stmarys-ca.edu/archive-ga-23-1k-2-80/islamic-society-of-north-america-prayer-times.pdf
      // Academic: https://feng.stafpu.bu.edu.eg/Surveying%20Engineering/3666/publications/Saad%20Zaki%20Bolbol_pdf.pdf
    },
    KuwaitHanbali: {
      id: 'Kuwait',
      name: 'Kuwait Ministry (Hanbali)',
      fajrAngle: 18,
      ishaAngle: 17,
      asrShadowMultiplier: 1,
      twilightType: 'Red',
      description: 'Kuwait/Gulf standard Hanbali method.',
      source: 'Kuwait Ministry',
      // Verification: PrayTimes Kuwait - https://praytimes.org/wiki/Calculation_Methods
      // Central Mosque: https://central-mosque.com/index.php/Acts-of-Worship/calculating-prayer-times-for-your-local-masjid.html
    },
  };
}

/**
 * ============================================================================
 * CATEGORY 5: JA'FARI/SHIA MADHAB (الجعفري - الاثني عشري)
 * ============================================================================
 * Foundational Criteria:
 * - Fajr: Subh al-Sadiq - bright light spread on horizon after night
 * - Asr: MITHL AL-AWWAL (مثل أول) - Shadow = 1× object + midday shadow
 * - Maghrib: AL-GHURUB AL-SHAR'I (الغروب الشرعي) - Eastern twilight REDNESS disappears
 *            (~10-15 min AFTER solar disc disappearance) [Different from Sunni!]
 * - Isha: Darkness after redness (not explicitly Ahmar/Abyadh distinction)
 *
 * Verification Links:
 * - Classical Fiqh: Al-Kafi (الكافي) Hadith Vol 3, Tahdhib al-Ahkam (تهذيب الأحكام)
 * - Maghrib Shia: https://www.twelvershia.net/2018/05/16/shia-maghrib-prayer-timing/
 * - Maghrib Questions: https://al-islam.org/ask/topics/5822/questions-about-Maghrib
 * - Tehran Method: https://prayertimes.date/tehran
 * - Al-Islam Q&A: https://al-islam.org/ask/topics/5822/questions-about-Maghrib?page=1
 */
export function getJaafariConfiguration(): Record<string, PrayerMethodConfig> {
  return {
    TehranJaafari: {
      id: 'Tehran',
      name: 'Institute of Geophysics, University of Tehran (Official)',
      fajrAngle: 17.7,
      ishaAngle: 14, // Shia standard Isha angle
      maghribAngle: 4.5, // Shia Maghrib: 4.5° below horizon
      asrShadowMultiplier: 1, // Mithl al-Awwal
      twilightType: 'Custom',
      description: 'Official Iranian Shia method. Maghrib at 4.5° (eastern redness). Isha at 14°.',
      source: 'University of Tehran',
      // Verification: Institute of Geophysics - (Official Tehran method)
      // PrayTimes Tehran: https://prayertimes.date/tehran
      // GitHub Method: https://docs.rs/salah/latest/salah/enum.Method.html
      // Rust Library: https://lib.rs/crates/salah
    },
    QomJaafari: {
      id: 'Qom',
      name: 'Leva Research Institute, Qom (Official)',
      fajrAngle: 16,
      ishaAngle: 14, // Shia standard
      maghribAngle: 4, // Shia Maghrib: 4° below horizon
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Official Qom Shia method. Lower Fajr (16°), Maghrib at 4°.',
      source: 'Leva Research Institute',
      // Verification: Leva Institute - (Official Qom method)
      // PrayCalc: https://praycalc.org/science/calculation-methods
      // Mintlify Wiki: https://mintlify.wiki/agnanp/praydo/configuration/calculation-methods
    },
    MalaysiaJaafari: {
      id: 'Malaysia',
      name: 'Malaysia Shia Community (Tehran)',
      fajrAngle: 17.7,
      ishaAngle: 14,
      maghribAngle: 4.5,
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Malaysia Shia using Tehran method. Eastern redness for Maghrib.',
      source: 'Malaysia Shia Council',
      // Verification: Malaysia Discussion - https://github.com/mptwaktusolat/app_waktu_solat_malaysia/discussions/179
      // PrayTimes: https://praytimes.org/wiki/Calculation_Methods
    },
    GlobalJaafari: {
      id: 'Global',
      isDefault: true,
      name: 'Global Shia Standard (Tehran)',
      fajrAngle: 17.7,
      ishaAngle: 14,
      maghribAngle: 4.5,
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'Default global Shia. Tehran standard used by most communities.',
      source: 'Jaafari Standard',
      // Verification: Al-Islam Q&A - https://al-islam.org/ask/topics/5822/questions-about-Maghrib
      // TwelverShia: https://www.twelvershia.net/2018/05/16/shia-maghrib-prayer-timing/
    },
    UKJaafari: {
      id: 'UK',
      name: 'UK Shia Community (Qom)',
      fajrAngle: 16,
      ishaAngle: 14,
      maghribAngle: 4,
      asrShadowMultiplier: 1,
      twilightType: 'Custom',
      description: 'UK Shia using Leva Qom method. Lower angles for high latitude.',
      source: 'Leva Research Institute',
      // Verification: UK Forum - https://www.therevival.co.uk/forum/general/8537
      // Leva Qom: https://praycalc.org/science/calculation-methods
    },
  };
}

export const BUILT_IN_METHODS: Record<Madhab, Record<string, PrayerMethodConfig>> = {
  [Madhab.HANAFI]: getHanafiConfiguration(),
  [Madhab.SHAFI]: getShafiConfiguration(),
  [Madhab.MALIKI]: getMalikiConfiguration(),
  [Madhab.HANBALI]: getHanbaliConfiguration(),
  [Madhab.JAAFARI]: getJaafariConfiguration(),
};
