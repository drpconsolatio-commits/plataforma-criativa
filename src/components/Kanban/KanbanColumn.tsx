"use client";

import styles from "./KanbanColumn.module.css";
import KanbanCard from "./KanbanCard";
import type { Column, CampaignCard, Checklist, Label } from "./KanbanBoard";
import { useDroppable } from "@dnd-kit/core";
import { Sparkles } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Props {
  column: Column;
  index: number;
  onOpenCampaign: (card: CampaignCard, columnId: string) => void;
  onUpdateChecklist: (cardId: string, field: keyof Checklist, value: boolean) => void;
  onDeleteCard: (cardId: string) => void;
  onTogglePin: (cardId: string) => void;
  onAddLabel: (cardId: string, label: Label) => void;
  onRemoveLabel: (cardId: string, labelId: string) => void;
  onRenameCard: (cardId: string, newTitle: string) => void;
}

export default function KanbanColumn({
  column,
  index,
  onOpenCampaign,
  onUpdateChecklist,
  onDeleteCard,
  onTogglePin,
  onAddLabel,
  onRemoveLabel,
  onRenameCard,
}: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={styles.columnHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.colorDot} style={{ background: column.colorVar }} />
          <h2 className={styles.columnTitle}>{column.title}</h2>
          <span className={styles.count}>{column.cards.length}</span>
        </div>
      </div>

      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.cardsList}>
          {column.cards.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><Sparkles size={24} /></span>
              <p>Nenhum card ainda</p>
            </div>
          ) : (
            column.cards.map((card, cardIndex) => (
              <KanbanCard
                key={card.id}
                card={card}
                colorVar={column.colorVar}
                index={cardIndex}
                onOpenFullscreen={() => onOpenCampaign(card, column.id)}
                onUpdateChecklist={onUpdateChecklist}
                onDeleteCard={onDeleteCard}
                onTogglePin={onTogglePin}
                onAddLabel={onAddLabel}
                onRemoveLabel={onRemoveLabel}
                onRenameCard={onRenameCard}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
