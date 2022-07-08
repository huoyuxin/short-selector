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
function getAllValidSelectors(el, selectors, attributes, excludeRegex) {
  const funcs = {
    Tag: getTag,
    NthChild: getNthChild,
    Attributes: (elem) => getAttributes(elem, attributes),
    Class: getClassSelectors,
    ID: getID,
  };

  const elementSelectors = selectors.reduce((res, next) => {
    res[next] = funcs[next](el);
    return res;
  }, {});

  if (excludeRegex && excludeRegex instanceof RegExp) {
    elementSelectors.ID = excludeRegex.test(elementSelectors.ID)
      ? null
      : elementSelectors.ID;
    elementSelectors.Class = elementSelectors.Class?.filter(
      (className) => !excludeRegex.test(className)
    );
  }

  return elementSelectors;
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
function getSelectorItems(
  id = "",
  // class arr / attr arr
  selectors: string[] = [],
  tag = "",
  nth = ""
): string[] {
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

  return [
    id,
    ...selectorItems,
    ...tags,
    ...tagSelectors,
    ...nthSelectors,
    ...tagNths,
    ...tagNthSelectors,
  ];
}

function getValidCombination(
  element: Element,
  selectorTypes,
  attributes,
  excludeRegex
) {
  const elementSelectors = getAllValidSelectors(
    element,
    selectorTypes,
    attributes,
    excludeRegex
  );

  const {
    ID = "",
    Class = [],
    Tag = "",
    Attributes = [],
    NthChild = "",
  } = elementSelectors;

  const allSelectorItems = getSelectorItems(
    ID,
    [...Class, ...Attributes],
    Tag,
    NthChild
  );
  return allSelectorItems;
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
  const allSelectorItems = getValidCombination(
    element,
    selectorTypes,
    attributes,
    excludeRegex
  );
  const firstUnique = getFirstUnique(
    parentSelectors,
    element,
    allSelectorItems
  );

  return firstUnique || null;
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
interface Option {
  selectorTypes: SelectorTypeEnum[];
  attributes: string[];
  excludeRegex?: RegExp;
}

const AllSelectorTypes = Object.values(SelectorTypeEnum);
const DefaultOption = {
  selectorTypes: AllSelectorTypes,
  attributes: [],
};

function unique(el, options: Option) {
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

    if (isUnique(el, getSelector(allSelectors))) {
      return allSelectors;
    }
  }

  return [];
}

// 计算二维数组中公共元素
function getCommonItem(arr: string[][] = []) {
  const commonArr = (arr[0] || []).map((item, index) => {
    return arr.every((arr) => arr[index] === item) ? item : null;
  });

  return commonArr;
}

export function commonShort(elArr: Element[], options: Option = DefaultOption) {
  // console.log("elArr", elArr);
  const selectorsArr = elArr.map((el) => unique(el, options));
  // console.log("selectorsArr", selectorsArr);

  const commonSelectors = getCommonItem(selectorsArr);
  // console.log("commonSelectors", commonSelectors);

  // 若最后一个是空，计算目标元素公共选择器
  if (!commonSelectors[commonSelectors.length - 1]) {
    const {
      selectorTypes = AllSelectorTypes,
      attributes = [],
      excludeRegex = null,
    } = options;
    const combinationsArr = elArr.map((el) =>
      getValidCombination(el, selectorTypes, attributes, excludeRegex)
    );
    const commonCombinations = getCommonItem(combinationsArr).filter(
      (item) => item
    );
    // console.log("commonCombinations", commonCombinations);
    commonSelectors[commonSelectors.length - 1] = commonCombinations[0];
  }

  // common 选择器匹配的元素
  const relatedEls = commonSelectors
    ? Array.from(document.querySelectorAll(getSelector(commonSelectors)))
    : [];
  // console.log("relatedEls", relatedEls);

  // 包含所有 els
  if (elArr.every((el) => relatedEls.includes(el))) {
    // 优化选择器
    const validSelector = optimizeSelector(relatedEls, commonSelectors);
    if (validSelector) return validSelector;
  }

  return null;
}

export default function uniqueShort(
  el: Element,
  options: Option = DefaultOption
) {
  // todo: options
  // todo: options
  // todo: options
  // todo: options
  // todo: options
  const allSelectors = unique(el, options);

  const validSelector = optimizeSelector([el], allSelectors);
  if (validSelector) return validSelector;

  return null;
}
