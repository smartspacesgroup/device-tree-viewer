import React, { useState } from "react";
import * as xml2js from "xml2js";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [xmlContent, setXmlContent] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setXmlContent(e.target.result);
    };
    reader.readAsText(file);
  };

  const parseXml = () => {
    const parser = new xml2js.Parser();
    parser.parseStringPromise(xmlContent).then((result) => {
      const parsedDevices = extractDevicesFromXML(result);
      setDevices(parsedDevices);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Smart Home Project XML</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4 block" />
      <button
        onClick={parseXml}
        disabled={!xmlContent}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
      >
        Parse XML
      </button>
      {devices.length > 0 && (
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
      )}
    </div>
  );
}
