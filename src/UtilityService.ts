// UtilityService - General utility functions

export class UtilityService {
  /**
   * Shuffle array using Fisher-Yates algorithm
   * This implementation properly handles TypeScript's noUncheckedIndexedAccess
   */
  public static shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      // With noUncheckedIndexedAccess, we need to handle potential undefined values
      const elementI = array[i];
      const elementJ = array[j];

      // Since we're iterating from length-1 to 0, these should never be undefined
      // but TypeScript doesn't know that, so we use type assertions
      if (elementI !== undefined && elementJ !== undefined) {
        array[i] = elementJ;
        array[j] = elementI;
      }
    }
  }
}
