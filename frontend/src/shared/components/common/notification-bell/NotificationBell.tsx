"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/shared/contexts/NotificationContext";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import PaginationBar from "@/shared/components/common/pagination-bar/PaginationBar";
import styles from "./NotificationBell.module.css";

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    notificationPage,
    notificationPageSize,
    notificationTotalCount,
    notificationTotalPages,
    setNotificationPage,
  } = useNotifications();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (
    notificationId: string,
    link?: string | null
  ) => {
    markAsRead(notificationId);
    if (link) {
      router.push(link);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const getNotificationActor = (type: string) => {
    switch (type) {
      case "candidate_blocked":
      case "candidate_unblocked":
      case "account_blocked":
      case "account_unblocked":
      case "course_assigned":
        return "Admin";
      case "application_response":
      case "application_withdrawn":
        return "Candidate";
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    const toneClass = (() => {
      switch (type) {
        case "candidate_blocked":
        case "account_blocked":
        case "application_rejected":
          return styles.iconToneDanger;
        case "candidate_unblocked":
        case "account_unblocked":
        case "application_selected":
          return styles.iconToneSuccess;
        default:
          return styles.iconToneInfo;
      }
    })();

    const iconSvg = (() => {
      switch (type) {
        case "candidate_blocked":
        case "account_blocked":
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          );
        case "candidate_unblocked":
        case "account_unblocked":
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          );
        case "application_selected":
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        case "application_rejected":
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          );
        case "application_comment":
        case "application_submitted":
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          );
        default:
          return (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          );
      }
    })();

    return (
      <div className={`${styles.notificationIcon} ${toneClass}`}>{iconSvg}</div>
    );
  };

  const visible = notifications.slice(0, 10);

  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.bellButton} ${isOpen ? styles.bellButtonActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.bellIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`${styles.badge} ${
              unreadCount > 99
                ? styles.badgeCompact
                : unreadCount > 9
                  ? styles.badgeWide
                  : ""
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationDropdown} role="dialog" aria-label="Notifications">
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownTitleRow}>
              <h3 className={styles.dropdownTitle}>Activity</h3>
              {unreadCount > 0 && (
                <span className={styles.unreadPill}>{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllButton}
                onClick={markAllAsRead}
              >
                Clear all
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {loading && notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrap}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className={styles.emptyTitle}>All caught up</p>
                <p className={styles.emptyText}>
                  Application updates and messages will show up here.
                </p>
              </div>
            ) : (
              <div className={styles.notificationListInner}>
                {visible.map((notification) => {
                  const actor = getNotificationActor(notification.type);
                  return (
                    <div
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      className={`${styles.notificationItem} ${
                        !notification.read ? styles.unread : ""
                      }`}
                      onClick={() =>
                        handleNotificationClick(notification.id, notification.link)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNotificationClick(
                            notification.id,
                            notification.link
                          );
                        }
                      }}
                    >
                      <div className={styles.notificationIconWrap}>
                        {getNotificationIcon(notification.type)}
                        {!notification.read && (
                          <span className={styles.unreadDot} aria-hidden />
                        )}
                      </div>
                      <div className={styles.notificationContent}>
                        {actor && <span className={styles.actorBadge}>{actor}</span>}
                        <span className={styles.notificationTitle}>
                          {notification.title}
                        </span>
                        <p className={styles.notificationMessage}>
                          {notification.message}
                        </p>
                      </div>
                      <div className={styles.itemAside}>
                        <button
                          type="button"
                          className={`${styles.removeButton} iconCloseHit iconCloseCircle`}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          aria-label="Remove notification"
                        >
                          <CloseIcon size={7} />
                        </button>
                        <span className={styles.notificationTime}>
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notificationTotalCount > 0 && (
            <div className={styles.dropdownFooter}>
              <PaginationBar
                page={notificationPage}
                pageSize={notificationPageSize}
                totalCount={notificationTotalCount}
                totalPages={notificationTotalPages}
                onPageChange={setNotificationPage}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
