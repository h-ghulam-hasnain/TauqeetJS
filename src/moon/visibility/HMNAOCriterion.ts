import type { VisibilityCriterion } from './VisibilityCriteria.js';
import type { VisibilityInput, VisibilityResult } from '../types/MoonVisibility.js';
import { YallopCriterion } from './YallopCriterion.js';

/**
 * HMNAO Criterion for moon visibility.
 * Implemented as a wrapper over Yallop with slight modifications or as alias.
 */
export class HMNAOCriterion implements VisibilityCriterion {
  name = 'HMNAO';
  private yallop = new YallopCriterion();

  isVisible(input: VisibilityInput): boolean {
    return this.evaluate(input).visible;
  }

  evaluate(input: VisibilityInput): VisibilityResult {
    // For now, wrapping Yallop as requested for simplicity
    const result = this.yallop.evaluate(input);
    result.criterionName = this.name;
    return result;
  }
}
