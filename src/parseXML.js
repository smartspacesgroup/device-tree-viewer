
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

  const systemItems = result?.currentstate?.systemitems;
  const metadata = result?.currentstate?.devicedata ?? {};

  if (!systemItems?.item) {
    console.log("❌ No system items found in XML structure.");
    return [];
  }

  const ensureArray = (val) => (Array.isArray(val) ? val : [val]);

  const flatDevices = [];

  const walkItems = (items, context = {}) => {
    for (const item of ensureArray(items)) {
      const { id, name, type, subitems } = item;
      const nextContext = { ...context };

      if (type === 2) nextContext.building = name;
      if (type === 3) nextContext.floor = name;
      if (type === 8) nextContext.room = name;

      if (type === 6 || type === 7) {
        const meta = metadata[`:index:${id}`] || {};
        flatDevices.push({
          id,
          name,
          type,
          ...nextContext,
          manufacturer: meta.manufacturer || "Unknown",
          model: meta.model || "Unknown",
          devicename: meta.name || name || "Unnamed Device",
        });
      }

      if (subitems?.item) {
        walkItems(ensureArray(subitems.item), nextContext);
      }
    }
  };

  walkItems(ensureArray(systemItems.item));

  return flatDevices;
}
