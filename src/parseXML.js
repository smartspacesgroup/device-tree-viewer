
import { XMLParser } from "fast-xml-parser";

export function parseXML(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name, jpath, isLeafNode, isAttribute) =>
      ['item', 'value', 'entry', 'tab'].includes(name)
  });

  const result = parser.parse(xmlText);

  // Normalize subitems.item to array
  const normalizeItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    return [items];
  };

  const systemItem = result?.currentstate?.systemitems?.item;
  if (systemItem && systemItem.subitems) {
    systemItem.subitems.item = normalizeItems(systemItem.subitems.item);
    systemItem.subitems.item.forEach(level1 => {
      if (level1.subitems) {
        level1.subitems.item = normalizeItems(level1.subitems.item);
        level1.subitems.item.forEach(level2 => {
          if (level2.subitems) {
            level2.subitems.item = normalizeItems(level2.subitems.item);
          }
        });
      }
    });
  }

  return result;
}
