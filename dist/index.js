"use strict";
/**
 * Expose `unique`
 */
exports.__esModule = true;
var getID_1 = require("./getID");
var getClasses_1 = require("./getClasses");
var getCombinations_1 = require("./getCombinations");
var getAttributes_1 = require("./getAttributes");
var getNthChild_1 = require("./getNthChild");
var getTag_1 = require("./getTag");
var isUnique_1 = require("./isUnique");
var getParents_1 = require("./getParents");
var optimizeSelector_1 = require("./optimizeSelector");
/**
 * Returns all the selectors of the elmenet
 * @param  { Object } element
 * @return { Object }
 */
function getAllSelectors(el, selectors, attributesToIgnore) {
    var funcs = {
        Tag: getTag_1.getTag,
        NthChild: getNthChild_1.getNthChild,
        Attributes: function (elem) { return (0, getAttributes_1.getAttributes)(elem, attributesToIgnore); },
        Class: getClasses_1.getClassSelectors,
        ID: getID_1.getID
    };
    return selectors.reduce(function (res, next) {
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
    var parentNode = element.parentNode;
    var elements = parentNode.querySelectorAll(selector);
    return elements.length === 1 && elements[0] === element;
}
/**
 * Tests all selectors for uniqueness and returns the first unique selector.
 * @param  { Object } element
 * @param  { Array } selectors
 * @return { String }
 */
function getFirstUnique(element, selectors) {
    var globalUnique = selectors.find(function (selector) {
        return (0, isUnique_1.isUnique)(element, selector);
    });
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
    var combinations = (0, getCombinations_1.getCombinations)(items, 3), firstUnique = getFirstUnique(element, combinations);
    if (Boolean(firstUnique)) {
        return firstUnique;
    }
    if (Boolean(tag)) {
        combinations = combinations.map(function (combination) { return tag + combination; });
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
function getUniqueSelector(element, selectorTypes, attributesToIgnore, excludeRegex) {
    var _a;
    var foundSelector;
    var elementSelectors = getAllSelectors(element, selectorTypes, attributesToIgnore);
    if (excludeRegex && excludeRegex instanceof RegExp) {
        elementSelectors.ID = excludeRegex.test(elementSelectors.ID)
            ? null
            : elementSelectors.ID;
        elementSelectors.Class = (_a = elementSelectors.Class) === null || _a === void 0 ? void 0 : _a.filter(function (className) { return !excludeRegex.test(className); });
    }
    for (var _i = 0, selectorTypes_1 = selectorTypes; _i < selectorTypes_1.length; _i++) {
        var selectorType = selectorTypes_1[_i];
        var ID = elementSelectors.ID, Tag = elementSelectors.Tag, Classes = elementSelectors.Class, Attributes = elementSelectors.Attributes, NthChild = elementSelectors.NthChild;
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
var SelectorTypeEnum;
(function (SelectorTypeEnum) {
    SelectorTypeEnum["ID"] = "ID";
    SelectorTypeEnum["Class"] = "Class";
    SelectorTypeEnum["Tag"] = "Tag";
    SelectorTypeEnum["NthChild"] = "NthChild";
})(SelectorTypeEnum || (SelectorTypeEnum = {}));
var AllSelectorTypes = Object.values(SelectorTypeEnum);
function unique(el, options) {
    var _a = options.selectorTypes, selectorTypes = _a === void 0 ? AllSelectorTypes : _a, _b = options.attributesToIgnore, attributesToIgnore = _b === void 0 ? ["id", "class", "length"] : _b, _c = options.excludeRegex, excludeRegex = _c === void 0 ? null : _c;
    var parents = (0, getParents_1.getParents)(el);
    for (var typeIndex = 0; typeIndex < selectorTypes.length; typeIndex++) {
        // 优先级 >= 当前的 type
        var types = selectorTypes.slice(0, typeIndex + 1);
        var allSelectors = [];
        console.log("types", types);
        // 对每一个优先级，计算一次
        for (var i = 0; i < parents.length; i++) {
            var el_1 = parents[i];
            var selector = getUniqueSelector(el_1, types, attributesToIgnore, excludeRegex);
            // 取不到目标元素上 parent 下唯一的选择器，直接返回
            if (i === 0 && !selector) {
                break;
            }
            allSelectors.unshift(selector);
        }
        console.log("allSelectors", allSelectors);
        var validSelector = (0, optimizeSelector_1.optimizeSelector)(el, allSelectors);
        if (validSelector)
            return validSelector;
    }
    return null;
}
exports["default"] = unique;
