import type { VisibilityCriterion } from './VisibilityCriteria.js';
import type { VisibilityInput, VisibilityResult } from '../types/MoonVisibility.js';

/**
 * Odeh Criterion for moon visibility.
 * Simplified rule: visible if moon altitude >= 5° AND elongation >= 8° AND moon age >= 15 hours.
 */
export class OdehCriterion implements VisibilityCriterion {
  name = 'Odeh';

  isVisible(input: VisibilityInput): boolean {
    return this.evaluate(input).visible;
  }

  getConfidence(input: VisibilityInput): number {
    let score = 0;
    if (input.moonAltitudeAtSunset >= 5) score += 0.33;
    if (input.elongation >= 8) score += 0.33;
    if (input.moonAgeHours >= 15) score += 0.34;
    return score;
  }

  evaluate(input: VisibilityInput): VisibilityResult {
    const visible = input.moonAltitudeAtSunset >= 5 && 
                    input.elongation >= 8 && 
                    input.moonAgeHours >= 15;
    
    return {
      criterionName: this.name,
      visible,
      confidence: this.getConfidence(input),
      details: {
        altitude: input.moonAltitudeAtSunset,
        elongation: input.elongation,
        ageHours: input.moonAgeHours
      }
    };
  }
}
