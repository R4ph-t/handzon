import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  label?: string;
  children: ReactNode;
}

export default function Reveal({ label = "Show solution", children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="reveal">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="reveal-btn"
        aria-expanded={open}
      >
        {open ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>{open ? "Hide" : label}</span>
      </button>
      {open && <div className="reveal-content">{children}</div>}
    </div>
  );
}
