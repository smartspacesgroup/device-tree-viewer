export function exportTreeToCSV(treeData: any[]) {
  const rows: string[][] = [];
  rows.push(["Path", "Manufacturer", "Model"]);

  function traverse(node: any, path: string) {
    const fullPath = path ? path + " > " + node.name : node.name;
    rows.push([
      fullPath,
      node.manufacturer || "",
      node.model || ""
    ]);
    if (node.children) {
      node.children.forEach((child: any) => traverse(child, fullPath));
    }
  }

  treeData.forEach((root) => traverse(root, ""));

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "smart_home_tree.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}