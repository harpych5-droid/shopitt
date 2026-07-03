import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationsRead,
  type NotificationRow,
} from "@/services/socialService";

export function useNotifications() {
  const { user, isAuthed } = useIdentity();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnread(0);
      setLoading(false);
      return;
    }
    const [list, count] = await Promise.all([
      fetchNotifications(user.id),
      fetchUnreadNotificationCount(user.id),
    ]);
    setItems(list);
    setUnread(count);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthed || !user) {
      setItems([]);
      setUnread(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
    const channel = supabase
      .channel(`me-notifs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthed, user, refresh]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await markNotificationsRead(user.id);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  return { items, unread, loading, refresh, markAllRead };
}
