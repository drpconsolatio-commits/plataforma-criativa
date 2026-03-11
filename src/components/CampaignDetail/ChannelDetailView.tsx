"use client";

import styles from "./ChannelDetailView.module.css";
import { useState } from "react";
import type { Creative, CreativeWithCampaign, Channel } from "../Kanban/KanbanBoard";
import CreativeDetailPanel from "./CreativeDetailPanel";
import { getBadgeStyle } from "../../utils/colors";
import { ArrowLeft, Check, Megaphone, Leaf, FolderOpen } from "lucide-react";

interface Props {
  channelType: Channel;
  creatives: CreativeWithCampaign[];
  onBack: () => void;
  onUpdateCreative: (creativeId: string, updates: Partial<Creative>) => void;
  hookTypes: string[];
  formats: string[];
  ctaTypes: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  objectives: string[];
  trafegoSubs: string[];
  onAddSubChannel: (value: string) => void;
  onRemoveSubChannel: (value: string) => void;
}

const CHANNEL_META: Record<Channel, { icon: React.ReactNode; description: string }> = {
  "Tráfego Pago": {
    icon: <Megaphone size={28} />,
    description: "Facebook ADS • Google ADS • TikTok ADS",
  },
  "Orgânicos": {
    icon: <Leaf size={28} />,
    description: "Instagram • TikTok • YouTube",
  },
};

export default function ChannelDetailView({
  channelType,
  creatives,
  onBack,
  onUpdateCreative,
  hookTypes,
  formats,
  ctaTypes,
  onAddCustomOption,
  onRemoveCustomOption,
  trafegoSubs,
  onAddSubChannel,
  onRemoveSubChannel,
  objectives,
}: Props) {
  const [selectedCreative, setSelectedCreative] = useState<CreativeWithCampaign | null>(null);
  const [filter, setFilter] = useState("");
  const meta = CHANNEL_META[channelType];

  // Edição Nome Criativo
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [creativeNameVal, setCreativeNameVal] = useState("");

  const startEditingCreative = (cr: CreativeWithCampaign) => {
    setEditingCreativeId(cr.id);
    setCreativeNameVal(cr.name);
  };

  const handleSaveCreativeName = (cr: CreativeWithCampaign) => {
    const trimmed = creativeNameVal.trim();
    if (trimmed && trimmed !== cr.name) {
      onUpdateCreative(cr.id, { name: trimmed });
    }
    setEditingCreativeId(null);
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
  };

  const sorted = [...creatives].sort((a, b) => b.createdAt - a.createdAt);

  const filtered = sorted.filter((cr) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      cr.name.toLowerCase().includes(q) ||
      cr.campaignTitle.toLowerCase().includes(q) ||
      cr.hookType.toLowerCase().includes(q) ||
      cr.format.toLowerCase().includes(q) ||
      cr.ctaType.toLowerCase().includes(q) ||
      cr.subChannels.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Voltar ao Kanban
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <span className={styles.icon}>{meta.icon}</span>
            <h1 className={styles.title}>{channelType}</h1>
          </div>
          <div className={styles.meta}>
            <span className={styles.metaDesc}>{meta.description}</span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>{creatives.length} criativos</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.filterInput}
          placeholder="Filtrar por nome, campanha, sub-canal..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <span className={styles.filterCount}>
            {filtered.length} de {creatives.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thUpload}>Upload</th>
              <th className={styles.thCampaign}>Campanha</th>
              <th className={styles.thName}>Nome do Criativo</th>
              {channelType === "Tráfego Pago" ? (
                <th>Objetivo</th>
              ) : (
                <>
                  <th>Hook</th>
                  <th>Formato</th>
                  <th>CTA</th>
                </>
              )}
              <th>Sub-canais</th>
              <th>Drive</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((creative) => (
              <tr
                key={creative.id}
                className={`${styles.row} ${
                  selectedCreative?.id === creative.id ? styles.rowActive : ""
                }`}
                onClick={() => setSelectedCreative(creative)}
              >
                <td className={styles.tdUpload}>
                  <button
                    className={`${styles.uploadTag} ${
                      creative.uploadedToChannels ? styles.tagYes : styles.tagNo
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCreative(creative.id, {
                        uploadedToChannels: !creative.uploadedToChannels,
                      });
                    }}
                  >
                    {creative.uploadedToChannels ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        Subido <Check size={14} />
                      </span>
                    ) : "Não subido"}
                  </button>
                </td>
                <td className={styles.tdCampaign}>
                  <span className={styles.campaignPill}>{creative.campaignTitle}</span>
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
                {channelType === "Tráfego Pago" ? (
                  <td>
                    {creative.objective ? (
                      <span className={styles.pillObjective} style={getBadgeStyle(creative.objective)}>
                        {creative.objective}
                      </span>
                    ) : (
                      <span className={styles.empty}>—</span>
                    )}
                  </td>
                ) : (
                  <>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.hookType)}>{creative.hookType}</span>
                    </td>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.format)}>{creative.format}</span>
                    </td>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.ctaType)}>{creative.ctaType}</span>
                    </td>
                  </>
                )}
                <td className={styles.tdSubs}>
                  {creative.subChannels.length > 0 ? (
                    <div className={styles.subTags}>
                      {creative.subChannels.map((s) => (
                        <span key={s} className={styles.subTag} style={getBadgeStyle(s)}>{s}</span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
                <td className={styles.tdDrive}>
                  {creative.driveLink ? (
                    <a
                      href={creative.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.driveLink}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FolderOpen size={14} /> Abrir
                    </a>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {creatives.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{meta.icon}</span>
            <p>Nenhum criativo vinculado a {channelType}</p>
            <p className={styles.emptyHint}>
              Selecione &quot;{channelType}&quot; nos canais de um criativo para aparecer aqui
            </p>
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
          objectives={objectives}
          trafegoSubs={trafegoSubs}
          organicoSubs={trafegoSubs}
          onAddSubChannel={(ch, v) => onAddSubChannel(v)}
          onRemoveSubChannel={(ch, v) => onRemoveSubChannel(v)}
        />
      )}
    </div>
  );
}
