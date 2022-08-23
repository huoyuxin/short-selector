import {isElement} from "./isElement";

/**
 * Returns the selectors based on the position of the element relative to its siblings
 * @param  { Object } element
 * @return { Array }
 */
export function getNthChild(element: Element) {
  const {parentNode} = element;

  if (parentNode) {
    const {children} = parentNode;
    const index = Array.prototype.findIndex.call(
      children,
      (node) => node === element
    );
    if (index > -1) {
      return index === 0
        ? `:first-child`
        : index === children.length - 1
        ? `:last-child`
        : `:nth-child(${index + 1})`;
    }
  }
  return null;
}
