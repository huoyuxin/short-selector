import {isUnique} from "./isUnique";

export const getSelector = (selectors: (string | null)[]) =>
  selectors
    // 拼接
    .join(" > ")
    // 去掉头部 >
    .replace(/^( > )+/, "")
    // 去掉相连达到两个以上的 >
    .replace(/( > ){2,}/g, " ");

export const optimizeSelector = (
  el: Element,
  allSelectors: (string | null)[]
) => {
  if (!isUnique(el, getSelector(allSelectors))) {
    return null;
  }

  console.log("[before] allSelectors", allSelectors);
  const necessary = [...allSelectors];
  allSelectors.forEach((selector, index) => {
    if (!selector) {
      return;
    }
    const selectors = [...necessary];
    // 去掉当前 selector
    selectors.splice(index, 1);
    const selectorStr = getSelector(selectors);
    console.log(
      `test remove ${index} --- ${necessary[index]} --- ${selectorStr}`
    );
    console.log("still unique", isUnique(el, selectorStr));
    // 依然唯一定位该元素
    if (isUnique(el, selectorStr)) {
      necessary[index] = null;
    }
  });
  console.log("[after] necessary", necessary);
  return getSelector(necessary);
};
