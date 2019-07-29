export function repeat<T>(n: number, fn: (i: number) => T): T[] {
  return Array.from({ length: n }, (_: unknown, index: number) => fn(index));
}

export function zip<A, B>(l: readonly A[], r: readonly B[]): [A | undefined, B | undefined][] {
  if (l.length > r.length) {
    return l.map((it, index) => [it, r[index]]);
  }
  else {
    return r.map((it, index) => [l[index], it]);
  }
}

