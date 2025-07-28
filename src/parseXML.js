
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

  const devices = [];
  const metadata = result?.currentstate?.devices?.device ?? {};
  const systemItems = result?.currentstate?.systemitems?.item ?? [];

  const indexMap = {};
  Object.keys(metadata).forEach((key) => {
    const cleanKey = key.replace(":index:", "");
    indexMap[cleanKey] = metadata[key];
  });

  const traverse = (items, floor = "", room = "") => {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
      const type = item.type;
      const name = item.name;
      const id = item.id;

      if (type === "3") floor = name;
      else if (type === "8") room = name;

      if (type === "6" || type === "7") {
        const deviceId = item.deviceid;
        const meta = indexMap[deviceId] || {};
        devices.push({
          floor,
          room,
          name: meta.name || name || "Unknown",
          manufacturer: meta.manufacturer || "Unknown",
          model: meta.model || "Unknown"
        });
      }

      if (item.subitems?.item) {
        const children = Array.isArray(item.subitems.item) ? item.subitems.item : [item.subitems.item];
        traverse(children, floor, room);
      }
    });
  };

  systemItems.forEach((topItem) => {
    if (topItem.subitems?.item) {
      const children = Array.isArray(topItem.subitems.item) ? topItem.subitems.item : [topItem.subitems.item];
      traverse(children);
    }
  });

  return devices;
}
