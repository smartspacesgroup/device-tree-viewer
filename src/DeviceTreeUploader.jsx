import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingDone, setParsingDone] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onloadend = async (e) => {
      const xml = e.target.result;
      const parser = new xml2js.Parser();
      setParsingProgress(10);
      parser.parseStringPromise(xml).then((result) => {
        setParsingProgress(60);
        const parsedDevices = extractDevicesFromXML(result);
        setParsingProgress(100);
        setDevices(parsedDevices);
        setParsingDone(true);
      });
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
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csvContent = [header, ...rows]
      .map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "device-tree.csv";
    a.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      {uploadProgress > 0 && uploadProgress < 100 && (
        <p className="mb-2">Uploading: {uploadProgress}%</p>
      )}
      {uploadProgress === 100 && !parsingDone && (
        <p className="mb-2">Parsing: {parsingProgress}%</p>
      )}
      {devices.length > 0 && (
        <>
          <button
            onClick={exportCSV}
            className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
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