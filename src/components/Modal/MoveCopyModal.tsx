"use client";

import { useState } from "react";
import styles from "./MoveCopyModal.module.css";
import { Search, X, Folder } from "lucide-react";

interface CampaignOption {
  id: string;
  title: string;
  date: string;
}

interface Props {
  type: "move" | "copy";
  creativeName: string;
  campaigns: CampaignOption[];
  onClose: () => void;
  onConfirm: (targetCampaignId: string) => void;
}

export default function MoveCopyModal({
  type,
  creativeName,
  campaigns,
  onClose,
  onConfirm,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = campaigns.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          {type === "move" ? "Mover Criativo" : "Copiar Criativo"}
        </h2>
        <p className={styles.subtitle}>
          {type === "move" 
            ? `Selecione o destino para "${creativeName}"` 
            : `Duplicar "${creativeName}" para:`}
        </p>

        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Nenhuma campanha encontrada.</div>
          ) : (
            filtered.map((camp) => (
              <button
                key={camp.id}
                className={styles.item}
                onClick={() => onConfirm(camp.id)}
              >
                <div>
                  <div className={styles.itemTitle}>{camp.title}</div>
                  <div className={styles.itemDate}>{camp.date}</div>
                </div>
                <Folder size={16} color="var(--accent-primary)" opacity={0.5} />
              </button>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
