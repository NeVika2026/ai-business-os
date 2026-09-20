export type UnmatchedInboundMessage = {
  eventId: string;
  channel: 'whatsapp' | 'sms';
  phone: string;
  senderName: string | null;
  text: string;
  at: string;
  ambiguousDuplicateContact?: boolean;
  duplicateCandidateIds?: string[];
};

export type UnmatchedInboundConversation = UnmatchedInboundMessage & {
  messageCount: number;
  channels: Array<UnmatchedInboundMessage['channel']>;
};

// Keep the same phone matching rule as the inbound webhook and existing CRM.
export function normalizeContactPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function groupUnmatchedInbound(
  messages: UnmatchedInboundMessage[],
): UnmatchedInboundConversation[] {
  const conversations = new Map<string, UnmatchedInboundConversation>();

  for (const message of [...messages].sort((a, b) => b.at.localeCompare(a.at))) {
    const key = normalizeContactPhone(message.phone) || message.eventId;
    const existing = conversations.get(key);

    if (!existing) {
      conversations.set(key, {
        ...message,
        messageCount: 1,
        channels: [message.channel],
      });
      continue;
    }

    existing.messageCount += 1;
    existing.senderName ||= message.senderName;
    existing.ambiguousDuplicateContact ||= message.ambiguousDuplicateContact;
    if (message.duplicateCandidateIds?.length) {
      existing.duplicateCandidateIds = [
        ...new Set([...(existing.duplicateCandidateIds ?? []), ...message.duplicateCandidateIds]),
      ];
    }
    if (!existing.channels.includes(message.channel)) {
      existing.channels.push(message.channel);
    }
  }

  return [...conversations.values()];
}
