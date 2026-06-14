import type { VisibilityCriterion } from './VisibilityCriteria.js';
import type { VisibilityInput, VisibilityResult } from '../types/MoonVisibility.js';

/**
 * Yallop Criterion for moon visibility.
 */
export class YallopCriterion implements VisibilityCriterion {
  name = 'Yallop';

  isVisible(input: VisibilityInput): boolean {
    return this.evaluate(input).visible;
  }

  evaluate(input: VisibilityInput): VisibilityResult {
    // ARCV is the altitude difference between moon and sun.
    // The sun is at -0.833 altitude at sunset.
    const arcv = input.arcv ?? (input.moonAltitudeAtSunset - (-0.833));
    
    // The user prompt indicated w = moonAgeHours, but standard Yallop uses ARCL (elongation) for W.
    // We will use arcl/elongation by default as it fits the mathematical range of the polynomial better,
    // but we can fall back to age if elongation is 0 for some reason.
    const w = input.arcl || input.elongation || input.moonAgeHours; 

    // Calculate q parameter
    const q = (arcv - (11.8371 - 6.3226 * w + 0.7319 * w * w - 0.1018 * w * w * w)) / 10;
    
    let category = 'F';
    let visible = false;
    
    if (q > 0.216) {
      category = 'A';
      visible = true; // visible easily
    } else if (q > -0.014) {
      category = 'B';
      visible = true; // visible under perfect conditions
    } else if (q > -0.160) {
      category = 'C';
      visible = false; // may need optical aid
    } else if (q > -0.232) {
      category = 'D';
      visible = false; // need optical aid to find, then visible to naked eye
    } else {
      category = 'E';
      visible = false; // not visible
    }

    return {
      criterionName: this.name,
      visible,
      category,
      details: { q, w, arcv }
    };
  }
}
