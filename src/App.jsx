
import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";

export default function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress(100);
    setParsingProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
          allowBooleanAttributes: true,
          parseTagValue: true,
          parseAttributeValue: true,
        });

        const result = parser.parse(event.target.result);
        console.log("🧪 Raw parsed object:", result);

        const deviceMeta = extractDeviceMetadata(result);
        const items = extractItems(result, deviceMeta);
        setData(items);
        setError("");
      } catch (err) {
        console.error("❌ Failed to parse XML:", err);
        setError("Failed to parse XML: " + err.message);
      }
      setParsingProgress(100);
    };
    reader.readAsText(file);
  };

  const extractDeviceMetadata = (obj) => {
    const metadata = {};
    const jsonString = JSON.stringify(obj);
    const regex = /":index:(\d+)":\{[^}]*?"manufacturer":"(.*?)","model":"(.*?)","name":"(.*?)"/g;
    let match;
    while ((match = regex.exec(jsonString)) !== null) {
      const [_, id, manufacturer, model, name] = match;
      metadata[id] = { manufacturer, model, name };
    }
    return metadata;
  };

  const extractItems = (obj, deviceMeta) => {
    const output = [];
    const tree = obj?.currentstate?.systemitems?.item?.subitems?.item;
    if (!tree) throw new Error("No system items found in XML structure.");

    const traverse = (items, parents = {}) => {
      (Array.isArray(items) ? items : [items]).forEach((item) => {
        const { id, name, type, subitems } = item;
        const node = { id, name, type };

        const context = {
          building: parents.building,
          floor: parents.floor,
          room: parents.room,
        };

        if (type === 2) context.building = name;
        if (type === 3) context.floor = name;
        if (type === 8) context.room = name;

        if (type === 6 || type === 7) {
          const deviceId = id?.toString();
          const meta = deviceMeta[deviceId] || {};
          output.push({
            id,
            name,
            type,
            ...context,
            manufacturer: meta.manufacturer || "",
            model: meta.model || "",
            meta_name: meta.name || "",
          });
        }

        if (subitems?.item) traverse(subitems.item, context);
      });
    };

    traverse(tree);
    return output;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Device Tree Viewer</h1>
      <input type="file" accept=".xml" onChange={handleFile} className="mb-4" />
      {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
      {parsingProgress > 0 && <p>Parsing Progress: {parsingProgress}%</p>}
      {error && <p className="text-red-500">{error}</p>}
      <table className="mt-4 w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Building</th>
            <th className="border p-2">Floor</th>
            <th className="border p-2">Room</th>
            <th className="border p-2">Device Name</th>
            <th className="border p-2">Manufacturer</th>
            <th className="border p-2">Model</th>
            <th className="border p-2">Meta Name</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="border p-2">{row.building}</td>
              <td className="border p-2">{row.floor}</td>
              <td className="border p-2">{row.room}</td>
              <td className="border p-2">{row.name}</td>
              <td className="border p-2">{row.manufacturer}</td>
              <td className="border p-2">{row.model}</td>
              <td className="border p-2">{row.meta_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
