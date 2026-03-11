"use client";

import styles from "./CampaignDetailView.module.css";
import { useState, useEffect } from "react";
import type { Creative, Channel } from "../Kanban/KanbanBoard";
import CreativeDetailPanel from "./CreativeDetailPanel";

interface Props {
  card: { id: string; title: string; date: string; creatives: Creative[] };
  columnId: string;
  onBack: () => void;
  onUpdateCreative: (creativeId: string, updates: Partial<Creative>) => void;
  onAddCreative: (creative: Creative) => void;
  hookTypes: string[];
  formats: string[];
  ctaTypes: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta", value: string) => void;
  trafegoSubs: string[];
  organicoSubs: string[];
  onAddSubChannel: (channel: Channel, value: string) => void;
  onRemoveSubChannel: (channel: Channel, value: string) => void;
  onRenameCampaign: (cardId: string, newTitle: string) => void;
}

export default function CampaignDetailView({
  card,
  columnId,
  onBack,
  onUpdateCreative,
  onAddCreative,
  hookTypes,
  formats,
  ctaTypes,
  onAddCustomOption,
  onRemoveCustomOption,
  trafegoSubs,
  organicoSubs,
  onAddSubChannel,
  onRemoveSubChannel,
  onRenameCampaign,
}: Props) {
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "manual">("manual");
  
  // Edição Titulo Campanha
  const [editingCampaignTitle, setEditingCampaignTitle] = useState(false);
  const [campaignTitleVal, setCampaignTitleVal] = useState(card.title);
  
  const [prevCardTitle, setPrevCardTitle] = useState(card.title);
  if (card.title !== prevCardTitle) {
    setPrevCardTitle(card.title);
    setCampaignTitleVal(card.title);
  }

  const handleSaveCampaignTitle = () => {
    const trimmed = campaignTitleVal.trim();
    if (trimmed && trimmed !== card.title) {
      onRenameCampaign(card.id, trimmed);
    } else {
      setCampaignTitleVal(card.title);
    }
    setEditingCampaignTitle(false);
  };

  // Edição Nome Criativo
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [creativeNameVal, setCreativeNameVal] = useState("");

  const startEditingCreative = (cr: Creative) => {
    setEditingCreativeId(cr.id);
    setCreativeNameVal(cr.name);
  };

  const handleSaveCreativeName = (cr: Creative) => {
    const trimmed = creativeNameVal.trim();
    if (trimmed && trimmed !== cr.name) {
      onUpdateCreative(cr.id, { name: trimmed });
    }
    setEditingCreativeId(null);
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    // Opcional: feedback visual ou toast
  };

  const doneCount = card.creatives.filter((c) => c.status === "done").length;

  const sortedCreatives = [...card.creatives].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "date") return b.createdAt - a.createdAt;
    return 0;
  });

  const filteredCreatives = sortedCreatives.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.hookType.toLowerCase().includes(q) ||
      c.format.toLowerCase().includes(q) ||
      c.ctaType.toLowerCase().includes(q) ||
      c.marketingAngle.toLowerCase().includes(q)
    );
  });

  const handleAddCreative = () => {
    const newCreative: Creative = {
      id: crypto.randomUUID(),
      name: "Novo Criativo",
      hookType: "Visual",
      marketingAngle: "",
      format: "Talkinghead",
      ctaType: "Suave",
      reference: "",
      notes: "",
      recordingDirection: "",
      editingDirection: "",
      channels: [],
      subChannels: [],
      driveLink: "",
      uploadedToChannels: false,
      status: "pending",
      createdAt: Date.now(),
    };
    onAddCreative(newCreative);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Voltar ao Kanban
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            {editingCampaignTitle ? (
              <input
                type="text"
                className={styles.titleInput}
                value={campaignTitleVal}
                onChange={(e) => setCampaignTitleVal(e.target.value)}
                onBlur={handleSaveCampaignTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCampaignTitle();
                  if (e.key === "Escape") {
                    setCampaignTitleVal(card.title);
                    setEditingCampaignTitle(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <>
                <h1
                  className={styles.title}
                  onDoubleClick={() => setEditingCampaignTitle(true)}
                  title="Duplo clique para renomear"
                >
                  {card.title}
                </h1>
                <button
                  className={styles.editTitleBtn}
                  onClick={() => setEditingCampaignTitle(true)}
                  title="Renomear campanha"
                >
                  ✏️
                </button>
              </>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>{card.date}</span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>
              {doneCount}/{card.creatives.length} criativos concluídos
            </span>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleAddCreative}>
          <span>+</span> Novo Criativo
        </button>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.filterInput}
          placeholder="🔍 Filtrar criativos por nome, hook, formato..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        
        <div className={styles.sortBar}>
          <span className={styles.sortLabel}>Ordenar por:</span>
          <select 
            className={styles.sortSelect} 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="manual">Manual</option>
            <option value="name">Nome (A-Z)</option>
            <option value="date">Data (Mais recentes)</option>
          </select>
        </div>

        {filter && (
          <span className={styles.filterCount}>
            {filteredCreatives.length} de {card.creatives.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thStatus}></th>
              <th className={styles.thName}>Nome do Criativo</th>
              <th>Hook</th>
              <th>Ângulo de Marketing</th>
              <th>Formato</th>
              <th>CTA</th>
              <th>Canais</th>
            </tr>
          </thead>
          <tbody>
            {filteredCreatives.map((creative) => (
              <tr
                key={creative.id}
                className={`${styles.row} ${
                  selectedCreative?.id === creative.id ? styles.rowActive : ""
                } ${creative.status === "done" ? styles.rowDone : ""}`}
                onClick={() => setSelectedCreative(creative)}
              >
                <td className={styles.tdStatus}>
                  <span
                    className={`${styles.statusDot} ${
                      creative.status === "done" ? styles.statusDone : ""
                    }`}
                  >
                    {creative.status === "done" ? "✓" : ""}
                  </span>
                </td>
                <td className={styles.tdName}>
                  {editingCreativeId === creative.id ? (
                    <input
                      type="text"
                      className={styles.nameInput}
                      value={creativeNameVal}
                      onChange={(e) => setCreativeNameVal(e.target.value)}
                      onBlur={() => handleSaveCreativeName(creative)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCreativeName(creative);
                        if (e.key === "Escape") setEditingCreativeId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <div className={styles.nameWrapper}>
                      <span
                        className={styles.nameText}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyName(creative.name);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingCreative(creative);
                        }}
                        title="Clique p/ copiar • Duplo clique p/ editar"
                      >
                        {creative.name}
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  <span className={styles.pill}>{creative.hookType}</span>
                </td>
                <td className={styles.tdAngle}>
                  {creative.marketingAngle || <span className={styles.empty}>—</span>}
                </td>
                <td>
                  <span className={styles.pillFormat}>{creative.format}</span>
                </td>
                <td>
                  <span className={styles.pillCta}>{creative.ctaType}</span>
                </td>
                <td className={styles.tdChannels}>
                  {creative.channels.length > 0 ? (
                    <div className={styles.channelTags}>
                      {creative.channels.map((ch) => (
                        <span key={ch} className={styles.channelTag}>{ch}</span>
                      ))}
                      {creative.subChannels.length > 0 && (
                        <span className={styles.subChannelCount}>
                          +{creative.subChannels.length} sub
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {card.creatives.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✦</span>
            <p>Nenhum criativo nesta campanha</p>
            <button className={styles.addBtnSmall} onClick={handleAddCreative}>
              + Adicionar criativo
            </button>
          </div>
        )}
      </div>

      {/* Creative Detail Panel (slide-in) */}
      {selectedCreative && (
        <CreativeDetailPanel
          creative={selectedCreative}
          onClose={() => setSelectedCreative(null)}
          onUpdate={(updates: Partial<Creative>) => {
            onUpdateCreative(selectedCreative.id, updates);
            setSelectedCreative((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          hookTypes={hookTypes}
          formats={formats}
          ctaTypes={ctaTypes}
          onAddCustomOption={onAddCustomOption}
          onRemoveCustomOption={onRemoveCustomOption}
          trafegoSubs={trafegoSubs}
          organicoSubs={organicoSubs}
          onAddSubChannel={onAddSubChannel}
          onRemoveSubChannel={onRemoveSubChannel}
        />
      )}
    </div>
  );
}
