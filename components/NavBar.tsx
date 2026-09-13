"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSun, IconCalendar, IconClockHour4, IconSettings } from "@tabler/icons-react";

const TABS = [
  { href: "/", label: "Today", Icon: IconSun },
  { href: "/week", label: "Calendar", Icon: IconCalendar },
  { href: "/upcoming", label: "Upcoming", Icon: IconClockHour4 },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors duration-150 active:scale-95 ${
                active ? "text-accent" : "text-muted hover:text-text"
              }`}
            >
              <Icon
                size={21}
                stroke={active ? 2.1 : 1.8}
                className="transition-transform duration-150 group-hover:scale-110 group-active:scale-90"
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
