import * as XLSX from 'xlsx';

export function exportTreeToXLSX(treeData: any[]) {
  const rows: any[] = [];
  rows.push({ Path: "Path", Manufacturer: "Manufacturer", Model: "Model" });

  function traverse(node: any, path: string) {
    const fullPath = path ? path + " > " + node.name : node.name;
    rows.push({
      Path: fullPath,
      Manufacturer: node.manufacturer || "",
      Model: node.model || ""
    });
    if (node.children) {
      node.children.forEach((child: any) => traverse(child, fullPath));
    }
  }

  treeData.forEach((root) => traverse(root, ""));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SmartHome");

  XLSX.writeFile(workbook, "smart_home_tree.xlsx");
}