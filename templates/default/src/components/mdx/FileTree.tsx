import { Folder, File as FileIcon, FolderOpen } from "lucide-react";
import { useState } from "react";

type Node = { name: string; children?: Node[] };

interface Props {
  paths?: string[];
  tree?: Node[];
}

function pathsToTree(paths: string[]): Node[] {
  const root: Node = { name: "", children: [] };
  for (const path of paths) {
    const parts = path.split("/").filter(Boolean);
    let cursor = root;
    for (const part of parts) {
      cursor.children ??= [];
      let child = cursor.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part };
        cursor.children.push(child);
      }
      cursor = child;
    }
  }
  return root.children ?? [];
}

function isFolder(node: Node): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}

function NodeRow({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(true);
  const folder = isFolder(node);
  return (
    <li style={{ marginLeft: depth * 16 }} className="ft-row">
      <button
        type="button"
        className="ft-btn"
        onClick={() => folder && setOpen((o) => !o)}
        aria-expanded={folder ? open : undefined}
      >
        {folder ? (
          open ? <FolderOpen size={14} /> : <Folder size={14} />
        ) : (
          <FileIcon size={14} />
        )}
        <span className="ft-name">{node.name}</span>
      </button>
      {folder && open && node.children && (
        <ul className="ft-list">
          {node.children.map((child) => (
            <NodeRow key={child.name} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function FileTree({ paths, tree }: Props) {
  const resolved = tree ?? (paths ? pathsToTree(paths) : []);
  return (
    <ul className="ft-root">
      {resolved.map((node) => (
        <NodeRow key={node.name} node={node} depth={0} />
      ))}
    </ul>
  );
}
