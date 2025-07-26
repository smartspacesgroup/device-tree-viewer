
import { XMLParser } from "fast-xml-parser";

export function parseXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
  });

  const result = parser.parse(xmlString);

  // Normalize systemitems.item and its subitems.item to arrays
  const systemItems = result?.currentstate?.systemitems;
  if (systemItems && systemItems.item) {
    if (!Array.isArray(systemItems.item)) {
      systemItems.item = [systemItems.item];
    }

    systemItems.item.forEach((item) => {
      if (item.subitems?.item && !Array.isArray(item.subitems.item)) {
        item.subitems.item = [item.subitems.item];
      }
    });
  }

  console.log("🧪 Raw parsed object:", JSON.stringify(result, null, 2));
  return result;
}
