import { OracleSystem } from './OracleSystem.ts';
import { type CoreColor, Resource } from './types.ts';

export interface UiState {
  reset(): void;
  getSelectedRecoloring(): number;
  setSelectedRecoloring(favorSpent: number): boolean;
  clearSelectedRecoloring(): void;
  getSelectedResource(): Resource;
  setSelectedDieColor(color: CoreColor): void;
  setSelectedOracleCardColor(color: CoreColor): void;
  getEffectiveSelectedColor(): CoreColor | null;
  clearResourceSelection(): void;
}
export class UiStateClass {
  public constructor() {
    this.selectedResource = Resource.none;
    this.selectedRecoloring = 0;
  }

  public reset(): void {
    this.selectedResource = Resource.none;
    this.selectedRecoloring = 0;
  }

  public getSelectedRecoloring(): number {
    return this.selectedRecoloring || 0;
  }

  public setSelectedRecoloring(
    favorSpent: number,
  ): boolean {
    this.selectedRecoloring = favorSpent;
    return true;
  }

  public clearSelectedRecoloring(): void {
    this.selectedRecoloring = 0;
  }

  public getSelectedResource(): Resource {
    return this.selectedResource;
  }

  public setSelectedDieColor(color: CoreColor): void {
    this.selectedResource = Resource.createDie(color);
  }

  public setSelectedOracleCardColor(color: CoreColor): void {
    this.selectedResource = Resource.createCard(color);
  }

  public getEffectiveSelectedColor(): CoreColor | null {
    if (!this.selectedResource.hasColor()) {
      return null;
    }
    const selectedColor = this.selectedResource.getColor();

    const favorForRecoloring = this.getSelectedRecoloring();
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      favorForRecoloring,
    );
    return effectiveColor;
  }

  public clearResourceSelection(): void {
    this.selectedResource = Resource.none;
  }

  private selectedResource: Resource;
  private selectedRecoloring: number;
}
