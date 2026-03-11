"use client";

import { useAgent } from "@/context/AgentContext";
import AgentChatPanel from "./AgentChatPanel";

export default function AgentChatGlobal() {
  const { selectedAgent, isOpen, closeChat } = useAgent();

  if (!isOpen || !selectedAgent) return null;

  return (
    <AgentChatPanel
      agentId={selectedAgent.id}
      agentName={selectedAgent.name}
      agentRole={selectedAgent.role}
      onClose={closeChat}
    />
  );
}
