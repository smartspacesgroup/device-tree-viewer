
import React, { useState } from "react";
import { parseString } from "xml2js";

function App() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xml = event.target.result;
        parseString(xml, (err, result) => {
          if (err) {
            setError("Failed to parse XML: " + err.message);
            return;
          }

          const items = result?.project?.currentstate?.[0]?.systemitems?.[0]?.item || [];
          const deviceData = [];
          const metadata = result?.project?.devicedata?.[0]?.devicelist?.[0] || {};

          const extract = (entries, floor, room) => {
            if (!Array.isArray(entries)) return;

            entries.forEach((entry) => {
              const type = entry?.type?.[0];
              const name = entry?.name?.[0] || "";
              if (type === "2") floor = name;
              if (type === "8") room = name;

              const subitems = entry?.subitems?.[0]?.item;
              if (Array.isArray(subitems)) {
                extract(subitems, floor, room);
              }

              if (type === "6" || type === "7") {
                const deviceId = entry?.deviceid?.[0];
                const meta = metadata[":index:" + deviceId] || {};
                deviceData.push({
                  floor,
                  room,
                  name: meta.name || name || "Unknown",
                  manufacturer: meta.manufacturer || "Unknown",
                  model: meta.model || "Unknown",
                });
              }
            });
          };

          items.forEach((i) => extract(i?.subitems?.[0]?.item, "", ""));
          if (deviceData.length === 0) setError("No devices found in XML.");
          setDevices(deviceData);
        });
      } catch (e) {
        setError("Failed to parse XML: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const downloadCSV = () => {
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map((d) => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((v) => \`"\${(v || "").replace(/"/g, '""')}"\`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devices.csv";
    link.click();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {devices.length > 0 && (
        <>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={downloadCSV}
          >
            Export to CSV
          </button>
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Floor</th>
                <th className="border px-4 py-2">Room</th>
                <th className="border px-4 py-2">Device Name</th>
                <th className="border px-4 py-2">Manufacturer</th>
                <th className="border px-4 py-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={i}>
                  <td className="border px-4 py-2">{d.floor}</td>
                  <td className="border px-4 py-2">{d.room}</td>
                  <td className="border px-4 py-2">{d.name}</td>
                  <td className="border px-4 py-2">{d.manufacturer}</td>
                  <td className="border px-4 py-2">{d.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
