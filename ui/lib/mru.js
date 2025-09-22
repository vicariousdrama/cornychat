export async function mru(o, v, n) {
  let obj = localStorage.getItem(o);
  if (obj) {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      obj = null;
    }
  }
  if (!obj) obj = [];
  let obj2 = [v];
  for (let s of obj) {
    if (typeof s == 'string' && typeof v == 'string') {
      if (s != v) obj2.push(s);
    }
    if (typeof s == 'string' && typeof v == 'object') {
      if (s != v[0]) obj2.push(s);
    }
    if (typeof s == 'object' && typeof v == 'string') {
      if (s[0] != v) obj2.push(s);
    }
    if (typeof s == 'object' && typeof v == 'object') {
      if (s[0] != v[0]) obj2.push(s);
    }
  }
  if (n && n > 0) {
    obj2 = obj2.slice(0, n);
  }
  localStorage.setItem(o, JSON.stringify(obj2));
}
