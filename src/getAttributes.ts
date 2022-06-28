/**
 * Returns the Attribute selectors of the element
 * @param  { DOM Element } element
 * @param  { Array } array of attributes to ignore
 * @return { Array }
 */
export function getAttributes(el: Element, attributesToRecord: string[] = []) {
  const {attributes} = el;

  return Array.from(attributes).reduce((sum: string[], next: Attr) => {
    if (attributesToRecord.includes(next.nodeName)) {
      sum.push(`[${next.nodeName}="${next.value}"]`);
    }
    return sum;
  }, []);
}
