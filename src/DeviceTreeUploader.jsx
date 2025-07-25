import React, { useState } from "react";

export default function DeviceTreeUploader() {
  const [devices, setDevices] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    setError("");
    setUploadProgress(100);
    setParsingProgress(0);
    setDevices([]);

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setParsingProgress(10);
        const text = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        const project = xmlDoc.getElementsByTagName("project")[0];
        const systemItems = project?.getElementsByTagName("systemitems")[0];
        const items = systemItems?.getElementsByTagName("item");

        if (!items) throw new Error("No items found in XML");

        const parsed = [];
        let currentFloor = "", currentRoom = "";

        const traverse = (elements) => {
          for (let item of elements) {
            const type = item.querySelector("type")?.textContent;
            const name = item.querySelector("name")?.textContent;

            if (type === "4") currentFloor = name;
            else if (type === "8") currentRoom = name;

            const config = item.querySelector("config_data_file")?.textContent;
            if (config) {
              parsed.push({
                floor: currentFloor,
                room: currentRoom,
                name,
                manufacturer: "Unknown",
                model: config
              });
            }

            const subitems = item.querySelector("subitems");
            if (subitems) {
              traverse(subitems.getElementsByTagName("item"));
            }
          }
        };

        traverse(items);
        setParsingProgress(100);
        setDevices(parsed);
      } catch (err) {
        setParsingProgress(0);
        console.error("Parsing error:", err);
        setError("Failed to parse XML: " + err.message);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setParsingProgress(0);
    };

    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const header = ["Floor", "Room", "Device Name", "Manufacturer", "Model"];
    const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
    const csv = [header, ...rows].map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
      <div className="mb-2">Upload Progress: {uploadProgress}%</div>
      <div className="mb-4">Parsing Progress: {parsingProgress}%</div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {devices.length > 0 && (
        <>
          <button onClick={exportToCSV} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">Export to CSV</button>
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
