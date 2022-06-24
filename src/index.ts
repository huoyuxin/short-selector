/**
 * Expose `unique`
 */

import {getID} from "./getID";
import {getClassSelectors} from "./getClasses";
import {getCombinations} from "./getCombinations";
import {getAttributes} from "./getAttributes";
import {getNthChild} from "./getNthChild";
import {getTag} from "./getTag";
import {isUnique} from "./isUnique";
import {getParents} from "./getParents";
import {optimizeSelector} from "./optimizeSelector";

/**
 * Returns all the selectors of the elmenet
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors(el, selectors, attributesToIgnore) {
  const funcs = {
    Tag: getTag,
    NthChild: getNthChild,
    Attributes: (elem) => getAttributes(elem, attributesToIgnore),
    Class: getClassSelectors,
    ID: getID,
  };

  return selectors.reduce((res, next) => {
    res[next] = funcs[next](el);
    return res;
  }, {});
}

/**
 * Tests uniqueNess of the element inside its parent
 * @param  { Object } element
 * @param { String } Selectors
 * @return { Boolean }
 */
function parentUnique(element, selector) {
  const {parentNode} = element;
  const elements = parentNode.querySelectorAll(selector);
  return elements.length === 1 && elements[0] === element;
}

/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 * @param  { Object } element
 * @param  { Array } selectors
 * @return { String }
 */
function getFirstUnique(element, selectors) {
  const globalUnique = selectors.find((selector) =>
    isUnique(element, selector)
  );
  return globalUnique || selectors.find(parentUnique.bind(null, element));
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 * @param  { Object } element
 * @param  { Array } items
 * @param  { String } tag
 * @return { String }
 */
function getUniqueCombination(element, items, tag) {
  let combinations = getCombinations(items, 3),
    firstUnique = getFirstUnique(element, combinations);

  if (Boolean(firstUnique)) {
    return firstUnique;
  }

  if (Boolean(tag)) {
    combinations = combinations.map((combination) => tag + combination);
    firstUnique = getFirstUnique(element, combinations);

    if (Boolean(firstUnique)) {
      return firstUnique;
    }
  }

  return null;
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector(
  element: Element,
  selectorTypes,
  attributesToIgnore,
  excludeRegex
) {
  let foundSelector;

  const elementSelectors = getAllSelectors(
    element,
    selectorTypes,
    attributesToIgnore
  );

  if (excludeRegex && excludeRegex instanceof RegExp) {
    elementSelectors.ID = excludeRegex.test(elementSelectors.ID)
      ? null
      : elementSelectors.ID;
    elementSelectors.Class = elementSelectors.Class?.filter(
      (className) => !excludeRegex.test(className)
    );
  }

  for (let selectorType of selectorTypes) {
    const {ID, Tag, Class: Classes, Attributes, NthChild} = elementSelectors;
    switch (selectorType) {
      case "ID":
        if (Boolean(ID) && parentUnique(element, ID)) {
          return ID;
        }
        break;

      case "Tag":
        if (Boolean(Tag) && parentUnique(element, Tag)) {
          return Tag;
        }
        break;

      case "Class":
        if (Boolean(Classes) && Classes.length) {
          foundSelector = getUniqueCombination(element, Classes, Tag);
          if (foundSelector) {
            return foundSelector;
          }
        }
        break;

      case "Attributes":
        if (Boolean(Attributes) && Attributes.length) {
          foundSelector = getUniqueCombination(element, Attributes, Tag);
          if (foundSelector) {
            return foundSelector;
          }
        }
        break;

      case "NthChild":
        if (Boolean(NthChild)) {
          return NthChild;
        }
    }
  }
  return null;
}

/**
 * Generate unique CSS selector for given DOM element
 *
 * @param {Element} el
 * @return {String}
 * @api private
 */

enum SelectorTypeEnum {
  ID = "ID",
  Class = "Class",
  Tag = "Tag",
  NthChild = "NthChild",
}
const AllSelectorTypes = Object.values(SelectorTypeEnum);

export default function unique(
  el,
  options: {
    selectorTypes: SelectorTypeEnum[];
    attributesToIgnore: string[];
    excludeRegex: RegExp;
  }
) {
  const {
    selectorTypes = AllSelectorTypes,
    attributesToIgnore = ["id", "class", "length"],
    excludeRegex = null,
  } = options;

  const parents = getParents(el);

  for (let typeIndex = 0; typeIndex < selectorTypes.length; typeIndex++) {
    // 优先级 >= 当前的 type
    const types = selectorTypes.slice(0, typeIndex + 1);
    const allSelectors: string[] = [];
    console.log("types", types);

    // 对每一个优先级，计算一次
    for (let i = 0; i < parents.length; i++) {
      const el = parents[i];
      const selector = getUniqueSelector(
        el,
        types,
        attributesToIgnore,
        excludeRegex
      );
      // 取不到目标元素上 parent 下唯一的选择器，直接返回
      if (i === 0 && !selector) {
        break;
      }
      allSelectors.unshift(selector);
    }

    console.log("allSelectors", allSelectors);
    const validSelector = optimizeSelector(el, allSelectors);
    if (validSelector) return validSelector;
  }

  return null;
}
