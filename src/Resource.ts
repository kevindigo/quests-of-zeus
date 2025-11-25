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
    return new Resource(resource.type, resource.color);
  }

  private constructor(type: ResourceType, color?: CoreColor) {
    this.type = type;
    this.color = color;
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

  public getColor(): CoreColor {
    if (!this.hasColor() || !this.color) {
      throw new Error('Attempted to get non-existant color');
    }

    return this.color;
  }

  public equals(other: Resource): boolean {
    return (other.type === this.type && other.color === this.color);
  }

  private readonly type: ResourceType;
  private readonly color: CoreColor | undefined;
}
