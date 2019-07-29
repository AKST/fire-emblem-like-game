export function zip(l, r) {
  if (l.length > r.length) {
    return l.map((it, index) => [it, r[index]]);
  }
  else {
    return r.map((it, index) => [l[index], it]);
  }
}

