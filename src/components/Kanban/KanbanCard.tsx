"use client";

import styles from "./KanbanCard.module.css";
import type { CampaignCard, Checklist, Label } from "./KanbanBoard";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useRef, useEffect } from "react";
import { Pin, MoreVertical, GripVertical, Tag, Edit2, Trash2, X, Check, BarChart3, Binary } from "lucide-react";

const LABEL_COLORS = [
  "#7c5cfc", "#38bdf8", "#34d399", "#fbbf24", "#f472b6",
  "#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#84cc16",
];

interface Props {
  card: CampaignCard;
  colorVar: string;
  index: number;
  onOpenFullscreen: () => void;
  onUpdateChecklist?: (cardId: string, field: keyof Checklist, value: boolean) => void;
  onDeleteCard?: (cardId: string) => void;
  onTogglePin?: (cardId: string) => void;
  onAddLabel?: (cardId: string, label: Label) => void;
  onRemoveLabel?: (cardId: string, labelId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
  isDragOverlay?: boolean;
}

export default function KanbanCard({
  card,
  colorVar,
  index,
  onOpenFullscreen,
  onUpdateChecklist,
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

  const doneCount = card.creatives.filter((c) => c.status === "done").length;
  const progress =
    card.creatives.length > 0
      ? Math.round((doneCount / card.creatives.length) * 100)
      : 0;

  const checklistItems: { key: keyof Checklist; label: string }[] = [
    { key: "roteirizacao", label: "Roteirização" },
    { key: "edicao", label: "Edição" },
  ];

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
      className={`${styles.card} ${isDragging ? styles.dragging : ""} ${
        isDragOverlay ? styles.overlay : ""
      } ${card.pinned ? styles.pinned : ""}`}
    >
      {/* Pin indicator */}
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
      {card.labels.length > 0 && (
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

      {/* Card Header — clickable to open fullscreen */}
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
              title="Renomear campanha"
            >
              <Edit2 size={12} />
            </button>
          </div>
        )}
 
        {!card.is_analysis && (
          /* Progress bar */
          <div className={styles.progressArea}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%`, background: colorVar }}
              />
            </div>
            <span className={styles.progressText}>
              {doneCount}/{card.creatives.length}
            </span>
          </div>
        )}
        
        {card.is_analysis && (
          <div className={styles.analysisMeta}>
            <BarChart3 size={14} className={styles.analysisIcon} />
            <span>Resultado da IA Disponível</span>
          </div>
        )}
      </div>

  {/* Checklist Master — only Roteirização + Edição */}
  {!card.is_analysis && (
    <div className={styles.checklist}>
      {checklistItems.map((item) => (
        <label
          key={item.key}
          className={`${styles.checkItem} ${
            card.checklist[item.key] ? styles.checkDone : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={card.checklist[item.key]}
            onChange={(e) =>
              onUpdateChecklist?.(card.id, item.key, e.target.checked)
            }
            className={styles.checkInput}
          />
          <span className={styles.checkBox}>
            {card.checklist[item.key] ? <Check size={14} /> : ""}
          </span>
          <span className={styles.checkLabel}>{item.label}</span>
        </label>
      ))}
    </div>
  )}

      {/* Open hint */}
      <div className={styles.expandHint}>
        <span className={styles.hintText} onClick={onOpenFullscreen}>
          {card.is_analysis ? "Ver Análise IA →" : "Abrir Campanha →"}
        </span>
      </div>
    </div>
  );
}
