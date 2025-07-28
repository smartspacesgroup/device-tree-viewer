
export function extractDevicesFromXML(xml) {
  const output = [];
  const deviceMap = {};

  // Flatten the device list
  const deviceEntries = xml?.project?.devices?.[0]?.device || [];
  deviceEntries.forEach((device) => {
    const id = device?.$.id;
    if (id) {
      deviceMap[id] = {
        name: device.name?.[0] || "Unknown",
        manufacturer: device.manufacturer?.[0] || "Unknown",
        model: device.model?.[0] || "Unknown",
      };
    }
  });

  // Recursive parser for rooms/floors
  function traverse(items, floor = "", room = "") {
    if (!items) return;

    if (!Array.isArray(items)) {
      items = [items];
    }

    items.forEach((item) => {
      const type = item.type?.[0];
      const name = item.name?.[0];

      if (type === "2") floor = name;
      else if (type === "8") room = name;

      const deviceId = item.deviceid?.[0];
      const deviceData = deviceId ? deviceMap[deviceId] : null;

      if (deviceData) {
        output.push({
          floor,
          room,
          name: deviceData.name,
          manufacturer: deviceData.manufacturer,
          model: deviceData.model,
        });
      }

      const sub = item?.subitems?.[0]?.item;
      if (sub) traverse(sub, floor, room);
    });
  }

  const rootItems = xml?.project?.systemitems?.[0]?.item || [];
  rootItems.forEach((item) => {
    const sub = item?.subitems?.[0]?.item;
    if (sub) traverse(sub);
  });

  return output;
}
