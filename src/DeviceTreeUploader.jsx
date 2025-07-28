
import React, { useState } from "react";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setDevices([]);
    setError("");
    setUploadProgress(0);
    setParsingProgress(0);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(10);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = async (e) => {
      setUploadProgress(100);
      try {
        setParsingProgress(10);
        const { parseXML } = await import("./parseXML.js");
        const parsedDevices = parseXML(e.target.result);
        setParsingProgress(100);
        setDevices(parsedDevices);
      } catch (err) {
        console.error("❌ Failed to parse XML:", err);
        setError("Failed to parse XML: " + err.message);
        setParsingProgress(0);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleCSVExport = () => {
    const headers = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "devices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      <div className="mb-2 text-sm">Upload Progress: {uploadProgress}%</div>
      <div className="h-2 bg-blue-200 rounded mb-2">
        <div className="h-2 bg-blue-600 rounded" style={{ width: `${uploadProgress}%` }}></div>
      </div>
      <div className="mb-2 text-sm">Parsing Progress: {parsingProgress}%</div>
      <div className="h-2 bg-green-200 rounded mb-4">
        <div className="h-2 bg-green-600 rounded" style={{ width: `${parsingProgress}%` }}></div>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {devices.length > 0 && (
        <>
          <button onClick={handleCSVExport} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Export to CSV</button>
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
