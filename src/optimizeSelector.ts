import {isUnique} from "./isUnique";

export const getSelector = (selectors: (string | null)[]) =>
  selectors
    // 拼接
    .join(" > ")
    // 去掉头部尾部 >
    .replace(/^( > )+/, "")
    .replace(/( > )+$/, "")
    // 去掉相连达到两个以上的 >
    .replace(/( > ){2,}/g, " ");

const checkSelector = (
  el: Element,
  necessary: (string | null)[],
  index: number
) => {
  const selectors = [...necessary];
  // 去掉当前 selector
  selectors[index] = null;
  const selectorStr = getSelector(selectors);
  console.log(
    `test remove ${index} --- ${necessary[index]} --- ${selectorStr}`
  );
  console.log("still unique", isUnique(el, selectorStr));
  // 依然唯一定位该元素
  if (isUnique(el, selectorStr)) {
    necessary[index] = null;
  }
};

export const optimizeSelector = (
  el: Element,
  allSelectors: (string | null)[]
) => {
  if (!isUnique(el, getSelector(allSelectors))) {
    return null;
  }

  console.log("[before] allSelectors", allSelectors);
  const necessary = [...allSelectors];

  // 1. 去掉 优先级低的 tag\nth
  necessary.forEach((selector, index) => {
    if (!selector || selector.match(/[#.=]/)) {
      return;
    }
    checkSelector(el, necessary, index);
  });

  console.log("[after1] necessary", necessary);
  // 2. 去掉 优先级高的 class\id
  necessary.forEach((selector, index) => {
    if (!selector) {
      return;
    }
    checkSelector(el, necessary, index);
  });

  console.log("[after2] necessary", necessary);
  return getSelector(necessary);
};
