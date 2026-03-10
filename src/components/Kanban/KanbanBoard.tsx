"use client";

import styles from "./KanbanBoard.module.css";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import ChannelColumn from "./ChannelColumn";
import NewCampaignModal from "../Modal/NewCampaignModal";
import CampaignDetailView from "../CampaignDetail/CampaignDetailView";
import ChannelDetailView from "../CampaignDetail/ChannelDetailView";
import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

/* =============================================
   DATA MODEL
   ============================================= */

// Default options (user can add more)
export const DEFAULT_HOOK_TYPES = ["Visual", "Talkinghead", "Broll", "Texto"];
export const DEFAULT_FORMATS = ["Talkinghead", "B-roll", "Atuação", "Trend", "Institucional"];
export const DEFAULT_CTA_TYPES = ["Agressivo", "Suave", "Emocional", "FOMO"];

export const CHANNELS = ["Tráfego Pago", "Orgânicos"] as const;
export type Channel = (typeof CHANNELS)[number];

// Sub-channels per pipeline
export const DEFAULT_TRAFEGO_SUBS = ["Facebook ADS", "Google ADS", "TikTok ADS"];
export const DEFAULT_ORGANICO_SUBS = ["Instagram", "TikTok"];

export interface ChannelWithSubs {
  channel: Channel;
  subChannels: string[];
}

export interface Checklist {
  roteirizacao: boolean;
  edicao: boolean;
}

export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface Creative {
  id: string;
  name: string;
  hookType: string;
  marketingAngle: string;
  format: string;
  ctaType: string;
  reference: string;
  notes: string;
  recordingDirection: string;
  editingDirection: string;
  channels: Channel[];
  subChannels: string[];
  driveLink: string;
  uploadedToChannels: boolean;
  status: "pending" | "done";
  createdAt: number;
}

export interface CreativeWithCampaign extends Creative {
  campaignTitle: string;
  campaignId: string;
}

export interface CampaignCard {
  id: string;
  title: string;
  date: string;
  checklist: Checklist;
  creatives: Creative[];
  pinned: boolean;
  labels: Label[];
}

export interface Column {
  id: string;
  title: string;
  colorVar: string;
  cards: CampaignCard[];
}

/* =============================================
   SAMPLE DATA
   ============================================= */

const createCreative = (
  id: string,
  name: string,
  hookType: string,
  marketingAngle: string,
  format: string,
  ctaType: string,
  status: "pending" | "done",
  channels: Channel[] = [],
  extra: Partial<Creative> = {}
): Creative => ({
  id,
  name,
  hookType,
  marketingAngle,
  format,
  ctaType,
  reference: "",
  notes: "",
  recordingDirection: "",
  editingDirection: "",
  channels,
  subChannels: [],
  driveLink: "",
  uploadedToChannels: false,
  status,
  createdAt: Date.now() - Math.random() * 100000,
  ...extra,
});

const initialColumns: Column[] = [
  {
    id: "inspiracoes",
    title: "Inspirações",
    colorVar: "var(--col-inspiracao)",
    cards: [
      {
        id: "c1",
        title: "Campanha Verão 2026",
        date: "09 Mar",
        checklist: { roteirizacao: false, edicao: false },
        pinned: false,
        labels: [],
        creatives: [
          createCreative("cr1", "Referência TikTok — Beach Vibes", "Visual", "Lifestyle praia", "B-roll", "Suave", "done"),
          createCreative("cr2", "Pinterest Moodboard Tropical", "Broll", "Estética tropical", "Institucional", "Emocional", "done"),
          createCreative("cr3", 'Benchmark concorrente "SolBrasil"', "Talkinghead", "Comparação com concorrente", "Talkinghead", "Agressivo", "pending"),
          createCreative("cr4", "Paleta de cores verão", "Visual", "Branding sazonal", "Institucional", "Suave", "pending"),
        ],
      },
    ],
  },
  {
    id: "roteirizacao",
    title: "Roteirização",
    colorVar: "var(--col-roteirizacao)",
    cards: [
      {
        id: "c2",
        title: "Lançamento Coleção Inverno",
        date: "07 Mar",
        checklist: { roteirizacao: false, edicao: false },
        pinned: false,
        labels: [],
        creatives: [
          createCreative("cr5", "Hook Visual — Antes & Depois", "Visual", "Transformação visual", "Talkinghead", "Agressivo", "done"),
          createCreative("cr6", "Talkinghead + Broll — Storytelling", "Talkinghead", "Narrativa pessoal autêntica", "B-roll", "Emocional", "pending"),
          createCreative("cr7", "CTA Agressivo — Oferta relâmpago", "Texto", "Urgência e escassez", "Trend", "FOMO", "pending"),
        ],
      },
      {
        id: "c3",
        title: "Dia das Mães 2026",
        date: "06 Mar",
        checklist: { roteirizacao: false, edicao: false },
        pinned: false,
        labels: [],
        creatives: [
          createCreative("cr8", "Roteiro emocional — presenteie", "Talkinghead", "Emocional familiar", "Talkinghead", "Emocional", "pending"),
          createCreative("cr9", "Roteiro combo kit especial", "Visual", "Oferta kit combo", "B-roll", "Agressivo", "pending"),
        ],
      },
    ],
  },
  {
    id: "edicao",
    title: "Esteira de Edição",
    colorVar: "var(--col-edicao)",
    cards: [
      {
        id: "c4",
        title: "Reels Março — Produto X",
        date: "05 Mar",
        checklist: { roteirizacao: true, edicao: false },
        pinned: false,
        labels: [],
        creatives: [
          createCreative("cr10", "Corte dinâmico — hook 3s", "Visual", "Impacto rápido primeiros segundos", "Trend", "Agressivo", "done"),
          createCreative("cr11", "Legendas + efeitos sonoros", "Broll", "Entretenimento visual", "B-roll", "Suave", "pending"),
          createCreative("cr12", "Versão quadrada para Feed", "Visual", "Reaproveitamento multi-formato", "Institucional", "Suave", "pending"),
        ],
      },
    ],
  },
  {
    id: "canais",
    title: "Esteira de Canais",
    colorVar: "var(--col-canais)",
    cards: [
      {
        id: "c5",
        title: "Campanha Meta — Fevereiro",
        date: "03 Mar",
        checklist: { roteirizacao: true, edicao: true },
        pinned: false,
        labels: [{ id: "l1", text: "Meta ADS", color: "#7c5cfc" }],
        creatives: [
          createCreative("cr13", "Criativo Feed — Imagem estática", "Visual", "Produto destaque hero", "Institucional", "Suave", "done", ["Tráfego Pago", "Orgânicos"], { driveLink: "https://drive.google.com/example", uploadedToChannels: true }),
          createCreative("cr14", "Criativo Stories — Vídeo 15s", "Talkinghead", "Testemunho real cliente", "Talkinghead", "Emocional", "done", ["Orgânicos"], { driveLink: "https://drive.google.com/example2", uploadedToChannels: true }),
          createCreative("cr15", "Criativo Reels — Vídeo 30s", "Broll", "Demonstração produto em uso", "B-roll", "Agressivo", "done", ["Orgânicos", "Tráfego Pago"], { driveLink: "https://drive.google.com/example3", uploadedToChannels: false }),
          createCreative("cr16", "Criativo Google — Banner", "Visual", "Display awareness", "Institucional", "Suave", "done", ["Tráfego Pago"], { driveLink: "https://drive.google.com/example4", uploadedToChannels: true }),
          createCreative("cr17", "Criativo TikTok — Vídeo 60s", "Talkinghead", "Storytelling longo formato", "Trend", "FOMO", "pending", ["Tráfego Pago"]),
        ],
      },
    ],
  },
  {
    id: "resultados",
    title: "Análise de Resultados",
    colorVar: "var(--col-resultados)",
    cards: [],
  },
];

/* =============================================
   KANBAN BOARD COMPONENT
   ============================================= */

type ActiveView =
  | { type: "board" }
  | { type: "campaign"; card: CampaignCard; columnId: string }
  | { type: "channel"; channelType: Channel };

export default function KanbanBoard() {
  // --- localStorage helpers ---
  const loadState = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [columns, setColumns] = useState<Column[]>(() => loadState("kb_columns", initialColumns));
  const [activeCard, setActiveCard] = useState<CampaignCard | null>(null);
  const [activeColorVar, setActiveColorVar] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>({ type: "board" });

  // Custom options state (user can add new ones)
  const [customHookTypes, setCustomHookTypes] = useState<string[]>(() => loadState("kb_hooks", DEFAULT_HOOK_TYPES));
  const [customFormats, setCustomFormats] = useState<string[]>(() => loadState("kb_formats", DEFAULT_FORMATS));
  const [customCtaTypes, setCustomCtaTypes] = useState<string[]>(() => loadState("kb_ctas", DEFAULT_CTA_TYPES));
  const [trafegoSubs, setTrafegoSubs] = useState<string[]>(() => loadState("kb_trafego_subs", DEFAULT_TRAFEGO_SUBS));
  const [organicoSubs, setOrganicoSubs] = useState<string[]>(() => loadState("kb_organico_subs", DEFAULT_ORGANICO_SUBS));
  const [boardFilter, setBoardFilter] = useState("");

  // --- Persist to localStorage ---
  useEffect(() => { localStorage.setItem("kb_columns", JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem("kb_hooks", JSON.stringify(customHookTypes)); }, [customHookTypes]);
  useEffect(() => { localStorage.setItem("kb_formats", JSON.stringify(customFormats)); }, [customFormats]);
  useEffect(() => { localStorage.setItem("kb_ctas", JSON.stringify(customCtaTypes)); }, [customCtaTypes]);
  useEffect(() => { localStorage.setItem("kb_trafego_subs", JSON.stringify(trafegoSubs)); }, [trafegoSubs]);
  useEffect(() => { localStorage.setItem("kb_organico_subs", JSON.stringify(organicoSubs)); }, [organicoSubs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // --- Open campaign fullscreen ---
  const openCampaign = (card: CampaignCard, columnId: string) => {
    setActiveView({ type: "campaign", card, columnId });
  };

  const closeCampaign = () => {
    setActiveView({ type: "board" });
  };

  // --- Update checklist and auto-move ---
  const updateChecklist = (
    cardId: string,
    field: keyof Checklist,
    value: boolean
  ) => {
    setColumns((prev) => {
      const newCols = prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId
            ? { ...card, checklist: { ...card.checklist, [field]: value } }
            : card
        ),
      }));

      // Auto-move logic
      if (value) {
        let sourceColIndex = -1;
        let cardObj: CampaignCard | null = null;

        for (let i = 0; i < newCols.length; i++) {
          const found = newCols[i].cards.find((c) => c.id === cardId);
          if (found) {
            sourceColIndex = i;
            cardObj = { ...found, checklist: { ...found.checklist, [field]: value } };
            break;
          }
        }

        if (!cardObj || sourceColIndex === -1) return newCols;

        // Auto-move: Roteirização ✓ → Edição, Both ✓ → Canais
        let targetColId: string | null = null;
        if (field === "roteirizacao" && !cardObj.checklist.edicao) {
          targetColId = "edicao";
        } else if (cardObj.checklist.roteirizacao && cardObj.checklist.edicao) {
          targetColId = "canais";
        }

        if (targetColId) {
          const targetColIndex = newCols.findIndex((c) => c.id === targetColId);
          if (targetColIndex !== -1 && targetColIndex !== sourceColIndex) {
            newCols[sourceColIndex] = {
              ...newCols[sourceColIndex],
              cards: newCols[sourceColIndex].cards.filter((c) => c.id !== cardId),
            };
            newCols[targetColIndex] = {
              ...newCols[targetColIndex],
              cards: [cardObj, ...newCols[targetColIndex].cards],
            };
          }
        }
      }

      return newCols;
    });
  };

  // --- Update a creative in state ---
  const updateCreative = (
    campaignId: string,
    creativeId: string,
    updates: Partial<Creative>
  ) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === campaignId
            ? {
                ...card,
                creatives: card.creatives.map((cr) =>
                  cr.id === creativeId ? { ...cr, ...updates } : cr
                ),
              }
            : card
        ),
      }))
    );
    if (activeView.type === "campaign" && activeView.card.id === campaignId) {
      setActiveView((prev) => {
        if (prev.type !== "campaign") return prev;
        return {
          ...prev,
          card: {
            ...prev.card,
            creatives: prev.card.creatives.map((cr) =>
              cr.id === creativeId ? { ...cr, ...updates } : cr
            ),
          },
        };
      });
    }
  };

  // --- Add creative to campaign ---
  const addCreativeToCampaign = (campaignId: string, creative: Creative) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === campaignId
            ? { ...card, creatives: [...card.creatives, creative] }
            : card
        ),
      }))
    );
    if (activeView.type === "campaign" && activeView.card.id === campaignId) {
      setActiveView((prev) => {
        if (prev.type !== "campaign") return prev;
        return {
          ...prev,
          card: {
            ...prev.card,
            creatives: [...prev.card.creatives, creative],
          },
        };
      });
    }
  };

  // --- Get all creatives that have channel selections (with campaign info) ---
  const getAllChannelCreatives = useCallback((): CreativeWithCampaign[] => {
    const allCreatives: CreativeWithCampaign[] = [];
    columns.forEach((col) => {
      col.cards.forEach((card) => {
        card.creatives.forEach((cr) => {
          if (cr.channels.length > 0) {
            allCreatives.push({ ...cr, campaignTitle: card.title, campaignId: card.id });
          }
        });
      });
    });
    return allCreatives.sort((a, b) => b.createdAt - a.createdAt);
  }, [columns]);

  // --- Find creative's parent campaign ---
  const findCreativeCampaign = (creativeId: string): string | null => {
    for (const col of columns) {
      for (const card of col.cards) {
        if (card.creatives.some((c) => c.id === creativeId)) {
          return card.id;
        }
      }
    }
    return null;
  };

  // --- Add custom option ---
  const addCustomOption = (type: "hook" | "format" | "cta", value: string) => {
    if (type === "hook" && !customHookTypes.includes(value)) {
      setCustomHookTypes((prev) => [...prev, value]);
    } else if (type === "format" && !customFormats.includes(value)) {
      setCustomFormats((prev) => [...prev, value]);
    } else if (type === "cta" && !customCtaTypes.includes(value)) {
      setCustomCtaTypes((prev) => [...prev, value]);
    }
  };

  // --- Remove custom option ---
  const removeCustomOption = (type: "hook" | "format" | "cta", value: string) => {
    if (type === "hook") {
      setCustomHookTypes((prev) => prev.filter((v) => v !== value));
    } else if (type === "format") {
      setCustomFormats((prev) => prev.filter((v) => v !== value));
    } else if (type === "cta") {
      setCustomCtaTypes((prev) => prev.filter((v) => v !== value));
    }
  };

  // --- Sub-channel management ---
  const addSubChannel = (channel: Channel, value: string) => {
    if (channel === "Tráfego Pago" && !trafegoSubs.includes(value)) {
      setTrafegoSubs((prev) => [...prev, value]);
    } else if (channel === "Orgânicos" && !organicoSubs.includes(value)) {
      setOrganicoSubs((prev) => [...prev, value]);
    }
  };

  const removeSubChannel = (channel: Channel, value: string) => {
    if (channel === "Tráfego Pago") {
      setTrafegoSubs((prev) => prev.filter((v) => v !== value));
    } else if (channel === "Orgânicos") {
      setOrganicoSubs((prev) => prev.filter((v) => v !== value));
    }
  };

  // --- DnD Helpers ---
  const findColumnByCardId = useCallback(
    (cardId: string): Column | undefined => {
      return columns.find((col) => col.cards.some((c) => c.id === cardId));
    },
    [columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumnByCardId(active.id as string);
    if (col) {
      const card = col.cards.find((c) => c.id === active.id);
      if (card) {
        setActiveCard(card);
        setActiveColorVar(col.colorVar);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnByCardId(activeId);
    let overCol = findColumnByCardId(overId);
    if (!overCol) overCol = columns.find((col) => col.id === overId);
    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const activeColIndex = prev.findIndex((c) => c.id === activeCol.id);
      const overColIndex = prev.findIndex((c) => c.id === overCol.id);
      const card = prev[activeColIndex].cards.find((c) => c.id === activeId)!;
      const newCols = [...prev];
      newCols[activeColIndex] = {
        ...newCols[activeColIndex],
        cards: newCols[activeColIndex].cards.filter((c) => c.id !== activeId),
      };
      const overCardIndex = newCols[overColIndex].cards.findIndex((c) => c.id === overId);
      const insertIndex = overCardIndex >= 0 ? overCardIndex : newCols[overColIndex].cards.length;
      const newTargetCards = [...newCols[overColIndex].cards];
      newTargetCards.splice(insertIndex, 0, card);
      newCols[overColIndex] = { ...newCols[overColIndex], cards: newTargetCards };
      return newCols;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColorVar("");
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const col = findColumnByCardId(activeId);
    if (!col) return;
    const overCol = findColumnByCardId(overId);
    if (overCol && col.id === overCol.id) {
      setColumns((prev) => {
        const colIndex = prev.findIndex((c) => c.id === col.id);
        const oldIndex = prev[colIndex].cards.findIndex((c) => c.id === activeId);
        const newIndex = prev[colIndex].cards.findIndex((c) => c.id === overId);
        const newCols = [...prev];
        newCols[colIndex] = {
          ...newCols[colIndex],
          cards: arrayMove(newCols[colIndex].cards, oldIndex, newIndex),
        };
        return newCols;
      });
    }
  };

  // --- Delete card ---
  const deleteCard = (cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );
  };

  // --- Rename card ---
  const renameCard = (cardId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, title: newTitle } : c
        ),
      }))
    );
    // Also update activeView if this card is open
    if (activeView.type === "campaign" && activeView.card.id === cardId) {
      setActiveView((prev) => {
        if (prev.type !== "campaign") return prev;
        return { ...prev, card: { ...prev.card, title: newTitle } };
      });
    }
  };

  // --- Pin/unpin card ---
  const togglePin = (cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        const cardIndex = col.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return col;
        const updatedCards = col.cards.map((c) =>
          c.id === cardId ? { ...c, pinned: !c.pinned } : c
        );
        // Sort: pinned first, then maintain order
        updatedCards.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
        return { ...col, cards: updatedCards };
      })
    );
  };

  // --- Add label to card ---
  const addLabelToCard = (cardId: string, label: Label) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, labels: [...c.labels, label] } : c
        ),
      }))
    );
  };

  // --- Remove label from card ---
  const removeLabelFromCard = (cardId: string, labelId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId
            ? { ...c, labels: c.labels.filter((l) => l.id !== labelId) }
            : c
        ),
      }))
    );
  };

  // --- Modal handler ---
  const handleCreateCampaign = (data: {
    title: string;
    columnId: string;
    creativeNames: string[];
  }) => {
    const newCard: CampaignCard = {
      id: `c${Date.now()}`,
      title: data.title,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      checklist: { roteirizacao: false, edicao: false },
      pinned: false,
      labels: [],
      creatives: data.creativeNames.map((name, i) =>
        createCreative(`cr${Date.now()}-${i}`, name, "Visual", "", "Talkinghead", "Suave", "pending")
      ),
    };
    setColumns((prev) =>
      prev.map((col) =>
        col.id === data.columnId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
    setShowModal(false);
  };

  /* ---- CAMPAIGN DETAIL VIEW ---- */
  if (activeView.type === "campaign") {
    return (
      <CampaignDetailView
        card={activeView.card}
        columnId={activeView.columnId}
        onBack={closeCampaign}
        onRenameCampaign={renameCard}
        onUpdateCreative={(creativeId: string, updates: Partial<Creative>) =>
          updateCreative(activeView.card.id, creativeId, updates)
        }
        onAddCreative={(creative: Creative) =>
          addCreativeToCampaign(activeView.card.id, creative)
        }
        hookTypes={customHookTypes}
        formats={customFormats}
        ctaTypes={customCtaTypes}
        onAddCustomOption={addCustomOption}
        onRemoveCustomOption={removeCustomOption}
        trafegoSubs={trafegoSubs}
        organicoSubs={organicoSubs}
        onAddSubChannel={addSubChannel}
        onRemoveSubChannel={removeSubChannel}
      />
    );
  }

  /* ---- CHANNEL DETAIL VIEW ---- */
  if (activeView.type === "channel") {
    const channelCreatives = getAllChannelCreatives().filter((cr) =>
      cr.channels.includes(activeView.channelType)
    );
    return (
      <ChannelDetailView
        channelType={activeView.channelType}
        creatives={channelCreatives}
        onBack={() => setActiveView({ type: "board" })}
        onUpdateCreative={(creativeId: string, updates: Partial<Creative>) => {
          const campaignId = findCreativeCampaign(creativeId);
          if (campaignId) updateCreative(campaignId, creativeId, updates);
        }}
        hookTypes={customHookTypes}
        formats={customFormats}
        ctaTypes={customCtaTypes}
        onAddCustomOption={addCustomOption}
        onRemoveCustomOption={removeCustomOption}
        trafegoSubs={activeView.channelType === "Tráfego Pago" ? trafegoSubs : organicoSubs}
        onAddSubChannel={(value: string) => addSubChannel(activeView.channelType, value)}
        onRemoveSubChannel={(value: string) => removeSubChannel(activeView.channelType, value)}
      />
    );
  }

  /* ---- KANBAN BOARD VIEW ---- */
  const regularColumns = columns.filter((c) => c.id !== "canais");
  const canaisColumn = columns.find((c) => c.id === "canais");

  // Insert canais column before resultados
  const orderedColumns: (Column | "canais")[] = [];
  regularColumns.forEach((col) => {
    if (col.id === "resultados" && canaisColumn) {
      orderedColumns.push("canais");
    }
    orderedColumns.push(col);
  });
  // If resultados doesn't exist, add canais at the end
  if (canaisColumn && !orderedColumns.includes("canais")) {
    orderedColumns.push("canais");
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.boardWrapper}>
        {/* Header */}
        <div className={styles.header}>
        <div className={styles.headerLeft}>
            <h1 className={styles.title}>Criações</h1>
            <span className={styles.subtitle}>Painel Kanban</span>
          </div>
          <div className={styles.headerCenter}>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="🔍 Filtrar cards e criativos..."
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
            />
          </div>
          <div className={styles.headerRight}>
            <button className={styles.addBtn} onClick={() => setShowModal(true)}>
              <span className={styles.addIcon}>+</span>
              Nova Campanha
            </button>
          </div>
        </div>

        {/* Board */}
        <div className={styles.board}>
          {orderedColumns.map((item, index) => {
            if (item === "canais" && canaisColumn) {
              return (
                <ChannelColumn
                  key={canaisColumn.id}
                  column={canaisColumn}
                  channelCreatives={getAllChannelCreatives()}
                  index={index}
                  onOpenChannel={(channelType: Channel) =>
                    setActiveView({ type: "channel", channelType })
                  }
                />
              );
            }
            const col = item as Column;
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                index={index}
                onOpenCampaign={openCampaign}
                onUpdateChecklist={updateChecklist}
                onDeleteCard={deleteCard}
                onTogglePin={togglePin}
                onAddLabel={addLabelToCard}
                onRemoveLabel={removeLabelFromCard}
                onRenameCard={renameCard}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className={styles.dragOverlay}>
            <KanbanCard
              card={activeCard}
              colorVar={activeColorVar}
              index={0}
              onOpenFullscreen={() => {}}
              isDragOverlay
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* New Campaign Modal */}
      {showModal && (
        <NewCampaignModal
          columns={columns.filter((c) => c.id !== "canais")}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateCampaign}
        />
      )}
    </DndContext>
  );
}
