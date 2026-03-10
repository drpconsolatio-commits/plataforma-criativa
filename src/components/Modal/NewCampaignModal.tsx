"use client";

import styles from "./NewCampaignModal.module.css";
import { useState } from "react";
import type { Column } from "../Kanban/KanbanBoard";

interface Props {
  columns: Column[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    columnId: string;
    creativeNames: string[];
  }) => void;
}

export default function NewCampaignModal({ columns, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState(columns[0]?.id || "");
  const [creativeInput, setCreativeInput] = useState("");
  const [creatives, setCreatives] = useState<string[]>([]);

  const addCreative = () => {
    const name = creativeInput.trim();
    if (name) {
      setCreatives((prev) => [...prev, name]);
      setCreativeInput("");
    }
  };

  const removeCreative = (index: number) => {
    setCreatives((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      columnId,
      creativeNames: creatives.length > 0 ? creatives : ["Criativo 1"],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCreative();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.modalTitle}>Nova Campanha</h2>
            <p className={styles.modalSubtitle}>
              Crie uma nova campanha e defina seus criativos iniciais.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Título da campanha</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: Campanha Black Friday 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Column */}
          <div className={styles.field}>
            <label className={styles.label}>Coluna destino</label>
            <select
              className={styles.select}
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          {/* Creatives */}
          <div className={styles.field}>
            <label className={styles.label}>
              Criativos{" "}
              <span className={styles.labelHint}>
                ({creatives.length} adicionado{creatives.length !== 1 ? "s" : ""})
              </span>
            </label>
            <div className={styles.creativeInputRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nome do criativo e pressione Enter"
                value={creativeInput}
                onChange={(e) => setCreativeInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className={styles.addCreativeBtn}
                onClick={addCreative}
              >
                +
              </button>
            </div>
            {creatives.length > 0 && (
              <div className={styles.creativeChips}>
                {creatives.map((name, i) => (
                  <div key={i} className={styles.chip}>
                    <span className={styles.chipText}>{name}</span>
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => removeCreative(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!title.trim()}
            >
              <span className={styles.submitIcon}>✦</span>
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
