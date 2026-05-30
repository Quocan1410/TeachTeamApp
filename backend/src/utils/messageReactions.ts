import type { Application } from "../entities/Application";
import { correspondenceMessageExists } from "./correspondenceMessages";

export const MESSAGE_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"] as const;
export type MessageReactionEmoji = (typeof MESSAGE_REACTION_EMOJIS)[number];

export type MessageReactionsMap = Record<
    string,
    Record<string, number[]>
>;

export function normalizeMessageReactions(
    raw: unknown
): MessageReactionsMap {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }
    const out: MessageReactionsMap = {};
    for (const [messageId, byEmoji] of Object.entries(
        raw as Record<string, unknown>
    )) {
        if (!byEmoji || typeof byEmoji !== "object" || Array.isArray(byEmoji)) {
            continue;
        }
        const emojiMap: Record<string, number[]> = {};
        for (const [emoji, userIds] of Object.entries(
            byEmoji as Record<string, unknown>
        )) {
            if (!Array.isArray(userIds)) continue;
            const ids = userIds
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && id > 0);
            if (ids.length > 0) {
                emojiMap[emoji] = [...new Set(ids)];
            }
        }
        if (Object.keys(emojiMap).length > 0) {
            out[messageId] = emojiMap;
        }
    }
    return out;
}

export function isReactableMessageId(
    application: Application,
    messageId: string
): boolean {
    if (!messageId.trim()) return false;
    return correspondenceMessageExists(application, messageId.trim());
}

export function isAllowedReactionEmoji(
    emoji: string
): emoji is MessageReactionEmoji {
    return (MESSAGE_REACTION_EMOJIS as readonly string[]).includes(emoji);
}

export function toggleUserReaction(
    reactions: MessageReactionsMap,
    messageId: string,
    emoji: MessageReactionEmoji,
    userId: number
): MessageReactionsMap {
    const next: MessageReactionsMap = { ...reactions };
    const byEmoji = { ...(next[messageId] ?? {}) };
    const current = [...(byEmoji[emoji] ?? [])];
    const index = current.indexOf(userId);

    if (index >= 0) {
        current.splice(index, 1);
    } else {
        current.push(userId);
    }

    if (current.length === 0) {
        delete byEmoji[emoji];
    } else {
        byEmoji[emoji] = current;
    }

    if (Object.keys(byEmoji).length === 0) {
        delete next[messageId];
    } else {
        next[messageId] = byEmoji;
    }

    return next;
}
