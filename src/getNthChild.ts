import {isElement} from "./isElement";

/**
 * Returns the selectors based on the position of the element relative to its siblings
 * @param  { Object } element
 * @return { Array }
 */
export function getNthChild(element: Element) {
  const {parentNode} = element;

  if (parentNode) {
    const {childNodes} = parentNode;
    const index = Array.prototype.findIndex.call(
      childNodes,
      (node) => node === element
    );
    if (index > -1) {
      return index === 0
        ? `:first-child`
        : index === childNodes.length - 1
        ? `:last-child`
        : `:nth-child(${index + 1})`;
    }
  }
  return null;
}
