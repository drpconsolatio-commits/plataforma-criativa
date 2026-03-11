"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface AgentContextType {
  selectedAgent: Agent | null;
  isOpen: boolean;
  targetCreativeId: string | null;
  openChat: (agent: Agent, creativeId?: string) => void;
  closeChat: () => void;
  setTargetCreative: (id: string | null) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [targetCreativeId, setTargetCreativeId] = useState<string | null>(null);

  const openChat = (agent: Agent, creativeId?: string) => {
    setSelectedAgent(agent);
    setIsOpen(true);
    if (creativeId) {
      setTargetCreativeId(creativeId);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const setTargetCreative = (id: string | null) => {
    setTargetCreativeId(id);
  };

  return (
    <AgentContext.Provider
      value={{
        selectedAgent,
        isOpen,
        targetCreativeId,
        openChat,
        closeChat,
        setTargetCreative,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
