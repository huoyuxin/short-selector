/**
 * Checks if the selector is unique
 * @param  { Object } element
 * @param  { String } selector
 * @return { Array }
 */
export function isUnique(el, selector) {
  if (!Boolean(selector)) return false;
  const elems = el.ownerDocument.querySelectorAll(selector);
  return elems.length === 1 && elems[0] === el;
}

/**
 * Checks if the selector is same
 * @param  { Object } element
 * @param  { String } selector
 * @return { Array }
 */
export function isSame(els: Element[], selector: string) {
  if (!Boolean(selector)) return false;
  const elsQueried = els[0].ownerDocument.querySelectorAll(selector);
  const elArrQueried = Array.from(elsQueried);
  return (
    elArrQueried.length === els.length &&
    elArrQueried.every((el) => els.includes(el))
  );
}
