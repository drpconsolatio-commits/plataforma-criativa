"use client";

import styles from "./Sidebar.module.css";
import { useState } from "react";

const navItems = [
  { icon: "🎨", label: "Criações", href: "/", active: true },
  { icon: "🤖", label: "Agentes IA", href: "#agents", active: false },
  { icon: "📊", label: "Relatórios", href: "#reports", active: false },
  { icon: "⚙️", label: "Configurações", href: "#settings", active: false },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <span className={styles.logoGlyph}>✦</span>
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Criativa</span>
            <span className={styles.logoSubtitle}>plataforma</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            {item.active && !collapsed && <span className={styles.activeDot} />}
          </a>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span
          className={styles.collapseIcon}
          style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
        >
          ‹
        </span>
      </button>

      {/* User */}
      <div className={styles.userArea}>
        <div className={styles.avatar}>M</div>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>Marcel</span>
            <span className={styles.userRole}>Admin</span>
          </div>
        )}
      </div>
    </aside>
  );
}
