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

  function traverse(node: any, pathParts: string[] = [], isDeviceLevel: boolean = false) {
    const nextParts = [...pathParts, node.name];

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

    // Only allow children to be traversed if the current node is NOT already a device
    const isCurrentNodeDevice = !!(node.manufacturer || node.model);
    if (!isDeviceLevel && node.children) {
      node.children.forEach((child: any) => traverse(child, nextParts, isCurrentNodeDevice));
    }
  }

  treeData.forEach((root) => traverse(root));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SmartHome");

  XLSX.writeFile(workbook, "smart_home_tree.xlsx");
}