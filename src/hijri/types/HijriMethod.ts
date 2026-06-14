/**
 * Determines the rule-set used to convert dates.
 */
export enum HijriMethod {
  /** Tabular/Civil 30-year cycle calendar. Pure arithmetic, no astronomy. */
  CIVIL = 'civil',
  /** Astronomical conjunction: month starts on the calendar day (UTC) of the new moon. */
  CONJUNCTION = 'conjunction',
  /** Crescent visibility at a given location (requires lat/lon). */
  VISIBILITY = 'visibility',
  /** Official Saudi Umm al-Qura calendar (conjunction-based, Mecca). */
  UMM_AL_QURA = 'ummAlQura',
}
