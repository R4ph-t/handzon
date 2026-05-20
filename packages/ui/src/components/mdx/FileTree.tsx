import { File as FileIcon, Folder, FolderOpen } from "lucide-react";
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

function NodeRow({ node }: { node: Node }) {
  const [open, setOpen] = useState(true);
  const folder = isFolder(node);
  return (
    <li className="ft-row">
      <button
        type="button"
        className="ft-btn"
        onClick={() => folder && setOpen((o) => !o)}
        aria-expanded={folder ? open : undefined}
      >
        {folder ? open ? <FolderOpen size={13} /> : <Folder size={13} /> : <FileIcon size={13} />}
        <span className="ft-name">{node.name}</span>
      </button>
      {folder && open && node.children && (
        <ul className="ft-list">
          {node.children.map((child) => (
            // Indentation comes from .ft-list CSS (padding-left + guide
            // line), not an inline marginLeft. Compounding the inline
            // offset with the browser-default UL padding produced the
            // huge stair-step in the screenshot.
            <NodeRow key={child.name} node={child} />
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
        <NodeRow key={node.name} node={node} />
      ))}
    </ul>
  );
}
