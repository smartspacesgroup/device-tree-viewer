
import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [error, setError] = useState("");
  const [parsingComplete, setParsingComplete] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    setUploadProgress(0);
    setParsingProgress(0);
    setParsingComplete(false);
    setDevices([]);

    const reader = new FileReader();

    reader.onloadstart = () => setUploadProgress(10);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(Math.min(percent, 99));
      }
    };

    reader.onload = async (e) => {
      setUploadProgress(100);
      try {
        setParsingProgress(10);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(e.target.result);
        setParsingProgress(50);
        const parsedDevices = extractDevicesFromXML(result);
        setParsingProgress(100);
        setDevices(parsedDevices);
        setParsingComplete(true);
      } catch (err) {
        setError("Failed to parse XML: " + err.message);
      }
    };

    reader.onerror = () => setError("Error reading file");
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
    const header = ['Floor', 'Room', 'Device Name', 'Manufacturer', 'Model'];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csv = [header, ...rows].map(r => r.map(v => `"\${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <h2 className="text-xl mb-2">Upload Smart Home Project XML</h2>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />

      {uploadProgress > 0 && (
        <div className="mb-2">
          <div>Upload Progress: {uploadProgress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-blue-500 h-2 rounded" style={{ width: uploadProgress + "%" }}></div>
          </div>
        </div>
      )}

      {uploadProgress === 100 && parsingProgress > 0 && (
        <div className="mb-2">
          <div>Parsing Progress: {parsingProgress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-green-500 h-2 rounded" style={{ width: parsingProgress + "%" }}></div>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 mt-2">{error}</div>}

      {parsingComplete && (
        <>
          <button onClick={downloadCSV} className="mt-4 mb-4 px-4 py-2 bg-blue-600 text-white rounded">Download CSV</button>
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
