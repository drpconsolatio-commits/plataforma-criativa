"use client";

import styles from "./Sidebar.module.css";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Bot, BarChart3, Settings, Sparkles, ChevronLeft } from "lucide-react";

const navItems = [
  { icon: <Palette size={20} />, label: "Criações", href: "/" },
  { icon: <Bot size={20} />, label: "Agentes IA", href: "/agentes" },
  { icon: <BarChart3 size={20} />, label: "Relatórios", href: "#reports" },
  { icon: <Settings size={20} />, label: "Configurações", href: "#settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <span className={styles.logoGlyph}><Sparkles size={22} color="var(--accent-primary)" /></span>
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
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {isActive && !collapsed && <span className={styles.activeDot} />}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span
          className={styles.collapseIcon}
          style={{ transform: collapsed ? "rotate(180deg)" : "none", display: 'flex' }}
        >
          <ChevronLeft size={16} />
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
