export class MinHeap<T> {
  private a: T[] = [];
  constructor(private less: (x: T, y: T) => boolean) {}

  push(x: T): void {
    this.a.push(x);
    this.bubbleUp(this.a.length - 1);
  }

  pop(): T | undefined {
    if (this.a.length === 0) {
      return undefined;
    }
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length > 0) {
      this.a[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  get size(): number {
    return this.a.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(this.a[i], this.a[p])) {
        break;
      }
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }

  private bubbleDown(i: number): void {
    while (true) {
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      let m = i;
      if (l < this.a.length && this.less(this.a[l], this.a[m])) {
        m = l;
      }
      if (r < this.a.length && this.less(this.a[r], this.a[m])) {
        m = r;
      }
      if (m === i) {
        break;
      }
      [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
      i = m;
    }
  }
}
