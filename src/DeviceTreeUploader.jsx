import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadProgress(0);
    setParseProgress(0);
    setError("");
    setDevices([]);

    const reader = new FileReader();

    reader.onloadstart = () => setUploadProgress(10);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 90);
        setUploadProgress(percentLoaded);
      }
    };
    reader.onloadend = () => setUploadProgress(100);

    reader.onload = async (e) => {
      const xml = e.target.result;
      setTimeout(() => setParseProgress(10), 200);

      try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml);
        const parsedDevices = extractDevicesFromXML(result);
        setParseProgress(100);
        setDevices(parsedDevices);
      } catch (err) {
        setParseProgress(100);
        setError("Failed to parse XML: " + (err?.message || "Unknown error"));
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

  const exportCSV = () => {
    const header = ['Floor', 'Room', 'Device Name', 'Manufacturer', 'Model'];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'devices.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <h2 className="text-2xl font-bold mb-4">Upload Smart Home Project XML</h2>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      <div className="mb-2">Upload Progress: {uploadProgress}%</div>
      <progress value={uploadProgress} max="100" className="w-full h-2 mb-4" />
      <div className="mb-2">Parse Progress: {parseProgress}%</div>
      <progress value={parseProgress} max="100" className="w-full h-2 mb-4" />
      {error && <div className="text-red-500 mt-4">{error}</div>}
      {devices.length > 0 && (
        <div>
          <button onClick={exportCSV} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
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
        </div>
      )}
    </div>
  );
}