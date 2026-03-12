"use client";

import styles from "./ContextMenu.module.css";
import { useEffect, useRef } from "react";

export interface ContextMenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  actions: ContextMenuAction[];
}

export default function ContextMenu({ x, y, onClose, actions }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ajustar posicionamento se o menu sair da tela
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuRect.width > winWidth) {
        adjustedX = x - menuRect.width;
      }
      if (y + menuRect.height > winHeight) {
        adjustedY = y - menuRect.height;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div 
        ref={menuRef}
        className={styles.menu}
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, index) => (
          <div key={index}>
            {action.divider && <div className={styles.divider} />}
            <button
              className={`${styles.item} ${action.danger ? styles.danger : ""}`}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              <span className={styles.icon}>{action.icon}</span>
              {action.label}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
