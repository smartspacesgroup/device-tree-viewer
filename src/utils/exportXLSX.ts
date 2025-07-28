import * as XLSX from 'xlsx';

export function exportTreeToXLSX(treeData: any[]) {
  const rows: any[] = [];
  rows.push({
    Project: "Project",
    Home: "Home",
    Building: "Building",
    Floor: "Floor",
    Room: "Room",
    Device: "Device",
    Manufacturer: "Manufacturer",
    Model: "Model"
  });

  function traverse(node: any, pathParts: string[] = [], isDeviceLevel: boolean = false): boolean {
    const nextParts = [...pathParts, node.name];
    const isCurrentNodeDevice = !!(node.manufacturer || node.model);

    let hasChildDevice = false;
    if (!isDeviceLevel && node.children) {
      for (const child of node.children) {
        const childIsDevice = traverse(child, nextParts, isCurrentNodeDevice);
        hasChildDevice ||= childIsDevice;
      }
    }

    // Only include the current row if:
    // - it's a device node
    // - and it does NOT have a device child
    if (isCurrentNodeDevice && !hasChildDevice) {
      const [project, home, building, floor, room, ...rest] = nextParts;
      const device = rest.length ? rest.join(" > ") : "";

      rows.push({
        Project: project || "",
        Home: home || "",
        Building: building || "",
        Floor: floor || "",
        Room: room || "",
        Device: device,
        Manufacturer: node.manufacturer || "",
        Model: node.model || ""
      });
    }

    return isCurrentNodeDevice || hasChildDevice;
  }

  treeData.forEach((root) => traverse(root));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SmartHome");

  XLSX.writeFile(workbook, "smart_home_tree.xlsx");
}