import { NavLink } from "react-router-dom";

interface BottomNavProps {
  onMicClick: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "খাতা", icon: "📖", end: true },
  { to: "/customers", label: "কাস্টমার", icon: "👥", end: false },
  { to: "/summary", label: "সারাংশ", icon: "📊", end: false },
] as const;

export function BottomNav({ onMicClick }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white"
      aria-label="প্রধান মেনু"
    >
      <div className="relative mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="w-16" aria-hidden="true" />

        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <button
          type="button"
          onClick={onMicClick}
          aria-label="হিসাব বলার জন্য মাইক চাপুন"
          className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-khata-red text-2xl text-white shadow-lg ring-4 ring-page-cream active:scale-95"
        >
          🎙️
        </button>
      </div>
    </nav>
  );
}

function NavItem({ to, label, icon, end }: { to: string; label: string; icon: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 font-bangla text-xs ${
          isActive ? "text-khata-red" : "text-ink/50"
        }`
      }
    >
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}
