"use client";

import styles from "./KanbanBoard.module.css";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import ChannelColumn from "./ChannelColumn";
import NewCampaignModal from "../Modal/NewCampaignModal";
import CampaignDetailView from "../CampaignDetail/CampaignDetailView";
import ChannelDetailView from "../CampaignDetail/ChannelDetailView";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Plus, Undo2, Redo2 } from "lucide-react";
import { useUndoRedo } from "../../hooks/useUndoRedo";
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
export const DEFAULT_OBJECTIVES = ["captação", "conversão", "perpétuo", "app", "google"];

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
  materialBase?: string;
  generatedScripts?: { script: string; createdAt: number }[];
  objective?: string;
  contentType?: 'Vídeo' | 'Estático';
  designDirection?: string;
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
  materialBase: "",
  generatedScripts: [],
  objective: "",
  contentType: extra.contentType || undefined,
  designDirection: extra.designDirection || "",
  ...extra,
});

const initialColumns: Column[] = [
  { id: "inspiracoes", title: "Inspirações", colorVar: "var(--col-inspiracao)", cards: [] },
  { id: "roteirizacao", title: "Roteirização", colorVar: "var(--col-roteirizacao)", cards: [] },
  { id: "edicao", title: "Esteira de Edição", colorVar: "var(--col-edicao)", cards: [] },
  { id: "canais", title: "Esteira de Canais", colorVar: "var(--col-canais)", cards: [] },
  { id: "resultados", title: "Análise de Resultados", colorVar: "var(--col-resultados)", cards: [] },
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

  const {
    state: columns,
    setState: setColumns,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useUndoRedo<Column[]>(initialColumns);

  const fetchBoard = useCallback(async () => {
    const { data: camps } = await supabase.from('campaigns').select('*').order('order_index', { ascending: true });
    const { data: creats } = await supabase.from('creatives').select('*').order('created_at', { ascending: true });
    if (camps) {
      const creativesMap: Record<string, Creative[]> = {};
      creats?.forEach(cr => {
         if (!creativesMap[cr.campaign_id]) creativesMap[cr.campaign_id] = [];
         creativesMap[cr.campaign_id].push({
           id: cr.id,
           name: cr.name,
           hookType: cr.hook_type || '',
           marketingAngle: cr.marketing_angle || '',
           format: cr.format || '',
           ctaType: cr.cta_type || '',
           reference: cr.reference || '',
           notes: cr.notes || '',
           recordingDirection: cr.recording_direction || '',
           editingDirection: cr.editing_direction || '',
           channels: cr.channels || [],
           subChannels: cr.sub_channels || [],
           driveLink: cr.drive_link || '',
           uploadedToChannels: cr.uploaded_to_channels || false,
           status: cr.status || 'pending',
           createdAt: new Date(cr.created_at).getTime(),
           materialBase: cr.material_base || '',
           generatedScripts: cr.generated_scripts || [],
           objective: cr.objective || '',
            contentType: cr.content_type || undefined,
            designDirection: cr.design_direction || '',
          });
      });
      const newCols = initialColumns.map(col => ({
        ...col,
        cards: camps.filter(c => c.column_id === col.id).map(c => ({
          id: c.id,
          title: c.title,
          date: c.date,
          pinned: c.pinned || false,
          labels: c.labels || [],
          checklist: { roteirizacao: c.checklist_roteirizacao || false, edicao: c.checklist_edicao || false },
          creatives: creativesMap[c.id] || []
        })).sort((a,b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
      }));
      setColumns(newCols);
      reset(newCols);
    }
  }, [reset, setColumns]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoard();
    const channel = supabase.channel('board-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchBoard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creatives' }, fetchBoard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBoard]);
  const [activeCard, setActiveCard] = useState<CampaignCard | null>(null);
  const [activeColorVar, setActiveColorVar] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>({ type: "board" });

  // Custom options state (user can add new ones)
  const [customHookTypes, setCustomHookTypes] = useState<string[]>(() => loadState("kb_hooks", DEFAULT_HOOK_TYPES));
  const [customFormats, setCustomFormats] = useState<string[]>(() => loadState("kb_formats", DEFAULT_FORMATS));
  const [customCtaTypes, setCustomCtaTypes] = useState<string[]>(() => loadState("kb_ctas", DEFAULT_CTA_TYPES));
  const [customObjectives, setCustomObjectives] = useState<string[]>(() => loadState("kb_objectives", DEFAULT_OBJECTIVES));
  const [trafegoSubs, setTrafegoSubs] = useState<string[]>(() => loadState("kb_trafego_subs", DEFAULT_TRAFEGO_SUBS));
  const [organicoSubs, setOrganicoSubs] = useState<string[]>(() => loadState("kb_organico_subs", DEFAULT_ORGANICO_SUBS));

  const syncBoardToSupabase = useCallback(async (boardState: Column[]) => {
    // 1. Extrair todas as campanhas e criativos do estado
    const allCamps: any[] = [];
    const allCreatives: any[] = [];

    boardState.forEach((col) => {
      col.cards.forEach((card, idx) => {
        allCamps.push({
          id: card.id,
          title: card.title,
          date: card.date,
          column_id: col.id,
          pinned: card.pinned,
          checklist_roteirizacao: card.checklist.roteirizacao,
          checklist_edicao: card.checklist.edicao,
          labels: card.labels,
          order_index: idx
        });

        card.creatives.forEach((cr) => {
          allCreatives.push({
            id: cr.id,
            campaign_id: card.id,
            name: cr.name,
            hook_type: cr.hookType,
            marketing_angle: cr.marketingAngle,
            format: cr.format,
            cta_type: cr.ctaType,
            status: cr.status,
            channels: cr.channels,
            sub_channels: cr.subChannels,
            drive_link: cr.driveLink,
            uploaded_to_channels: cr.uploadedToChannels,
            reference: cr.reference,
            notes: cr.notes,
            recording_direction: cr.recordingDirection,
            editing_direction: cr.editingDirection,
            material_base: cr.materialBase,
            generated_scripts: cr.generatedScripts,
            objective: cr.objective,
            content_type: cr.contentType,
            design_direction: cr.designDirection
          });
        });
      });
    });

    // 2. Realizar UPSERT no Supabase
    if (allCamps.length > 0) {
      await supabase.from('campaigns').upsert(allCamps);
    }
    if (allCreatives.length > 0) {
      await supabase.from('creatives').upsert(allCreatives);
    }
  }, []);

  const handleUndo = useCallback(async () => {
    const previous = undo();
    if (previous) {
      await syncBoardToSupabase(previous);
    }
  }, [undo, syncBoardToSupabase]);

  const handleRedo = useCallback(async () => {
    const next = redo();
    if (next) {
      await syncBoardToSupabase(next);
    }
  }, [redo, syncBoardToSupabase]);
  const [boardFilter, setBoardFilter] = useState("");

  // --- Persist to localStorage ---
  useEffect(() => { localStorage.setItem("kb_hooks", JSON.stringify(customHookTypes)); }, [customHookTypes]);
  useEffect(() => { localStorage.setItem("kb_formats", JSON.stringify(customFormats)); }, [customFormats]);
  useEffect(() => { localStorage.setItem("kb_ctas", JSON.stringify(customCtaTypes)); }, [customCtaTypes]);
  useEffect(() => { localStorage.setItem("kb_objectives", JSON.stringify(customObjectives)); }, [customObjectives]);
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
  const updateChecklist = async (
    cardId: string,
    field: keyof Checklist,
    value: boolean
  ) => {
    let targetColId: string | null = null;
    const cardObj = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (cardObj && value) {
      if (field === "roteirizacao" && !cardObj.checklist.edicao) targetColId = "edicao";
      else if ((field === "roteirizacao" && cardObj.checklist.edicao) || (field === "edicao" && cardObj.checklist.roteirizacao)) targetColId = "canais";
    }
    const updates: Record<string, boolean | string> = { [`checklist_${field}`]: value };
    if (targetColId) updates.column_id = targetColId;
    supabase.from('campaigns').update(updates).eq('id', cardId).then();
    
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
  const updateCreative = async (
    campaignId: string,
    creativeId: string,
    updates: Partial<Creative>
  ) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.hookType !== undefined) dbUpdates.hook_type = updates.hookType;
    if (updates.marketingAngle !== undefined) dbUpdates.marketing_angle = updates.marketingAngle;
    if (updates.format !== undefined) dbUpdates.format = updates.format;
    if (updates.ctaType !== undefined) dbUpdates.cta_type = updates.ctaType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.channels !== undefined) dbUpdates.channels = updates.channels;
    if (updates.subChannels !== undefined) dbUpdates.sub_channels = updates.subChannels;
    if (updates.driveLink !== undefined) dbUpdates.drive_link = updates.driveLink;
    if (updates.uploadedToChannels !== undefined) dbUpdates.uploaded_to_channels = updates.uploadedToChannels;
    if (updates.reference !== undefined) dbUpdates.reference = updates.reference;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.recordingDirection !== undefined) dbUpdates.recording_direction = updates.recordingDirection;
    if (updates.editingDirection !== undefined) dbUpdates.editing_direction = updates.editingDirection;
    if (updates.materialBase !== undefined) dbUpdates.material_base = updates.materialBase;
    if (updates.generatedScripts !== undefined) dbUpdates.generated_scripts = updates.generatedScripts;
    if (updates.objective !== undefined) dbUpdates.objective = updates.objective;
    if (updates.contentType !== undefined) dbUpdates.content_type = updates.contentType;
    if (updates.designDirection !== undefined) dbUpdates.design_direction = updates.designDirection;
    if (Object.keys(dbUpdates).length > 0) supabase.from('creatives').update(dbUpdates).eq('id', creativeId).then();
  
    setColumns((prev) => {
      const newState = prev.map((col) => ({
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
      }));
      // Só commitamos no histórico se não forem campos de texto frequentes (notas, etc)
      // Ou deixamos o commit para quando o painel fechar? 
      // Para simplificar, vamos commitar aqui, mas Idealmente seria debounced.
      commit(newState);
      return newState;
    });
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

  const deleteCreative = async (campaignId: string, creativeId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este criativo?");
    if (!confirmed) return;

    // 1. Delete do Supabase
    await supabase.from('creatives').delete().eq('id', creativeId);

    // 2. Update estadolocal (Columns)
    setColumns((prev) => {
      const newState = prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === campaignId
            ? { ...card, creatives: card.creatives.filter((cr) => cr.id !== creativeId) }
            : card
        ),
      }));
      commit(newState);
      return newState;
    });

    // 3. Update view ativa se necessário
    if (activeView.type === "campaign" && activeView.card.id === campaignId) {
      setActiveView((prev) => {
        if (prev.type !== "campaign") return prev;
        return {
          ...prev,
          card: {
            ...prev.card,
            creatives: prev.card.creatives.filter((cr) => cr.id !== creativeId),
          },
        };
      });
    }
  };

  // --- Add creative to campaign ---
  const addCreativeToCampaign = async (campaignId: string, creative: Creative) => {
    supabase.from('creatives').insert({
       id: creative.id,
       campaign_id: campaignId,
       name: creative.name,
       hook_type: creative.hookType,
       marketing_angle: creative.marketingAngle,
       format: creative.format,
       cta_type: creative.ctaType,
       status: creative.status,
       channels: creative.channels,
       sub_channels: creative.subChannels,
       drive_link: creative.driveLink,
       uploaded_to_channels: creative.uploadedToChannels,
       reference: creative.reference,
       notes: creative.notes,
       recording_direction: creative.recordingDirection,
       editing_direction: creative.editingDirection,
       material_base: creative.materialBase || "",
       generated_scripts: creative.generatedScripts || [],
       objective: creative.objective || ""
    }).then();
  
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
  const addCustomOption = (type: "hook" | "format" | "cta" | "objective", value: string) => {
    if (type === "hook" && !customHookTypes.includes(value)) {
      setCustomHookTypes((prev) => [...prev, value]);
    } else if (type === "format" && !customFormats.includes(value)) {
      setCustomFormats((prev) => [...prev, value]);
    } else if (type === "cta" && !customCtaTypes.includes(value)) {
      setCustomCtaTypes((prev) => [...prev, value]);
    } else if (type === "objective" && !customObjectives.includes(value)) {
      setCustomObjectives((prev) => [...prev, value]);
    }
  };

  // --- Remove custom option ---
  const removeCustomOption = (type: "hook" | "format" | "cta" | "objective", value: string) => {
    if (type === "hook") {
      setCustomHookTypes((prev) => prev.filter((v) => v !== value));
    } else if (type === "format") {
      setCustomFormats((prev) => prev.filter((v) => v !== value));
    } else if (type === "cta") {
      setCustomCtaTypes((prev) => prev.filter((v) => v !== value));
    } else if (type === "objective") {
      setCustomObjectives((prev) => prev.filter((v) => v !== value));
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColorVar("");
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColAfterOver = findColumnByCardId(activeId);
    if (activeColAfterOver) {
      supabase.from('campaigns').update({ column_id: activeColAfterOver.id }).eq('id', activeId).then();
    }

    if (activeId === overId) return;

    const col = activeColAfterOver;
    if (!col) return;
    let overCol = findColumnByCardId(overId);
    if (!overCol) overCol = columns.find(c => c.id === overId);
    
    if (overCol && col.id === overCol.id) {
      setColumns((prev) => {
        const colIndex = prev.findIndex((c) => c.id === col.id);
        const oldIndex = prev[colIndex].cards.findIndex((c) => c.id === activeId);
        const newIndex = prev[colIndex].cards.findIndex((c) => c.id === overId);
        const newCols = [...prev];
        const newCards = arrayMove(newCols[colIndex].cards, oldIndex, newIndex);
        newCols[colIndex] = { ...newCols[colIndex], cards: newCards };
        
        newCards.forEach((c, idx) => {
           supabase.from('campaigns').update({ order_index: idx }).eq('id', c.id).then();
        });
        
        commit(newCols);
        return newCols;
      });
    } else if (overCol && col.id !== overCol.id) {
        // Se mudou de coluna, o commit já aconteceu no DragOver ou deve acontecer aqui?
        // DragOver usa setColumns (sem commit). Então devemos commitar aqui.
        commit(columns);
    }
  };

  // --- Delete card ---
  const deleteCard = async (cardId: string) => {
    supabase.from('campaigns').delete().eq('id', cardId).then();
    setColumns((prev) => {
      const newState = prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }));
      commit(newState);
      return newState;
    });
  };

  // --- Rename card ---
  const renameCard = async (cardId: string, newTitle: string) => {
    supabase.from('campaigns').update({ title: newTitle }).eq('id', cardId).then();
    setColumns((prev) => {
      const newState = prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, title: newTitle } : c
        ),
      }));
      commit(newState);
      return newState;
    });
    // Also update activeView if this card is open
    if (activeView.type === "campaign" && activeView.card.id === cardId) {
      setActiveView((prev) => {
        if (prev.type !== "campaign") return prev;
        return { ...prev, card: { ...prev.card, title: newTitle } };
      });
    }
  };

  // --- Pin/unpin card ---
  const togglePin = async (cardId: string) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ pinned: !card.pinned }).eq('id', cardId).then();
    }
    setColumns((prev) => {
      const newState = prev.map((col) => {
        const cardIndex = col.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return col;
        const updatedCards = col.cards.map((c) =>
          c.id === cardId ? { ...c, pinned: !c.pinned } : c
        );
        // Sort: pinned first, then maintain order
        updatedCards.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
        return { ...col, cards: updatedCards };
      });
      commit(newState);
      return newState;
    });
  };

  // --- Add label to card ---
  const addLabelToCard = async (cardId: string, label: Label) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ labels: [...card.labels, label] }).eq('id', cardId).then();
    }
    setColumns((prev) => {
      const newState = prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, labels: [...c.labels, label] } : c
        ),
      }));
      commit(newState);
      return newState;
    });
  };

  // --- Remove label from card ---
  const removeLabelFromCard = async (cardId: string, labelId: string) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ labels: card.labels.filter(l => l.id !== labelId) }).eq('id', cardId).then();
    }
    setColumns((prev) => {
      const newState = prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId
            ? { ...c, labels: c.labels.filter((l) => l.id !== labelId) }
            : c
        ),
      }));
      commit(newState);
      return newState;
    });
  };

  // --- Modal handler ---
  const handleCreateCampaign = async (data: {
    title: string;
    columnId: string;
    creativeNames: string[];
  }) => {
    const campId = crypto.randomUUID();
    const newCreatives = data.creativeNames.map((name, i) =>
      createCreative(crypto.randomUUID(), name, "", "", "", "", "pending")
    );
    const newCard: CampaignCard = {
      id: campId,
      title: data.title,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      checklist: { roteirizacao: false, edicao: false },
      pinned: false,
      labels: [],
      creatives: newCreatives as Creative[],
    };
    setColumns((prev) => {
      const newState = prev.map((col) =>
        col.id === data.columnId ? { ...col, cards: [...col.cards, newCard] } : col
      );
      commit(newState);
      return newState;
    });
    setShowModal(false);

    await supabase.from('campaigns').insert({
       id: campId,
       title: newCard.title,
       date: newCard.date,
       column_id: data.columnId,
       pinned: newCard.pinned,
       checklist_roteirizacao: newCard.checklist.roteirizacao,
       checklist_edicao: newCard.checklist.edicao,
       labels: newCard.labels
    });
    
    if (newCreatives.length > 0) {
       await supabase.from('creatives').insert(newCreatives.map(cr => ({
         id: cr.id,
         campaign_id: campId,
         name: cr.name,
         hook_type: cr.hookType,
         marketing_angle: cr.marketingAngle,
         format: cr.format,
         cta_type: cr.ctaType,
         status: cr.status,
         channels: cr.channels,
         sub_channels: cr.subChannels,
         drive_link: cr.driveLink,
         uploaded_to_channels: cr.uploadedToChannels,
         reference: cr.reference,
         notes: cr.notes,
         recording_direction: cr.recordingDirection,
         editing_direction: cr.editingDirection
       })));
    }
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
        onDeleteCreative={(creativeId: string) =>
          deleteCreative(activeView.card.id, creativeId)
        }
        hookTypes={customHookTypes}
        formats={customFormats}
        ctaTypes={customCtaTypes}
        onAddCustomOption={addCustomOption}
        onRemoveCustomOption={removeCustomOption}
        objectives={customObjectives}
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
        objectives={customObjectives}
        trafegoSubs={trafegoSubs}
        organicoSubs={organicoSubs}
        onAddSubChannel={(value: string) => addSubChannel(activeView.channelType, value)}
        onRemoveSubChannel={(value: string) => removeSubChannel(activeView.channelType, value)}
        onDeleteCreative={(creativeId: string) => {
          const campaignId = findCreativeCampaign(creativeId);
          if (campaignId) deleteCreative(campaignId, creativeId);
        }}
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (canUndo) {
          e.preventDefault();
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        if (canRedo) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, canUndo, canRedo]);

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
            <div style={{position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: '12px'}}>
              <div style={{position: 'relative', flex: 1}}>
                <Search size={16} color="var(--text-muted)" style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)'}} />
                <input
                  type="text"
                  className={styles.filterInput}
                  style={{paddingLeft: 34}}
                  placeholder="Filtrar cards e criativos..."
                  value={boardFilter}
                  onChange={(e) => setBoardFilter(e.target.value)}
                />
              </div>
              <div className={styles.undoRedoGroup}>
                <button 
                  className={styles.undoRedoBtn} 
                  disabled={!canUndo} 
                  onClick={handleUndo}
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button 
                  className={styles.undoRedoBtn} 
                  disabled={!canRedo} 
                  onClick={handleRedo}
                  title="Refazer (Ctrl+Y)"
                >
                  <Redo2 size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.addBtn} onClick={() => setShowModal(true)}>
              <span className={styles.addIcon}><Plus size={16} /></span>
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
