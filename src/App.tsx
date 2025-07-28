import React, { useState } from 'react';
import TreeView from './components/TreeView';
import { parseXMLToTree } from './utils/parser';
import { exportTreeToCSV } from './utils/exportCSV';

function App() {
  const [treeData, setTreeData] = useState<any[]>([]);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const result = await parseXMLToTree(text);
        setTreeData(result);
      } catch (err) {
        console.error("Failed to parse XML", err);
        alert("Failed to parse XML");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExport = () => {
    exportTreeToCSV(treeData);
  };

  return (
    <main className="p-4 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Smart Home Tree (Upload & Export)</h1>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="p-6 border-2 border-dashed border-gray-400 rounded-md text-center mb-4 bg-gray-50"
      >
        <p className="text-gray-600">Drag & drop your Control4 XML file here</p>
        <p className="text-sm mt-2">or click to select a file</p>
        <input
          type="file"
          accept=".xml"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
          className="mt-2"
        />
      </div>
      {treeData.length > 0 && (
        <>
          <button
            onClick={handleExport}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export to CSV
          </button>
          <TreeView data={treeData} />
        </>
      )}
    </main>
  );
}

export default App;