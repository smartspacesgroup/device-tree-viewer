import { parseStringPromise } from 'xml2js';

export async function parseXMLToTree(xml: string) {
  const result = await parseStringPromise(xml, { explicitArray: false });

  const root = result?.currentstate;
  const items = root?.systemitems?.item;
  const metadata = result?.devicedata || {};

  if (!items) throw new Error("Could not find system items in XML");

  function findRootItem(name: string) {
    return Array.isArray(items)
      ? items.find((it) => it.name === name)
      : items.name === name ? items : null;
  }

  function extractDeviceMetadata(deviceId: string) {
    const key = Object.keys(metadata).find((k) => k.endsWith(`:${deviceId}`));
    if (!key) return {};
    const device = metadata[key];
    return {
      manufacturer: device?.manufacturer || '',
      model: device?.model || ''
    };
  }

  function buildTree(item: any): any {
    const node: any = {
      name: item.name
    };

    if (item.id && typeof item.id === 'string') {
      const meta = extractDeviceMetadata(item.id);
      if (meta.manufacturer || meta.model) {
        node.manufacturer = meta.manufacturer;
        node.model = meta.model;
      }
    }

    if (item.subitems?.item) {
      const children = Array.isArray(item.subitems.item)
        ? item.subitems.item
        : [item.subitems.item];
      node.children = children.map(buildTree);
    }

    return node;
  }

  const rootItem = findRootItem("206-15 Shearwater Ct W - The Madlins");
  if (!rootItem) throw new Error("Root item '206-15 Shearwater Ct W - The Madlins' not found");

  return [buildTree(rootItem)];
}