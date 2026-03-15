"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./AnalysisCard.module.css";
import type { CampaignCard } from "./KanbanBoard";
import { BarChart3, Zap, Target, MessageSquare, MoreVertical, GripVertical, Rocket, Pin, Edit2, Trash2, Tag, X, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Label } from "./KanbanBoard";

const LABEL_COLORS = [
  "#7c5cfc", "#38bdf8", "#34d399", "#fbbf24", "#f472b6",
  "#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#84cc16",
];

interface Props {
  card: CampaignCard;
  index: number;
  onOpenFullscreen: () => void;
  onDeleteCard?: (cardId: string) => void;
  onTogglePin?: (cardId: string) => void;
  onAddLabel?: (cardId: string, label: Label) => void;
  onRemoveLabel?: (cardId: string, labelId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
  isDragOverlay?: boolean;
}

export default function AnalysisCard({
  card,
  index,
  onOpenFullscreen,
  onDeleteCard,
  onTogglePin,
  onAddLabel,
  onRemoveLabel,
  onRenameCard,
  isDragOverlay = false,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : ("auto" as unknown as number),
  };

  const metrics = card.metadata?.analysis?.performance_metrics || {
    tsr_avg: 0,
    retencao_avg: 0,
    impacto_avg: 0,
  };

  const format = (v: number) => Number(v || 0).toFixed(1);

  const handleAddLabel = () => {
    if (labelText.trim() && onAddLabel) {
      onAddLabel(card.id, {
        id: `lbl-${Date.now()}`,
        text: labelText.trim(),
        color: labelColor,
      });
      setLabelText("");
      setShowLabelInput(false);
    }
  };

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== card.title) {
      onRenameCard?.(card.id, trimmed);
    } else {
      setEditTitle(card.title);
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${card.pinned ? styles.pinned : ""}`}
    >
      {card.pinned && <div className={styles.pinIndicator}><Pin size={14} fill="currentColor" /></div>}

      {/* Drag Handle + Menu */}
      <div className={styles.topRight}>
        <button
          className={styles.menuBtn}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        >
          <MoreVertical size={16} />
        </button>
        <div className={styles.dragHandle} {...attributes} {...listeners}>
          <span className={styles.gripIcon}><GripVertical size={16} /></span>
        </div>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.menuItem}
            onClick={() => { onTogglePin?.(card.id); setShowMenu(false); }}
          >
            <Pin size={14} /> {card.pinned ? "Desafixar" : "Fixar no topo"}
          </button>
          <button
            className={styles.menuItem}
            onClick={() => { setShowLabelInput(true); setShowMenu(false); }}
          >
            <Tag size={14} /> Adicionar etiqueta
          </button>
          <button
            className={styles.menuItem}
            onClick={() => { setEditing(true); setShowMenu(false); }}
          >
            <Edit2 size={14} /> Renomear
          </button>
          <button
            className={`${styles.menuItem} ${styles.menuDanger}`}
            onClick={() => { onDeleteCard?.(card.id); setShowMenu(false); }}
          >
            <Trash2 size={14} /> Excluir card
          </button>
        </div>
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className={styles.labels}>
          {card.labels.map((lbl) => (
            <span
              key={lbl.id}
              className={styles.label}
              style={{ background: lbl.color }}
            >
              {lbl.text}
              <button
                className={styles.labelRemove}
                onClick={(e) => { e.stopPropagation(); onRemoveLabel?.(card.id, lbl.id); }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Label input */}
      {showLabelInput && (
        <div className={styles.labelInputRow} onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className={styles.labelInput}
            placeholder="Texto da etiqueta"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
            autoFocus
          />
          <div className={styles.colorPicker}>
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                className={`${styles.colorDot} ${labelColor === c ? styles.colorSelected : ""}`}
                style={{ background: c }}
                onClick={() => setLabelColor(c)}
              />
            ))}
          </div>
          <div className={styles.labelActions}>
            <button className={styles.labelConfirm} onClick={handleAddLabel}><Check size={14} /></button>
            <button className={styles.labelCancel} onClick={() => setShowLabelInput(false)}><X size={14} /></button>
          </div>
        </div>
      )}

      <div className={styles.cardHeader} onClick={editing ? undefined : onOpenFullscreen}>
        <div className={styles.cardTop}>
          <span className={styles.date}>{card.date}</span>
        </div>

        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.titleInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle();
              if (e.key === "Escape") { setEditTitle(card.title); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={styles.titleWrapper}>
            <h3
              className={styles.cardTitle}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditTitle(card.title);
                setEditing(true);
              }}
              title="Duplo clique para renomear"
            >
              {card.title}
            </h3>
            <button
              className={styles.editTitleBtn}
              onClick={(e) => {
                e.stopPropagation();
                setEditTitle(card.title);
                setEditing(true);
              }}
              title="Renomear análise"
            >
              <Edit2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>TSR</span>
          <span className={`${styles.metricValue} ${metrics.tsr_avg >= 25 ? styles.elite : styles.ruim}`}>
            {format(metrics.tsr_avg)}%
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>RET</span>
          <span className={`${styles.metricValue} ${metrics.retencao_avg >= 35 ? styles.elite : styles.ruim}`}>
            {format(metrics.retencao_avg)}%
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>IMP</span>
          <span className={`${styles.metricValue} ${metrics.impacto_avg >= 1.5 ? styles.elite : styles.ruim}`}>
            {format(metrics.impacto_avg)}%
          </span>
        </div>
      </div>

      <div className={styles.expandHint}>
        <span className={styles.hintText} onClick={onOpenFullscreen}>
          Ver Insight Detalhado →
        </span>
        <div className={styles.aiBadge}>
          <Rocket size={10} />
          <span>IA READY</span>
        </div>
      </div>
    </div>
  );
}
