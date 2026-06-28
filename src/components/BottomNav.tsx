import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Main", to: "/" },
  { label: "Config", to: "/config" },
  { label: "Help", to: "/help" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <ul className="bottom-nav__list">
        {navItems.map((item) => (
          <li key={item.label}>
            <NavLink
              className={({ isActive }) => `bottom-nav__link${isActive ? " active" : ""}`}
              end={item.to === "/"}
              to={item.to}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
