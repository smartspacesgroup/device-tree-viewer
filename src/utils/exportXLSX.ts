import * as XLSX from 'xlsx';

export function exportTreeToXLSX(treeData: any[]) {
  const rows: any[] = [];
  rows.push({ Building: "Building", Floor: "Floor", Room: "Room", Device: "Device", Manufacturer: "Manufacturer", Model: "Model" });

  function traverse(node: any, pathParts: string[] = []) {
    const nextParts = [...pathParts, node.name];
    const depth = nextParts.length;
    const [building, floor, room, ...rest] = nextParts;
    const device = rest.length ? rest.join(" > ") : undefined;

    rows.push({
      Building: building || "",
      Floor: floor || "",
      Room: room || "",
      Device: device || (depth === 4 ? nextParts[3] : ""),
      Manufacturer: node.manufacturer || "",
      Model: node.model || ""
    });

    if (node.children) {
      node.children.forEach((child: any) => traverse(child, nextParts));
    }
  }

  treeData.forEach((root) => traverse(root));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SmartHome");

  XLSX.writeFile(workbook, "smart_home_tree.xlsx");
}