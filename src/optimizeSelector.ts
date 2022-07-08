import {isSame} from "./isUnique";

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
  els: Element[],
  necessary: (string | null)[],
  index: number
) => {
  const selectors = [...necessary];
  // 去掉当前 selector
  selectors[index] = null;
  const selectorStr = getSelector(selectors);
  // 依然唯一定位该元素
  if (isSame(els, selectorStr)) {
    necessary[index] = null;
  }
};

export const optimizeSelector = (
  els: Element[],
  allSelectors: (string | null)[]
) => {
  const necessary = [...allSelectors];

  // 1. 去掉 优先级低的 tag\nth
  necessary.forEach((selector, index) => {
    if (!selector || selector.match(/[#.=]/)) {
      return;
    }
    checkSelector(els, necessary, index);
  });

  // 2. 去掉 优先级高的 class\id
  necessary.forEach((selector, index) => {
    if (!selector) {
      return;
    }
    checkSelector(els, necessary, index);
  });

  return getSelector(necessary);
};
