const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNITS = ['', '拾', '佰', '仟'];
const BIGUNITS = ['', '万', '亿'];

export function rmbUpper(num: number): string {
  if (!isFinite(num) || num < 0) return '';
  if (num === 0) return '零元整';
  let n = Math.floor(num * 100 + 0.5);
  const jiao = Math.floor(n / 10) % 10;
  const fen = n % 10;
  n = Math.floor(n / 100);
  let int = '';
  let sectionIdx = 0;
  if (n === 0) int = '';
  else {
    while (n > 0) {
      const section = n % 10000;
      if (section > 0) {
        let s = '';
        let z = section;
        let u = 0;
        let zero = false;
        while (z > 0) {
          const d = z % 10;
          if (d === 0) {
            zero = true;
          } else {
            if (zero) s = DIGITS[0] + s;
            zero = false;
            s = DIGITS[d] + UNITS[u] + s;
          }
          z = Math.floor(z / 10);
          u += 1;
        }
        int = s + BIGUNITS[sectionIdx] + (n % 10000 > 0 && section < 1000 ? DIGITS[0] : '') + int;
      } else if (int) {
        int = DIGITS[0] + int;
      }
      n = Math.floor(n / 10000);
      sectionIdx += 1;
    }
    int += '元';
  }
  const dec = jiao === 0 && fen === 0 ? '整' : `${jiao > 0 ? DIGITS[jiao] + '角' : int ? '零' : ''}${fen > 0 ? DIGITS[fen] + '分' : ''}`;
  return `${int}${dec}`;
}
