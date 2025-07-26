import { XMLParser } from 'fast-xml-parser';

export default function parseXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
  });

  const parsed = parser.parse(xmlString);
  console.log("🧪 Raw parsed object:", JSON.stringify(parsed, null, 2));

  try {
    const items = [];
    const idToDeviceMeta = new Map();

    const itemTree = parsed.currentstate?.systemitems?.item?.subitems?.item || [];

    // Normalize array
    const normalizeArray = (node) => Array.isArray(node) ? node : [node];

    // 1. Find all device metadata entries
    const metadataItems = parsed.currentstate?.systemitems?.item?.subitems?.item || [];
    for (const node of normalizeArray(metadataItems)) {
      const deviceid = node.deviceid;
      const data = node.itemdata;
      if (deviceid && data?.manufacturer && data?.model && data?.name) {
        idToDeviceMeta.set(deviceid, {
          manufacturer: data.manufacturer,
          model: data.model,
          name: data.name
        });
      }
    }

    // 2. Traverse items recursively to build hierarchy
    const traverse = (node, context = {}) => {
      if (!node || typeof node !== 'object') return;

      const type = Number(node.type);
      const name = node.name || '';
      const id = node.id;

      const newContext = { ...context };

      if (type === 2) newContext.building = name;
      else if (type === 3) newContext.floor = name;
      else if (type === 8) newContext.room = name;
      else if (type === 6 || type === 7) {
        const meta = idToDeviceMeta.get(id);
        items.push({
          id,
          name,
          ...newContext,
          ...(meta || {})
        });
      }

      if (node.subitems?.item) {
        for (const child of normalizeArray(node.subitems.item)) {
          traverse(child, newContext);
        }
      }
    };

    for (const item of normalizeArray(itemTree)) {
      traverse(item);
    }

    return items;
  } catch (err) {
    console.error("❌ Failed to parse XML:", err);
    return [];
  }
}