/**
 * Returns the Attribute selectors of the element
 * @param  { DOM Element } element
 * @param  { Array } array of attributes to ignore
 * @return { Array }
 */
export function getAttributes(el: Element, attributesRegExp: string[] = []) {
  const { attributes } = el;

  // 按先后顺序
  return attributesRegExp.reduce((sum: string[], regexp: string) => {
    const attr = Array.from(attributes).find((attr) => attr.nodeName.match(new RegExp(regexp)));
    if (attr) {
      sum.push(`[${attr.nodeName}="${attr.value}"]`);
    }
    return sum;
  }, []);
}
