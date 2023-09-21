/**
 * Expose `unique`
 */

import { flatten, flattenDeep } from "lodash";
import { getID } from "./getID";
import { getClassSelectors } from "./getClasses";
import { combineObjList, getCombinations } from "./getCombinations";
import { getAttributes } from "./getAttributes";
import { getNthChild } from "./getNthChild";
import { getTag } from "./getTag";
import { isUnique } from "./isUnique";
import { getParents } from "./getParents";
import { getSelector, optimizeSelector } from "./optimizeSelector";

/**
 * Returns all the selectors of the elmenet
 * @param  { Object } element
 * @return { Object }
 */
function getAllValidSelectors(el, selectorTypes, attributes) {
  const funcs = {
    Tag: getTag,
    NthChild: getNthChild,
    Attributes: (elem) => getAttributes(elem, attributes),
    Class: getClassSelectors,
    ID: getID,
  };

  const elementSelectors = selectorTypes.reduce((res, next) => {
    res[next] = funcs[next](el);
    return res;
  }, {});

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
  const soloUnique = notEmpty.find((selector) => isUnique(element, getSelector([selector])));
  if (soloUnique) {
    return soloUnique;
  }
  const combineUnique = notEmpty.find((selector) => isUnique(element, getSelector([...parentSelectors, selector])));
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
  selectorTypes: SelectorTypeEnum[],
  excludeRegex,
  id = "",
  classSelectorArr: string[] = [],
  attrSelectorArr: string[] = [],
  tag = "",
  nth = ""
): string[] {
  const priorityMap = {};
  Object.values(SelectorTypeEnum).forEach((value) => {
    priorityMap[value] = selectorTypes.indexOf(value) + 1;
  });
  // 1. tag 放最前
  const tagObj = {
    selectors: tag ? [tag] : [],
    type: SelectorTypeEnum.Tag,
  };
  // 2. id
  const idObj = {
    selectors: id ? [id] : [],
    type: SelectorTypeEnum.ID,
  };
  // 3. class
  const classSelectors = getCombinations(classSelectorArr, 1, 3, (arr) => arr.join(""));
  const classObj = {
    selectors: classSelectors,
    type: SelectorTypeEnum.Class,
  };
  // 4. attribute
  const attrSelectors = getCombinations(attrSelectorArr, 1, 3, (arr) => arr.join(""));
  const attrObj = {
    selectors: attrSelectors,
    type: SelectorTypeEnum.Attributes,
  };
  // 5. nth-child 放最后
  const nthSelectors = nth ? [nth] : [];
  const nthObj = {
    selectors: nthSelectors,
    type: SelectorTypeEnum.NthChild,
  };
  // todo: 测试传参不全的情况
  const selectorObjList = [tagObj, idObj, classObj, attrObj, nthObj];

  const filteredObjArr = selectorObjList
    .map((obj) => ({
      type: obj.type,
      selectors: obj.selectors.filter((selector) => {
        if (!selector) return false;
        if (excludeRegex && excludeRegex instanceof RegExp) return !selector.match(excludeRegex);
        return true;
      }),
    }))
    .filter((obj) => obj.selectors.length);

  const selectorCombinedArr = new Array(filteredObjArr.length).fill(1).map((c, i) =>
    getCombinations(filteredObjArr, i + 1, i + 1, (selectorObjList) => {
      const selectors = combineObjList(selectorObjList);
      const priority = selectorObjList.reduce((p, c) => p + priorityMap[c.type], 0) / selectorObjList.length;
      const types = selectorObjList.map((obj) => obj.type);
      return {
        selectors,
        types,
        priority,
      };
    })
  );
  const selectorCombined = flatten(selectorCombinedArr);
  // 根据优先级排序
  const sortedObj = selectorCombined.sort((a, b) => a.priority - b.priority);
  console.log("[short selector]", "sortedObj", sortedObj);
  const sortedSelectors = flattenDeep(sortedObj.map((obj) => obj.selectors));
  return sortedSelectors;
}

function getValidCombination(element: Element, selectorTypes, attributes, excludeRegex) {
  const elementSelectors = getAllValidSelectors(element, selectorTypes, attributes);
  const { ID = "", Class = [], Tag = "", Attributes = [], NthChild = "" } = elementSelectors;
  const allSelectorItems = getSelectorItems(selectorTypes, excludeRegex, ID, Class, Attributes, Tag, NthChild);
  return allSelectorItems;
}

/**
 * Returns a uniqueSelector based on the passed options
 * @param  { DOM } element
 * @param  { Array } options
 * @return { String }
 */
function getUniqueSelector(parentSelectors: string[], element: Element, selectorTypes, attributes, excludeRegex) {
  const allSelectorItems = getValidCombination(element, selectorTypes, attributes, excludeRegex);
  const firstUnique = getFirstUnique(parentSelectors, element, allSelectorItems);

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
  // 按优先级顺序传
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
  const { selectorTypes = AllSelectorTypes, attributes = [], excludeRegex = null } = options;

  const parents = getParents(el);

  const types = selectorTypes;
  const allSelectors: string[] = [];

  // 循环顺序：父 -> 子
  for (let i = parents.length - 1; i >= 0; i--) {
    const el = parents[i];
    console.log("[short selector]", "el", el);
    const selector = getUniqueSelector(allSelectors, el, types, attributes, excludeRegex);
    // 取不到目标元素上 parent 下唯一的选择器，直接返回
    if (i === parents.length - 1 && !selector) {
      break;
    }
    allSelectors.push(selector);
  }

  if (isUnique(el, getSelector(allSelectors))) {
    return allSelectors;
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
  const selectorsArr = elArr.map((el) => unique(el, options));

  const commonSelectors = getCommonItem(selectorsArr);

  // 若最后一个是空，计算目标元素公共选择器
  if (!commonSelectors[commonSelectors.length - 1]) {
    const { selectorTypes = AllSelectorTypes, attributes = [], excludeRegex = null } = options;
    const combinationsArr = elArr.map((el) => getValidCombination(el, selectorTypes, attributes, excludeRegex));
    const commonCombinations = getCommonItem(combinationsArr).filter((item) => item);
    commonSelectors[commonSelectors.length - 1] = commonCombinations[0];
  }

  const validSelectors = commonSelectors.filter((selector) => selector);
  // common 选择器匹配的元素
  const relatedEls = validSelectors.length ? Array.from(document.querySelectorAll(getSelector(commonSelectors))) : [];

  // 包含所有 els
  if (elArr.every((el) => relatedEls.includes(el))) {
    // 优化选择器
    const validSelector = optimizeSelector(relatedEls, commonSelectors);
    if (validSelector) return validSelector;
  }

  return null;
}

export default function uniqueShort(el: Element, options: Option = DefaultOption) {
  const allSelectors = unique(el, options);

  const validSelector = optimizeSelector([el], allSelectors);
  if (validSelector) return validSelector;

  return null;
}
