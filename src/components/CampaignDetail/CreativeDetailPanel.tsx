"use client";

import styles from "./CreativeDetailPanel.module.css";
import { useState } from "react";
import type { Creative, Channel } from "../Kanban/KanbanBoard";
import { CHANNELS } from "../Kanban/KanbanBoard";

interface Props {
  creative: Creative;
  onClose: () => void;
  onUpdate: (updates: Partial<Creative>) => void;
  hookTypes: string[];
  formats: string[];
  ctaTypes: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta", value: string) => void;
  trafegoSubs: string[];
  organicoSubs: string[];
  onAddSubChannel: (channel: Channel, value: string) => void;
  onRemoveSubChannel: (channel: Channel, value: string) => void;
}

/* ---- Reusable Custom Select with Add/Remove ---- */
function CustomSelect({
  label,
  value,
  options,
  onChange,
  onAdd,
  onRemove,
  optionType,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onAdd: (type: "hook" | "format" | "cta", value: string) => void;
  onRemove: (type: "hook" | "format" | "cta", value: string) => void;
  optionType: "hook" | "format" | "cta";
}) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(optionType, newValue.trim());
      onChange(newValue.trim());
      setNewValue("");
      setAdding(false);
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {adding ? (
        <div className={styles.addNewRow}>
          <input
            type="text"
            className={styles.input}
            placeholder={`Novo ${label.toLowerCase()}...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <button className={styles.addNewBtn} onClick={handleAdd}>✓</button>
          <button className={styles.addNewBtn} onClick={() => setAdding(false)}>✕</button>
        </div>
      ) : (
        <div className={styles.selectRow}>
          <select
            className={styles.select}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <button
            className={styles.addOptionBtn}
            onClick={() => setAdding(true)}
            title={`Adicionar novo ${label.toLowerCase()}`}
          >
            +
          </button>
          <button
            className={styles.manageBtn}
            onClick={() => setManaging(!managing)}
            title="Gerenciar opções"
          >
            ⚙
          </button>
        </div>
      )}
      {managing && (
        <div className={styles.manageList}>
          {options.map((o) => (
            <div key={o} className={styles.manageItem}>
              <span>{o}</span>
              <button
                className={styles.removeItemBtn}
                onClick={() => onRemove(optionType, o)}
                title="Remover"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Sub-Channel Multi-Select ---- */
function SubChannelSelect({
  label,
  allSubs,
  selected,
  onToggle,
  onAddSub,
  onRemoveSub,
}: {
  label: string;
  allSubs: string[];
  selected: string[];
  onToggle: (sub: string) => void;
  onAddSub: (value: string) => void;
  onRemoveSub: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSub, setNewSub] = useState("");
  const [managing, setManaging] = useState(false);

  const handleAdd = () => {
    if (newSub.trim()) {
      onAddSub(newSub.trim());
      setNewSub("");
      setAdding(false);
    }
  };

  return (
    <div className={styles.subChannelSection}>
      <div className={styles.subChannelHeader}>
        <span className={styles.subChannelLabel}>{label}</span>
        <button className={styles.subAddBtn} onClick={() => setAdding(!adding)}>+</button>
        <button className={styles.subManageBtn} onClick={() => setManaging(!managing)}>⚙</button>
      </div>
      <div className={styles.subChannelGrid}>
        {allSubs.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`${styles.subChannelBtn} ${
              selected.includes(sub) ? styles.subChannelActive : ""
            }`}
            onClick={() => onToggle(sub)}
          >
            {sub}
          </button>
        ))}
      </div>
      {adding && (
        <div className={styles.addNewRow} style={{ marginTop: 6 }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Novo sub-canal..."
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <button className={styles.addNewBtn} onClick={handleAdd}>✓</button>
          <button className={styles.addNewBtn} onClick={() => setAdding(false)}>✕</button>
        </div>
      )}
      {managing && (
        <div className={styles.manageList}>
          {allSubs.map((o) => (
            <div key={o} className={styles.manageItem}>
              <span>{o}</span>
              <button className={styles.removeItemBtn} onClick={() => onRemoveSub(o)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Main Panel ---- */
export default function CreativeDetailPanel({
  creative,
  onClose,
  onUpdate,
  hookTypes,
  formats,
  ctaTypes,
  onAddCustomOption,
  onRemoveCustomOption,
  trafegoSubs,
  organicoSubs,
  onAddSubChannel,
  onRemoveSubChannel,
}: Props) {
  const toggleChannel = (channel: Channel) => {
    const current = creative.channels;
    const updated = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    // If removing channel, remove its sub-channels too
    if (!updated.includes(channel)) {
      const subsToRemove = channel === "Tráfego Pago" ? trafegoSubs : organicoSubs;
      const updatedSubs = creative.subChannels.filter((s) => !subsToRemove.includes(s));
      onUpdate({ channels: updated, subChannels: updatedSubs });
    } else {
      onUpdate({ channels: updated });
    }
  };

  const toggleSubChannel = (sub: string) => {
    const current = creative.subChannels;
    const updated = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    onUpdate({ subChannels: updated });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Detalhe do Criativo</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.panelBody}>
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>Nome</label>
            <input
              type="text"
              className={styles.input}
              value={creative.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>

          {/* Row: Hook + Format */}
          <div className={styles.fieldRow}>
            <CustomSelect
              label="Tipo de Hook"
              value={creative.hookType}
              options={hookTypes}
              onChange={(v) => onUpdate({ hookType: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="hook"
            />
            <CustomSelect
              label="Formato"
              value={creative.format}
              options={formats}
              onChange={(v) => onUpdate({ format: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="format"
            />
          </div>

          {/* Row: Angle + CTA */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Ângulo de Marketing</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Descreva o ângulo de marketing"
                value={creative.marketingAngle}
                onChange={(e) => onUpdate({ marketingAngle: e.target.value })}
              />
            </div>
            <CustomSelect
              label="Tipo de CTA"
              value={creative.ctaType}
              options={ctaTypes}
              onChange={(v) => onUpdate({ ctaType: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="cta"
            />
          </div>

          <div className={styles.divider} />

          {/* Reference */}
          <div className={styles.field}>
            <label className={styles.label}>Referência</label>
            <input
              type="url"
              className={styles.input}
              placeholder="Cole o link de referência"
              value={creative.reference}
              onChange={(e) => onUpdate({ reference: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className={styles.field}>
            <label className={styles.label}>Anotações Gerais</label>
            <textarea
              className={styles.textarea}
              placeholder="Anotações sobre o criativo…"
              rows={3}
              value={creative.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
            />
          </div>

          <div className={styles.divider} />

          {/* Recording Direction */}
          <div className={styles.field}>
            <label className={styles.label}>
              Direcional de Gravação
              <span className={styles.labelAi}>🤖 futuro: IA</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Direcionamentos para gravação…"
              rows={3}
              value={creative.recordingDirection}
              onChange={(e) => onUpdate({ recordingDirection: e.target.value })}
            />
          </div>

          {/* Editing Direction */}
          <div className={styles.field}>
            <label className={styles.label}>
              Direcional de Edição
              <span className={styles.labelAi}>🤖 futuro: IA</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Direcionamentos para edição…"
              rows={3}
              value={creative.editingDirection}
              onChange={(e) => onUpdate({ editingDirection: e.target.value })}
            />
          </div>

          <div className={styles.divider} />

          {/* Channels (top level) */}
          <div className={styles.field}>
            <label className={styles.label}>Canais</label>
            <div className={styles.channelGrid}>
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.channelBtn} ${
                    creative.channels.includes(ch) ? styles.channelActive : ""
                  }`}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Channels per selected channel */}
          {creative.channels.includes("Tráfego Pago") && (
            <SubChannelSelect
              label="Sub-canais — Tráfego Pago"
              allSubs={trafegoSubs}
              selected={creative.subChannels}
              onToggle={toggleSubChannel}
              onAddSub={(v) => onAddSubChannel("Tráfego Pago", v)}
              onRemoveSub={(v) => onRemoveSubChannel("Tráfego Pago", v)}
            />
          )}

          {creative.channels.includes("Orgânicos") && (
            <SubChannelSelect
              label="Sub-canais — Orgânicos"
              allSubs={organicoSubs}
              selected={creative.subChannels}
              onToggle={toggleSubChannel}
              onAddSub={(v) => onAddSubChannel("Orgânicos", v)}
              onRemoveSub={(v) => onRemoveSubChannel("Orgânicos", v)}
            />
          )}

          {/* Drive Link */}
          <div className={styles.field}>
            <label className={styles.label}>Link da Pasta (Drive)</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://drive.google.com/..."
              value={creative.driveLink}
              onChange={(e) => onUpdate({ driveLink: e.target.value })}
            />
          </div>

          {/* Status toggle */}
          <div className={styles.field}>
            <label className={styles.label}>Status do Criativo</label>
            <button
              type="button"
              className={`${styles.statusToggle} ${
                creative.status === "done" ? styles.statusDone : ""
              }`}
              onClick={() =>
                onUpdate({ status: creative.status === "done" ? "pending" : "done" })
              }
            >
              {creative.status === "done" ? "✓ Concluído" : "○ Pendente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
