export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateMessagesTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((sum, message) => sum + estimateTokens(message.content), 0);
}
