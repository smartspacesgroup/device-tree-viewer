import React, { useState } from 'react';
import { XMLParser } from 'fast-xml-parser';

export default function DeviceTreeViewer() {
  const [deviceData, setDeviceData] = useState([]);
  const [error, setError] = useState('');

  const parseHierarchy = (subitems, deviceDetailsMap, path = {}) => {
    const flat = [];
    const items = Array.isArray(subitems?.item) ? subitems.item : [subitems?.item].filter(Boolean);

    items.forEach(item => {
      const type = Number(item?.type);
      const name = item?.name;
      const id = Number(item?.id);
      const newPath = { ...path };

      if (type === 2) newPath.building = name;
      else if (type === 3) newPath.floor = name;
      else if (type === 8) newPath.room = name;
      else if (type === 6 || type === 7) {
        const meta = deviceDetailsMap[id] || {};
        flat.push({
          id,
          name,
          type,
          ...newPath,
          manufacturer: meta.manufacturer || '',
          model: meta.model || '',
          deviceName: meta.name || ''
        });
      }

      if (item?.subitems?.item) {
        flat.push(...parseHierarchy(item.subitems, deviceDetailsMap, newPath));
      }
    });
    return flat;
  };

  const handleFile = async (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parser = new XMLParser({ ignoreAttributes: false });
        const json = parser.parse(reader.result);
        const system = json?.currentstate?.systemitems?.item;
        const subitems = system?.subitems;

        const devicesRaw = json?.currentstate?.devices?.device;
        const devices = Array.isArray(devicesRaw) ? devicesRaw : [devicesRaw].filter(Boolean);
        const deviceDetailsMap = {};
        devices.forEach(dev => {
          const id = Number(dev?.deviceid);
          if (!isNaN(id)) {
            deviceDetailsMap[id] = {
              manufacturer: dev.manufacturer,
              model: dev.model,
              name: dev.name
            };
          }
        });

        const parsed = parseHierarchy(subitems, deviceDetailsMap);
        setDeviceData(parsed);
      } catch (err) {
        console.error('❌ Failed to parse XML:', err);
        setError('Failed to parse XML: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Device Tree Viewer</h1>
      <input type="file" accept=".xml" onChange={handleFile} className="mb-4" />
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2">Building</th>
            <th className="border px-2">Floor</th>
            <th className="border px-2">Room</th>
            <th className="border px-2">Name</th>
            <th className="border px-2">Manufacturer</th>
            <th className="border px-2">Model</th>
            <th className="border px-2">Device Name</th>
          </tr>
        </thead>
        <tbody>
          {deviceData.map((d, idx) => (
            <tr key={idx} className="even:bg-gray-50">
              <td className="border px-2">{d.building}</td>
              <td className="border px-2">{d.floor}</td>
              <td className="border px-2">{d.room}</td>
              <td className="border px-2">{d.name}</td>
              <td className="border px-2">{d.manufacturer}</td>
              <td className="border px-2">{d.model}</td>
              <td className="border px-2">{d.deviceName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
