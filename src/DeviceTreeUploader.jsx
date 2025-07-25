
import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsing, setParsing] = useState(false);

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

    reader.onloadstart = () => {
      setUploadProgress(0);
      setParsingProgress(0);
    };

    reader.onloadend = () => {
      setUploadProgress(100);
    };

    reader.onload = async (e) => {
      setParsing(true);
      const xml = e.target.result;
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);

      // simulate parsing delay
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          setParsingProgress(100);
          setParsing(false);
        } else {
          setParsingProgress(progress);
        }
      }, 30);

      const parsedDevices = extractDevicesFromXML(result);
      setDevices(parsedDevices);
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

  const exportToCSV = () => {
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csv = [header, ...rows]
      .map(row => row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "devices.csv";
    a.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <h2 className="text-2xl font-bold mb-4">Upload Smart Home Project XML</h2>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      <div className="mb-2">Upload Progress: {uploadProgress}%</div>
      <div className="w-full bg-gray-200 h-2 rounded mb-4">
        <div
          className="bg-blue-500 h-2 rounded"
          style={{ width: `${uploadProgress}%` }}
        ></div>
      </div>
      {parsing && (
        <>
          <div className="mb-2">Parsing Progress: {parsingProgress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded mb-4">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${parsingProgress}%` }}
            ></div>
          </div>
        </>
      )}
      {devices.length > 0 && (
        <>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={exportToCSV}
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
