
import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const simulateProgress = (setter, doneCallback) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        doneCallback();
      }
      setter(Math.floor(progress));
    }, 100);
  };

  const parseFile = (file) => {
    setParsing(true);
    simulateProgress(setParsingProgress, () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xml = e.target.result;
        const parser = new xml2js.Parser();
        parser.parseStringPromise(xml).then((result) => {
          const parsedDevices = extractDevicesFromXML(result);
          setDevices(parsedDevices);
          setParsing(false);
          setParsingProgress(100);
        });
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setParsingProgress(0);
    simulateProgress(setUploadProgress, () => {
      setUploading(false);
      parseFile(file);
    });
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
            model: config,
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Smart Home Device Tree Viewer</h1>

      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700 mt-1">Uploading: {uploadProgress}%</p>
        </div>
      )}

      {parsing && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-200"
              style={{ width: `${parsingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-green-700 mt-1">Parsing XML: {parsingProgress}%</p>
        </div>
      )}

      {devices.length > 0 && (
        <table className="min-w-full border mt-4">
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
      )}
    </div>
  );
}
