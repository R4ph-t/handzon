import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  ariaLabel?: string;
  children: React.ReactNode;
}

export default function MobileSidebar({ ariaLabel = "Tutorial menu", children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="ms-trigger" aria-label={ariaLabel}>
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="ms-overlay" />
        <Dialog.Content className="ms-panel">
          <Dialog.Title className="sr-only">{ariaLabel}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Tutorial navigation and progress
          </Dialog.Description>
          <Dialog.Close asChild>
            <button type="button" className="ms-close" aria-label="Close menu">
              <X size={18} />
            </button>
          </Dialog.Close>
          <div className="ms-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
