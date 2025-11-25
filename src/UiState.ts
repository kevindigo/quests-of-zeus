import type { HexCoordinates } from './hexmap/HexGrid.ts';
import { Resource } from './Resource.ts';
import type { CoreColor } from './types.ts';

export interface UiState {
  reset(): void;
  getSelectedResource(): Resource;
  setSelectedResource(resource: Resource): void;
  getSelectedRecoloring(): number;
  getEffectiveSelectedColor(): CoreColor | null;
  clearResourceSelection(): void;

  getSelectedCoordinates(): HexCoordinates | null;
  setSelectedCoordinates(coordinates: HexCoordinates): void;
}
export class UiStateClass {
  public constructor() {
    this.selectedResource = Resource.none;
    this.selectedCoordinates = null;
  }

  public reset(): void {
    this.selectedResource = Resource.none;
    this.selectedCoordinates = null;
  }

  public getSelectedRecoloring(): number {
    return this.selectedResource.getRecolorCost();
  }

  public getSelectedResource(): Resource {
    return this.selectedResource;
  }

  public setSelectedResource(resource: Resource): void {
    this.selectedResource = resource;
  }

  public getEffectiveSelectedColor(): CoreColor | null {
    return this.selectedResource.getEffectiveColor();
  }

  public clearResourceSelection(): void {
    this.selectedResource = Resource.none;
  }

  getSelectedCoordinates(): HexCoordinates | null {
    return this.selectedCoordinates;
  }

  setSelectedCoordinates(coordinates: HexCoordinates): void {
    this.selectedCoordinates = coordinates;
  }

  private selectedResource: Resource;
  private selectedCoordinates: HexCoordinates | null;
}
