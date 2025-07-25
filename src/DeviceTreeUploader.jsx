import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setDevices([]);
    setUploadProgress(0);
    setParseProgress(0);
    setError("");

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100);
      }
    };

    reader.onload = async (e) => {
      setUploadProgress(100);
      try {
        const xml = e.target.result;
        setParseProgress(25);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);
        setParseProgress(75);
        const parsedDevices = extractDevicesFromXML(result);
        setDevices(parsedDevices);
        setParseProgress(100);
      } catch (err) {
        setError("Failed to parse XML: " + (err?.message || err));
        setParseProgress(0);
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

  const handleExportCSV = () => {
    const header = ['Floor', 'Room', 'Device Name', 'Manufacturer', 'Model'];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csvContent = [header, ...rows]
      .map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parsed_devices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />

      <div className="mb-2">
        <p>Upload Progress: {uploadProgress.toFixed(0)}%</p>
        <div className="w-full bg-gray-200 h-2 rounded mb-2">
          <div className="bg-blue-600 h-2 rounded" style={{ width: uploadProgress + "%" }}></div>
        </div>

        <p>Parsing Progress: {parseProgress.toFixed(0)}%</p>
        <div className="w-full bg-gray-200 h-2 rounded">
          <div className="bg-green-600 h-2 rounded" style={{ width: parseProgress + "%" }}></div>
        </div>
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {devices.length > 0 && (
        <>
          <button
            onClick={handleExportCSV}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Export to CSV
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