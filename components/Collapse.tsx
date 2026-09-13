import { ReactNode } from "react";

export default function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`pop-collapse ${open ? "pop-collapse-open" : ""}`}>
      <div>{children}</div>
    </div>
  );
}
