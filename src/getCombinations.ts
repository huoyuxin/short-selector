/**
 * Recursively combinate items.
 * @param  { Array } result
 * @param  { Array } items
 * @param  { Array } loopItems
 * @param  { Number } startIndex
 * @param  { Number } endIndex
 * @param  { Number } loopIndex
 * @param  { Number } endLoopIndex
 * @param  { Function } callback
 */
function kCombinations(result, items, loopItems, startIndex, endIndex, loopIndex, endLoopIndex, min, callback) {
  if (loopIndex === endLoopIndex) {
    const items = loopItems.slice(0, loopIndex);
    items.length >= min && result.push(callback(items));
    return;
  }

  for (let i = startIndex; i <= endIndex && endIndex - i + 1 >= endLoopIndex - loopIndex; ++i) {
    // if (i === loopIndex) return;
    loopItems[loopIndex] = items[i];
    kCombinations(result, items, loopItems, i + 1, endIndex, loopIndex + 1, endLoopIndex, min, callback);
  }
}

/**
 * Returns all the possible selector combinations
 * 0-k, items 所有的组合形式，调用 callback
 * @param  { Array } items
 * @param  { Number } max: max length
 * @param  { Function } callback
 * @return { Array }
 */
export function getCombinations(items, min = 1, max, callback) {
  const result = [],
    endIndex = items.length,
    loopItems = [];

  for (var loopIndex = 0; loopIndex <= max; ++loopIndex) {
    kCombinations(result, items, loopItems, 0, endIndex - 1, 0, loopIndex, min, callback);
  }

  return result;
}

export const combineObjList = (objList) =>
  objList.reduce((prevList, obj) => {
    const selectors = obj.selectors;
    if (!prevList.length) return selectors;
    // 只要最后一层的返回结果
    const curList = selectors.reduce((prevSelectors, s) => {
      const curSelectors = prevList.map((p) => {
        return `${p}${s}`;
      }, "");
      return [...prevSelectors, ...curSelectors];
    }, []);
    return curList;
  }, []);
