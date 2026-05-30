export const MESSAGE_REACTION_OPTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "👏", label: "Clap" },
] as const;

/** Quick picks shown in the hover toolbar (Slack-style). */
export const QUICK_MESSAGE_REACTIONS = ["👏", "👍", "😂"] as const;

export type MessageReactionEmoji =
  (typeof MESSAGE_REACTION_OPTIONS)[number]["emoji"];

export type MessageReactionsMap = Record<
  string,
  Record<string, number[]>
>;

export type ReactableMessageId = string;

export function normalizeMessageReactions(
  raw: MessageReactionsMap | null | undefined
): MessageReactionsMap {
  if (!raw || typeof raw !== "object") return {};
  return raw;
}

export function userReactedWith(
  reactions: MessageReactionsMap | undefined,
  messageId: string,
  emoji: string,
  userId: number | undefined
): boolean {
  if (!userId || !reactions?.[messageId]?.[emoji]) return false;
  return reactions[messageId][emoji].includes(userId);
}
