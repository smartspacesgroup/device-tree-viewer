
import React, { useState } from "react";
import { XMLParser } from "fast-xml-parser";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    setDevices([]);
    setParsingProgress(0);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    reader.onload = (e) => {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        setParsingProgress(25);
        const result = parser.parse(e.target.result);
        setParsingProgress(60);
        const parsedDevices = extractDevicesFromXML(result);
        setDevices(parsedDevices);
        setParsingProgress(100);
      } catch (err) {
        console.error("XML Parse Error:", err);
        setError("Failed to parse XML: " + err.message);
      }
    };

    reader.onerror = () => {
      setError("File read error");
    };

    reader.readAsText(file);
  };

  const extractDevicesFromXML = (xml) => {
    const output = [];
    const systemItems = xml?.project?.systemitems?.item || [];

    const traverse = (items, floor = "", room = "") => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const type = item.type;
        const name = item.name;

        if (type === "4") floor = name;
        else if (type === "8") room = name;

        const config = item?.itemdata?.config_data_file;
        if (config) {
          output.push({
            floor,
            room,
            name,
            manufacturer: "Unknown",
            model: config
          });
        }

        if (item.subitems?.item) {
          traverse(item.subitems.item, floor, room);
        }
      });
    };

    systemItems.forEach((topItem) => {
      traverse(topItem?.subitems?.item);
    });

    return output;
  };

  const downloadCSV = () => {
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map(d =>
      [d.floor, d.room, d.name, d.manufacturer, d.model].map(val => `"${(val || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />

      <div className="mb-2">Upload Progress: {uploadProgress}%</div>
      <div className="mb-4 bg-gray-200 h-2 w-full rounded">
        <div className="bg-blue-500 h-2 rounded" style={{ width: uploadProgress + "%" }}></div>
      </div>

      <div className="mb-2">Parsing Progress: {parsingProgress}%</div>
      <div className="mb-4 bg-gray-200 h-2 w-full rounded">
        <div className="bg-green-500 h-2 rounded" style={{ width: parsingProgress + "%" }}></div>
      </div>

      {error && <div className="text-red-600 font-bold mb-4">{error}</div>}

      {devices.length > 0 && (
        <>
          <button
            onClick={downloadCSV}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Export CSV
          </button>
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Floor</th>
                <th className="border px-4 py-2">Room</th>
                <th className="border px-4 py-2">Device Name</th>
                <th className="border px-4 py-2">Manufacturer</th>
                <th className="border px-4 py-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{device.floor}</td>
                  <td className="border px-4 py-2">{device.room}</td>
                  <td className="border px-4 py-2">{device.name}</td>
                  <td className="border px-4 py-2">{device.manufacturer}</td>
                  <td className="border px-4 py-2">{device.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
