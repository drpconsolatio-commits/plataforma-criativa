import re

with open('src/components/Kanban/KanbanBoard.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { useState, useCallback, useEffect } from "react";',
    'import { useState, useCallback, useEffect } from "react";\nimport { supabase } from "../../lib/supabase";'
)

# 2. initialColumns
initial_cols_start = content.find('const initialColumns: Column[] = [')
initial_cols_end = content.find('];\n\n/* =============================================', initial_cols_start) + 2

new_initial_cols = '''const initialColumns: Column[] = [
  { id: "inspiracoes", title: "Inspirações", colorVar: "var(--col-inspiracao)", cards: [] },
  { id: "roteirizacao", title: "Roteirização", colorVar: "var(--col-roteirizacao)", cards: [] },
  { id: "edicao", title: "Esteira de Edição", colorVar: "var(--col-edicao)", cards: [] },
  { id: "canais", title: "Esteira de Canais", colorVar: "var(--col-canais)", cards: [] },
  { id: "resultados", title: "Análise de Resultados", colorVar: "var(--col-resultados)", cards: [] },
];'''

content = content[:initial_cols_start] + new_initial_cols + content[initial_cols_end:]

# 3. Component state initialization
state_init_old = '''  const [columns, setColumns] = useState<Column[]>(() => loadState("kb_columns", initialColumns));'''

state_init_new = '''  const [columns, setColumns] = useState<Column[]>(initialColumns);

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
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    const channel = supabase.channel('board-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchBoard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creatives' }, fetchBoard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBoard]);'''

content = content.replace(state_init_old, state_init_new)

# 4. Remove kb_columns persist
content = content.replace('  useEffect(() => { localStorage.setItem("kb_columns", JSON.stringify(columns)); }, [columns]);\n', '')

# Write back
with open('src/components/Kanban/KanbanBoard.tsx', 'w') as f:
    f.write(content)
