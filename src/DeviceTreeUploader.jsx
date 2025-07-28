export default function DeviceTreeUploader() {

  import React, { useState } from "react";

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
      reader.onload = async (e) => {
        setUploadProgress(100);
        try {
          setParsingProgress(10);
          const { parseXML } = await import("./parseXML.js");
          const result = parseXML(e.target.result);
          setParsingProgress(50);
          const parsedDevices = extractDevicesFromXML(result);
          setParsingProgress(100);
          setDevices(parsedDevices);
      console.error("❌ Failed to parse XML:", err);
          setError("Failed to parse XML: " + err.message);
          setParsingProgress(0);
      reader.onerror = () => {
        setError("Failed to read file.");
      reader.readAsText(file);

  
  
  
    const extractDevicesFromXML = (xml) => {
      const output = [];

      // Step 1: Grab device metadata map
      const deviceMeta = xml?.currentstate?.devicedata?.[0]?.index || xml?.currentstate?.devicedata?.index || {};

      const getDeviceMeta = (id) => {
        const key = `:index:${id}`;
        const meta = deviceMeta?.[key];
        return {
          manufacturer: meta?.manufacturer || "Unknown",
          model: meta?.model || "Unknown",
          name: meta?.name || "Unknown",

      const traverse = (items, floor = "", room = "") => {
        if (!Array.isArray(items)) return;

        items.forEach((item) => {
          const type = item.type?.[0] || item.type;
          const name = item.name?.[0] || item.name;

          if (type === "4") floor = name;
          else if (type === "8") room = name;

          // Device types 6 and 7
          if (type === "6" || type === "7") {
            const deviceId = item?.itemdata?.deviceid?.[0] || item?.itemdata?.deviceid;
            const meta = getDeviceMeta(deviceId);

            output.push({
              floor,
              room,
              name: meta.name,
              manufacturer: meta.manufacturer,
              model: meta.model,

          // Recurse deeper
          const sub = item?.subitems?.[0]?.item || item?.subitems?.item;
          if (sub) traverse(sub, floor, room);

      const systemItems = (
        xml?.currentstate?.systemitems?.item ||
        xml?.currentstate?.systemitems?.[0]?.item ||
        []
      );

      if (!systemItems || !Array.isArray(systemItems)) {
        console.warn("No system items found in XML structure.");
        return [];

      console.log("System Items found:", systemItems.length);

      systemItems.forEach((topItem) => {
        const sub = topItem?.subitems?.[0]?.item || topItem?.subitems?.item;
        if (sub) traverse(sub);
        else console.warn("Top-level item has no subitems:", topItem.name || "[Unnamed]");

      return output;


      const systemItems = (
        xml?.currentstate?.systemitems?.item ||
        xml?.currentstate?.systemitems?.[0]?.item ||
        []
      );

      if (!systemItems || !Array.isArray(systemItems)) {
        console.warn("No system items found in XML structure.");
        return [];

      console.log("System Items found:", systemItems.length);

      systemItems.forEach((topItem) => {
        const sub = topItem?.subitems?.[0]?.item || topItem?.subitems?.item;
        if (sub) traverse(sub);
        else console.warn("Top-level item has no subitems:", topItem.name || "[Unnamed]");

      return output;



    const exportToCSV = () => {
      const header = ['Floor', 'Room', 'Device Name', 'Manufacturer', 'Model'];
      const rows = devices.map(d => [d.floor, d.room, d.name, d.manufacturer, d.model]);
      const csv = [header, ...rows]
        .map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "devices.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Smart Spaces Group Care Plan Parser</h1>
        <input type="file" accept=".xml" onChange={handleFileUpload} className="mb-4" />
        <div className="mb-2">Upload Progress: {uploadProgress}%</div>
        <div className="w-full bg-gray-200 rounded h-2 mb-4">
          <div className="bg-blue-500 h-2 rounded" style={{ width: `${uploadProgress}%` }}></div>
        </div>
        <div className="mb-2">Parsing Progress: {parsingProgress}%</div>
        <div className="w-full bg-gray-200 rounded h-2 mb-4">
          <div className="bg-green-500 h-2 rounded" style={{ width: `${parsingProgress}%` }}></div>
        </div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {devices.length > 0 && (
          <>
            <button
              onClick={exportToCSV}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export to CSV
            </button>
            <table className="min-w-full border">
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
                {devices.map((device, i) => (
                  <tr key={i}>
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
