import { OracleSystem } from './OracleSystem.ts';
import type { CoreColor } from './types.ts';

export type ResourceType = 'die' | 'card' | 'none';

export class Resource {
  public static readonly none = new Resource('none');

  public static createDie(color: CoreColor): Resource {
    return new Resource('die', color);
  }

  public static createRecoloredDie(
    color: CoreColor,
    recoloring: number,
  ): Resource {
    return new Resource('die', color, recoloring);
  }

  public static createCard(color: CoreColor): Resource {
    return new Resource('card', color);
  }

  public static createRecoloredCard(
    color: CoreColor,
    recoloring: number,
  ): Resource {
    return new Resource('card', color, recoloring);
  }

  public static createRecoloredVersionOf(
    original: Resource,
    recolor: number,
  ): Resource {
    return new Resource(
      original.type,
      original.getBaseColor(),
      recolor,
    );
  }

  public withoutRecoloring(): Resource {
    return new Resource(this.type, this.baseColor, 0);
  }

  public toSnapshot() {
    throw new Error('Resource snapshot not implemented yet!');
  }

  public static fromSnapshot(_resource: Resource): Resource {
    throw new Error('Resource snapshot not implemented yet!');
  }

  private constructor(
    type: ResourceType,
    color?: CoreColor,
    recoloring?: number,
  ) {
    this.type = type;
    this.baseColor = color;
    this.recolorCost = recoloring || 0;
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

  public getEffectiveColor(): CoreColor | null {
    if (!this.hasColor()) {
      return null;
    }
    const selectedColor = this.getBaseColor();

    const favorForRecoloring = this.getRecolorCost();
    const effectiveColor = OracleSystem.applyRecolor(
      selectedColor,
      favorForRecoloring,
    );
    return effectiveColor;
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
