import type { VisibilityInput, VisibilityResult } from '../types/MoonVisibility.js';

export interface VisibilityCriterion {
  name: string;
  isVisible(input: VisibilityInput): boolean;
  getConfidence?(input: VisibilityInput): number;
  evaluate(input: VisibilityInput): VisibilityResult;
}
