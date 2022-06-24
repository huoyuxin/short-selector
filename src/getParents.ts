import {isElement} from "./isElement";

/**
 * Returns all the element and all of its parents
 * @param { DOM Element }
 * @return { Array of DOM elements }: [el, el.parent, ...]
 */
export function getParents(el: Element) {
  const parents = [];
  let currentElement: Element = el;
  while (isElement(currentElement)) {
    parents.push(currentElement);
    currentElement = currentElement.parentNode as Element;
  }

  return parents;
}
