import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatSession {
  id: string;
  agent_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export function useAgentChats(agentId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. Carregar lista de todas as sessões passadas desse agente
  const loadSessions = useCallback(async () => {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from('agent_chats')
      .select('*')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false });
      
    if (!error && data) {
      setSessions(data);
    }
    setIsLoadingHistory(false);
  }, [agentId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 2. Carregar mensagens de uma sessão específica
  const loadMessages = async (chatId: string) => {
    setActiveSessionId(chatId);
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setMessages(data);
    }
  };

  // 3. Criar nova sessão de chat
  const createNewSession = async (agentName: string, firstMessageContent: string): Promise<string | null> => {
    const titleObj = firstMessageContent.substring(0, 40) + "...";
    
    const { data: chatData, error: chatError } = await supabase
      .from('agent_chats')
      .insert({ agent_id: agentId, agent_name: agentName, title: titleObj })
      .select('id')
      .single();

    if (chatError || !chatData) {
      console.error("Erro ao criar sessão", chatError);
      return null;
    }

    setActiveSessionId(chatData.id);
    setSessions(prev => [{ id: chatData.id, agent_id: agentId, title: titleObj, created_at: new Date().toISOString() }, ...prev]);
    setMessages([]); // reset local messages
    return chatData.id;
  };

  // 4. Salvar uma nova mensagem no banco
  const saveMessage = async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    const { data, error } = await supabase
      .from('agent_messages')
      .insert({ chat_id: sessionId, role, content })
      .select('*')
      .single();
      
    if (data && !error) {
      // Opcional: Atualizar a data do chat principal (updated_at)
      await supabase.from('agent_chats').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
      return data;
    }
    return null;
  };

  return {
    sessions,
    activeSessionId,
    messages,
    isLoadingHistory,
    loadMessages,
    createNewSession,
    saveMessage,
    setActiveSessionId,
    setMessages
  };
}
