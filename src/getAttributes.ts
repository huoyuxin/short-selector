/**
 * Returns the Attribute selectors of the element
 * @param  { DOM Element } element
 * @param  { Array } array of attributes to ignore
 * @return { Array }
 */
export function getAttributes(el: Element, attributesRegExp: string[] = []) {
  const { attributes } = el;
  console.log("[short-selector] attributes", attributes);

  // 按先后顺序
  return attributesRegExp.reduce((sum: string[], regexp: string) => {
    var attrList = Array.from(attributes).filter(function (attr) {
      return attr.nodeName.match(new RegExp(regexp));
    });
    if (attrList?.length) {
      attrList.forEach((attr) => sum.push(`[${attr.nodeName}="${attr.value}"]`));
    }
    console.log("[short-selector] sum", sum);
    return sum;
  }, []);
}
