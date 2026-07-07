/** Round-robin rotator for API keys and model IDs. */
export class Rotator<T> {
  private index = 0;

  constructor(private readonly items: T[]) {}

  get count(): number {
    return this.items.length;
  }

  next(): T {
    if (this.items.length === 0) {
      throw new Error("Rotator has no items configured");
    }
    const item = this.items[this.index];
    this.index = (this.index + 1) % this.items.length;
    return item;
  }

  async withFallback<R>(fn: (item: T) => Promise<R>): Promise<R> {
    if (this.items.length === 0) {
      throw new Error("Rotator has no items configured");
    }

    const errors: string[] = [];
    const start = this.index;

    do {
      const item = this.next();
      try {
        return await fn(item);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    } while (this.index !== start);

    throw new Error(`All rotator items failed: ${errors.join(" | ")}`);
  }
}