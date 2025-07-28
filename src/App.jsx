
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import metadataMap from './deviceid_metadata_map.json';

function App() {
  const [status, setStatus] = useState("Upload a Control4 XML file");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const xml = evt.target.result;
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
          allowBooleanAttributes: true,
        });
        const json = parser.parse(xml);

        const items = json.currentstate?.systemitems?.item?.subitems?.item || [];

        const devices = [];

        const traverse = (nodes, path = []) => {
          if (!Array.isArray(nodes)) nodes = [nodes];
          for (const node of nodes) {
            const name = node.name || "Unnamed";
            const id = node.id || node.deviceid;
            const newPath = [...path, name];
            if (node.deviceid) {
              const meta = metadataMap[node.deviceid] || {};
              devices.push({
                Project: path[0] || "",
                Home: path[1] || "",
                Building: path[2] || "",
                Floor: path[3] || "",
                Room: path[4] || "",
                Device: newPath.slice(5).join(" > "),
                Manufacturer: meta.manufacturer || "",
                Model: meta.model || ""
              });
            }
            if (node.subitems?.item) {
              traverse(node.subitems.item, newPath);
            }
          }
        };

        traverse(items);

        if (devices.length === 0) {
          setStatus("No device entries found");
          return;
        }

        const worksheet = XLSX.utils.json_to_sheet(devices);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Devices");
        XLSX.writeFile(workbook, "smart_home_tree.xlsx");

        setStatus("✅ Exported smart_home_tree.xlsx");
      } catch (err) {
        setStatus("❌ Failed to parse XML: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Smart Home Tree Viewer</h2>
      <input type="file" accept=".xml" onChange={handleFile} />
      <p>{status}</p>
    </div>
  );
}

export default App;
