import { Car, CircleHelp, Toolbox, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems: Array<{ Icon: LucideIcon; label: string; to: string }> = [
  { Icon: Car, label: "Main", to: "/" },
  { Icon: Toolbox, label: "Config", to: "/config" },
  { Icon: CircleHelp, label: "Help", to: "/help" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <ul className="bottom-nav__list">
        {navItems.map((item) => (
          <li key={item.label}>
            <NavLink
              aria-label={item.label}
              className={({ isActive }) => `bottom-nav__link${isActive ? " active" : ""}`}
              end={item.to === "/"}
              to={item.to}
            >
              <item.Icon aria-hidden="true" className="bottom-nav__icon" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
