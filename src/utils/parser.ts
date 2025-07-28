export async function parseXMLToTree(xmlString: string) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");

  const items = xml.querySelectorAll("currentstate > systemitems > item");
  const devicedata = xml.querySelector("devicedata");

  if (!items.length) throw new Error("Could not find system items in XML");

  const metadata: Record<string, { manufacturer?: string; model?: string }> = {};
  if (devicedata) {
    for (const el of Array.from(devicedata.children)) {
      const deviceId = el.tagName.replace(":index:", "");
      const meta: any = {};
      for (const child of Array.from(el.children)) {
        meta[child.tagName] = child.textContent || "";
      }
      metadata[deviceId] = meta;
    }
  }

  function extractDeviceMetadata(deviceId: string) {
    return metadata[deviceId] || {};
  }

  function buildTree(itemEl: Element): any {
    const id = itemEl.querySelector("id")?.textContent || "";
    const name = itemEl.querySelector("name")?.textContent || "";
    const meta = extractDeviceMetadata(id);

    const node: any = { name };
    if (meta.manufacturer || meta.model) {
      node.manufacturer = meta.manufacturer;
      node.model = meta.model;
    }

    const subitems = itemEl.querySelector(":scope > subitems");
    if (subitems) {
      const children = Array.from(subitems.querySelectorAll(":scope > item"));
      node.children = children.map(buildTree);
    }

    return node;
  }

  const rootItem = Array.from(items).find((el) =>
    el.querySelector("name")?.textContent?.includes("206-15 Shearwater")
  );

  if (!rootItem) throw new Error("Root item not found");

  return [buildTree(rootItem)];
}