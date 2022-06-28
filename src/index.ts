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
import {getSelector, optimizeSelector} from "./optimizeSelector";

/**
 * Returns all the selectors of the elmenet
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors(el, selectors, attributes) {
  const funcs = {
    Tag: getTag,
    NthChild: getNthChild,
    Attributes: (elem) => getAttributes(elem, attributes),
    Class: getClassSelectors,
    ID: getID,
  };

  return selectors.reduce((res, next) => {
    res[next] = funcs[next](el);
    return res;
  }, {});
}

/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 * @param  { Object } element
 * @param  { Array } selectors
 * @return { String }
 */
function getFirstUnique(parentSelectors: string[], element, selectors) {
  const notEmpty = selectors.filter((selector) => selector);
  const soloUnique = notEmpty.find((selector) =>
    isUnique(element, getSelector([selector]))
  );
  if (soloUnique) {
    return soloUnique;
  }
  const combineUnique = notEmpty.find((selector) =>
    isUnique(element, getSelector([...parentSelectors, selector]))
  );
  return combineUnique;
}

/**
 * Checks all the possible selectors of an element to find one unique and return it
 * @param  { Object } element
 * @param  { Array } items
 * @param  { String } tag
 * @return { String }
 */
function getUniqueCombination(
  parentSelectors: string[],
  element: Element,
  id = "",
  // class arr / attr arr
  selectors: string[] = [],
  tag = "",
  nth = ""
) {
  // 0. id
  // 1. class combine
  const selectorItems = getCombinations(selectors, 3);
  // 2. tag
  const tags = tag ? [tag] : [];
  // 3. tag + class
  const tagSelectors = tag
    ? selectorItems.map((selector) => tag + selector)
    : [];
  // 4. class + nth
  const nthSelectors = nth
    ? selectorItems.map((selector) => selector + nth)
    : [];
  // 5. tag + nth
  const tagNths = tag && nth ? [tag + nth] : [];
  // 6. tag + class + nth
  const tagNthSelectors =
    tag && nth ? selectorItems.map((selector) => tag + selector + nth) : [];

  const allSelectorItems = [
    id,
    ...selectorItems,
    ...tags,
    ...tagSelectors,
    ...nthSelectors,
    ...tagNths,
    ...tagNthSelectors,
  ];

  const firstUnique = getFirstUnique(
    parentSelectors,
    element,
    allSelectorItems
  );

  return firstUnique || null;
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector(
  parentSelectors: string[],
  element: Element,
  selectorTypes,
  attributes,
  excludeRegex
) {
  let foundSelector;

  const elementSelectors = getAllSelectors(element, selectorTypes, attributes);

  if (excludeRegex && excludeRegex instanceof RegExp) {
    elementSelectors.ID = excludeRegex.test(elementSelectors.ID)
      ? null
      : elementSelectors.ID;
    elementSelectors.Class = elementSelectors.Class?.filter(
      (className) => !excludeRegex.test(className)
    );
  }

  const {
    ID = "",
    Class: Classes = [],
    Tag = "",
    Attributes = [],
    NthChild = "",
  } = elementSelectors;

  foundSelector = getUniqueCombination(
    parentSelectors,
    element,
    ID,
    [...Classes, ...Attributes],
    Tag,
    NthChild
  );
  return foundSelector || null;
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
  Attributes = "Attributes",
  Tag = "Tag",
  NthChild = "NthChild",
}
const AllSelectorTypes = Object.values(SelectorTypeEnum);

export default function unique(
  el,
  options: {
    selectorTypes: SelectorTypeEnum[];
    attributes: string[];
    excludeRegex: RegExp;
  }
) {
  const {
    selectorTypes = AllSelectorTypes,
    attributes = [],
    excludeRegex = null,
  } = options;

  const parents = getParents(el);

  for (let typeIndex = 0; typeIndex < selectorTypes.length; typeIndex++) {
    // 对每一个优先级，计算一次
    // 优先级 >= 当前的 type
    const types = selectorTypes.slice(0, typeIndex + 1);
    const allSelectors: string[] = [];

    // 循环顺序：父 -> 子
    for (let i = parents.length - 1; i >= 0; i--) {
      const el = parents[i];
      const selector = getUniqueSelector(
        allSelectors,
        el,
        types,
        attributes,
        excludeRegex
      );
      // 取不到目标元素上 parent 下唯一的选择器，直接返回
      if (i === parents.length - 1 && !selector) {
        break;
      }
      allSelectors.push(selector);
    }

    const validSelector = optimizeSelector(el, allSelectors);
    if (validSelector) return validSelector;
  }

  return null;
}
