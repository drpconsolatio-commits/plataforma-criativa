import os

file_path = "src/components/Kanban/KanbanBoard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. updateChecklist
old_updateChecklist = '''  // --- Update checklist and auto-move ---
  const updateChecklist = (
    cardId: string,
    field: keyof Checklist,
    value: boolean
  ) => {'''
new_updateChecklist = '''  // --- Update checklist and auto-move ---
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
    const updates: any = { [`checklist_${field}`]: value };
    if (targetColId) updates.column_id = targetColId;
    supabase.from('campaigns').update(updates).eq('id', cardId).then();
    '''
content = content.replace(old_updateChecklist, new_updateChecklist)

# 2. updateCreative
old_updateCreative = '''  // --- Update a creative in state ---
  const updateCreative = (
    campaignId: string,
    creativeId: string,
    updates: Partial<Creative>
  ) => {'''
new_updateCreative = '''  // --- Update a creative in state ---
  const updateCreative = async (
    campaignId: string,
    creativeId: string,
    updates: Partial<Creative>
  ) => {
    const dbUpdates: any = {};
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
    if (Object.keys(dbUpdates).length > 0) supabase.from('creatives').update(dbUpdates).eq('id', creativeId).then();
  '''
content = content.replace(old_updateCreative, new_updateCreative)

# 3. addCreativeToCampaign
old_addCreative = '''  // --- Add creative to campaign ---
  const addCreativeToCampaign = (campaignId: string, creative: Creative) => {'''
new_addCreative = '''  // --- Add creative to campaign ---
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
       editing_direction: creative.editingDirection
    }).then();
  '''
content = content.replace(old_addCreative, new_addCreative)

# 4. handleDragEnd
old_handleDragEnd = '''  const handleDragEnd = (event: DragEndEvent) => {
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
  };'''

new_handleDragEnd = '''  const handleDragEnd = async (event: DragEndEvent) => {
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
        
        return newCols;
      });
    }
  };'''
content = content.replace(old_handleDragEnd, new_handleDragEnd)

# 5. deleteCard
old_deleteCard = '''  // --- Delete card ---
  const deleteCard = (cardId: string) => {'''
new_deleteCard = '''  // --- Delete card ---
  const deleteCard = async (cardId: string) => {
    supabase.from('campaigns').delete().eq('id', cardId).then();'''
content = content.replace(old_deleteCard, new_deleteCard)

# 6. renameCard
old_renameCard = '''  // --- Rename card ---
  const renameCard = (cardId: string, newTitle: string) => {'''
new_renameCard = '''  // --- Rename card ---
  const renameCard = async (cardId: string, newTitle: string) => {
    supabase.from('campaigns').update({ title: newTitle }).eq('id', cardId).then();'''
content = content.replace(old_renameCard, new_renameCard)

# 7. togglePin
old_togglePin = '''  // --- Pin/unpin card ---
  const togglePin = (cardId: string) => {'''
new_togglePin = '''  // --- Pin/unpin card ---
  const togglePin = async (cardId: string) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ pinned: !card.pinned }).eq('id', cardId).then();
    }'''
content = content.replace(old_togglePin, new_togglePin)

# 8. addLabelToCard
old_addLabelToCard = '''  // --- Add label to card ---
  const addLabelToCard = (cardId: string, label: Label) => {'''
new_addLabelToCard = '''  // --- Add label to card ---
  const addLabelToCard = async (cardId: string, label: Label) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ labels: [...card.labels, label] }).eq('id', cardId).then();
    }'''
content = content.replace(old_addLabelToCard, new_addLabelToCard)

# 9. removeLabelFromCard
old_removeLabelFromCard = '''  // --- Remove label from card ---
  const removeLabelFromCard = (cardId: string, labelId: string) => {'''
new_removeLabelFromCard = '''  // --- Remove label from card ---
  const removeLabelFromCard = async (cardId: string, labelId: string) => {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (card) {
       supabase.from('campaigns').update({ labels: card.labels.filter(l => l.id !== labelId) }).eq('id', cardId).then();
    }'''
content = content.replace(old_removeLabelFromCard, new_removeLabelFromCard)

# 10. handleCreateCampaign
old_handleCreateCampaign = '''  // --- Modal handler ---
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
  };'''

new_handleCreateCampaign = '''  // --- Modal handler ---
  const handleCreateCampaign = async (data: {
    title: string;
    columnId: string;
    creativeNames: string[];
  }) => {
    const campId = crypto.randomUUID();
    const newCreatives = data.creativeNames.map((name, i) =>
      createCreative(crypto.randomUUID(), name, "Visual", "", "Talkinghead", "Suave", "pending")
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
    setColumns((prev) =>
      prev.map((col) =>
        col.id === data.columnId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
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
  };'''
content = content.replace(old_handleCreateCampaign, new_handleCreateCampaign)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
