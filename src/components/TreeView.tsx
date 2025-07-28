import React from 'react';

interface TreeNode {
  name: string;
  manufacturer?: string;
  model?: string;
  children?: TreeNode[];
}

const TreeItem: React.FC<{ node: TreeNode }> = ({ node }) => (
  <li className="ml-4 mt-2">
    <div>
      <span className="font-medium">{node.name}</span>
      {node.manufacturer && node.model && (
        <span className="ml-2 text-gray-600 text-sm">
          ({node.manufacturer} - {node.model})
        </span>
      )}
    </div>
    {node.children && (
      <ul className="pl-4 border-l border-gray-300 ml-2">
        {node.children.map((child, index) => (
          <TreeItem key={index} node={child} />
        ))}
      </ul>
    )}
  </li>
);

const TreeView: React.FC<{ data: TreeNode[] }> = ({ data }) => (
  <ul className="text-sm">{data.map((node, idx) => <TreeItem key={idx} node={node} />)}</ul>
);

export default TreeView;