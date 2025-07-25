import React, { useState } from "react";
import { parseStringPromise } from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await parseStringPromise(e.target.result);
        const parsed = extractDevicesFromXML(result);
        if (parsed.length === 0) throw new Error("No items found in XML");
        setDevices(parsed);
        setError("");
      } catch (err) {
        setError("Failed to parse XML: " + err.message);
        setDevices([]);
      }
    };
    reader.readAsText(file);
  };

  const extractDevicesFromXML = (xml) => {
    const output = [];

    const traverse = (items, floor = "", room = "") => {
      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const type = item.type?.[0];
        const name = item.name?.[0];

        if (type === "4") floor = name;
        else if (type === "8") room = name;

        const config = item?.itemdata?.[0]?.config_data_file?.[0];
        if (config) {
          output.push({
            floor,
            room,
            name,
            manufacturer: "Unknown",
            model: config
          });
        }

        if (item.subitems?.[0]?.item) {
          traverse(item.subitems[0].item, floor, room);
        }
      });
    };

    const systemItems = xml?.project?.systemitems?.[0]?.item || [];
    systemItems.forEach((topItem) => {
      traverse(topItem?.subitems?.[0]?.item);
    });

    return output;
  };

  const downloadCSV = () => {
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map((d) => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csv = [header, ...rows].map((r) =>
      r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "devices.csv";
    link.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {devices.length > 0 && (
        <>
          <button
            onClick={downloadCSV}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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