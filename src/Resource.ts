import type { CoreColor } from './types.ts';

export type ResourceType = 'die' | 'card' | 'none';

export class Resource {
  public static readonly none = new Resource('none');

  public static createDie(color: CoreColor): Resource {
    return new Resource('die', color);
  }

  public static createCard(color: CoreColor): Resource {
    return new Resource('card', color);
  }

  public static toSnapshot() {
    throw new Error('Resource snapshot not implemented yet!');
  }

  public static fromSnapshot(resource: Resource): Resource {
    return new Resource(resource.type, resource.baseColor);
  }

  private constructor(type: ResourceType, color?: CoreColor) {
    this.type = type;
    this.baseColor = color;
    this.recolorCost = 0;
  }

  public isDie(): boolean {
    return this.type === 'die';
  }

  public isCard(): boolean {
    return this.type === 'card';
  }

  public hasColor(): boolean {
    return this.type !== 'none';
  }

  public getBaseColor(): CoreColor {
    if (!this.hasColor() || !this.baseColor) {
      throw new Error('Attempted to get non-existant color');
    }

    return this.baseColor;
  }

  public getRecolorCost(): number {
    return this.recolorCost;
  }

  public equals(other: Resource): boolean {
    return (other.type === this.type && other.baseColor === this.baseColor);
  }

  private readonly type: ResourceType;
  private readonly baseColor: CoreColor | undefined;
  private readonly recolorCost: number;
}
