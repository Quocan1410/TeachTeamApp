"use client";



import React from "react";

import type { ApplicationResponse } from "@/shared/services/applicationService";

import type { ApplicationTimelineItem } from "@/shared/utils/applicationTimeline";

import type { ReactableMessageId } from "@/shared/utils/messageReactions";

import type { User } from "@/shared/types/user";

import {

  canEditTimelineMessage,

  formatConversationTimestamp,

  getCandidateAvatarPerson,

  getCandidateFormattedName,

  getLecturerAvatarPerson,

  getLecturerFormattedName,

  isChatMessage,

} from "./conversationUtils";

import ConversationAvatar from "./ConversationAvatar";

import type { MessageAction } from "./ConversationMessageActions";

import MessageHoverToolbar from "./MessageHoverToolbar";
import MessageReactionBar from "./MessageReactionBar";
import MessageReplyQuote from "./MessageReplyQuote";
import type { ReplyQuotePreview } from "./conversationUtils";

import conversationStyles from "./ConversationPanel.module.css";



interface ConversationMessageProps {

  item: ApplicationTimelineItem;

  application: ApplicationResponse;

  authUser?: User | null;

  highlight?: boolean;

  isPinned?: boolean;

  canCompose?: boolean;

  messageReactions: ReturnType<

    typeof import("@/shared/utils/messageReactions").normalizeMessageReactions

  >;

  currentUserId?: number;

  onToggleReaction: (messageId: ReactableMessageId, emoji: string) => void;

  onMessageAction: (

    action: MessageAction,

    item: ApplicationTimelineItem

  ) => void;

  replyQuote?: ReplyQuotePreview | null;

}



function senderLabel(

  item: ApplicationTimelineItem,

  application: ApplicationResponse,

  authUser?: User | null

): string {

  if (item.kind === "candidate") {

    return getCandidateFormattedName(application, authUser);

  }

  if (item.kind === "lecturer") {
    return getLecturerFormattedName(application, authUser);
  }

  return "System";

}



const ConversationMessage: React.FC<ConversationMessageProps> = ({

  item,

  application,

  authUser,

  highlight,

  isPinned,

  canCompose,

  messageReactions,

  currentUserId,

  onToggleReaction,

  onMessageAction,

  replyQuote,

}) => {

  const name = senderLabel(item, application, authUser);

  const isCandidate = item.kind === "candidate";

  const isLecturer = item.kind === "lecturer";

  const isChat = isChatMessage(item);

  const avatarPerson = isCandidate

    ? getCandidateAvatarPerson(application, authUser)

    : getLecturerAvatarPerson(application, authUser) ?? {

        firstName: name,

        email: "",

        userType: "lecturer",

      };



  const body = item.body?.trim() || item.title;

  const canEdit =

    !!canCompose && isCandidate && canEditTimelineMessage(item);

  const viewerIsLecturer = authUser?.userType === "lecturer";

  const canDelete =
    !!canCompose && (viewerIsLecturer ? isLecturer : isCandidate);

  const canReply =
    !!canCompose &&
    ((viewerIsLecturer && isCandidate) || (!viewerIsLecturer && isLecturer));



  return (

    <article

      id={isChat ? `correspondence-message-${item.id}` : undefined}

      className={`${conversationStyles.messageRow} ${

        isChat ? conversationStyles.messageRowInteractive : ""

      } ${highlight ? conversationStyles.messageRowHighlight : ""} ${

        isPinned ? conversationStyles.messageRowPinned : ""

      }`}

    >

      <ConversationAvatar

        person={avatarPerson}

        variant={isCandidate ? "you" : isLecturer ? "lecturer" : "default"}

      />

      <div className={conversationStyles.messageMain}>

        <div className={conversationStyles.messageHead}>

          <div className={conversationStyles.messageHeadMain}>

            <span className={conversationStyles.messageName}>{name}</span>

            {isPinned && (

              <span className={conversationStyles.pinnedBadge} title="Pinned">

                📌

              </span>

            )}

            <span className={conversationStyles.messageMeta}>

              ·{" "}

              <time dateTime={item.at}>

                {formatConversationTimestamp(item.at)}

              </time>

              {item.editedAt ? (

                <span className={conversationStyles.editedLabel}>

                  {" "}

                  · edited

                </span>

              ) : null}

            </span>

          </div>

        </div>



        {isChat ? (
          <>
            <div className={conversationStyles.messageContentWrap}>
              {replyQuote ? (
                <MessageReplyQuote
                  senderName={replyQuote.senderName}
                  body={replyQuote.body}
                  targetMessageId={replyQuote.messageId}
                />
              ) : null}
              <p className={conversationStyles.messageBody}>{body}</p>
              {item.body ? (
                <div className={conversationStyles.messageToolbarSlot}>
                  <MessageHoverToolbar
                    messageId={item.id}
                    reactions={messageReactions}
                    currentUserId={currentUserId}
                    canReply={canReply}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    isPinned={!!isPinned}
                    onToggleReaction={(emoji) =>
                      onToggleReaction(item.id, emoji)
                    }
                    onAction={(action) => onMessageAction(action, item)}
                  />
                </div>
              ) : null}
            </div>
            {item.body ? (
              <MessageReactionBar
                messageId={item.id}
                reactions={messageReactions}
                currentUserId={currentUserId}
                onToggle={(emoji) => onToggleReaction(item.id, emoji)}
              />
            ) : null}
          </>
        ) : (

          <p className={conversationStyles.messageBody}>{body}</p>

        )}

      </div>

    </article>

  );

};



export default ConversationMessage;

