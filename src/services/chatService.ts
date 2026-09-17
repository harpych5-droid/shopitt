import { supabase } from "@/lib/supabase";

export type ConversationRow = {
  id: string;
  user_1_id: string;
  user_2_id: string;
  last_message: string | null;
  updated_at: string;
  created_at: string;
  other?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
    is_verified: boolean | null;
  } | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  media_url: string | null;
  media_type: "image" | "video" | "gif" | null;
  reply_to_message_id: string | null;
  read_status: boolean | null;
  created_at: string;
};

type ChatProfile = NonNullable<ConversationRow["other"]>;

export async function fetchChatProfile(userId: string) {
  const primary = await supabase
    .from("profiles")
    .select("id, username, avatar_url, is_verified")
    .eq("id", userId)
    .maybeSingle();
  return { data: primary.data as { id: string; username: string | null; avatar_url: string | null; is_verified: boolean | null } | null, error: primary.error?.message ?? null };
}

export async function fetchConversations(userId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_1_id, user_2_id, last_message, updated_at, created_at")
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  const otherIds = Array.from(
    new Set((data as ConversationRow[]).map((c) => (c.user_1_id === userId ? c.user_2_id : c.user_1_id))),
  );
  if (otherIds.length === 0) return data as ConversationRow[];

  let { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, full_name, is_verified")
    .in("id", otherIds);
  if (!profiles) {
    const fallback = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_verified")
      .in("id", otherIds);
    profiles = fallback.data;
  }
  const map = new Map<string, ChatProfile>((profiles ?? []).map((p) => [p.id, p as ChatProfile]));
  return (data as ConversationRow[]).map((c) => {
    const otherId = c.user_1_id === userId ? c.user_2_id : c.user_1_id;
    return { ...c, other: map.get(otherId) ?? null } as ConversationRow;
  });
}

export async function findOrCreateConversation(userA: string, userB: string) {
  const { data: sessionData } = await supabase.auth.getUser();
  if (!sessionData.user || sessionData.user.id !== userA) {
    return { id: null, error: "Authentication required" };
  }
  const { data, error } = await supabase.rpc("create_or_get_conversation", {
    other_user_id: userB,
  });
  return { id: (data as string | null) ?? null, error: error?.message ?? null };
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, message_text, media_url, media_type, reply_to_message_id, read_status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    const fallback = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, message_text, read_status, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    return (fallback.data ?? []).map((message) => ({ ...message, media_url: null, media_type: null, reply_to_message_id: null })) as MessageRow[];
  }
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  options: { mediaUrl?: string | null; mediaType?: MessageRow["media_type"]; replyToMessageId?: string | null } = {},
) {
  let { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_text: text,
      media_url: options.mediaUrl ?? null,
      media_type: options.mediaType ?? null,
      reply_to_message_id: options.replyToMessageId ?? null,
    })
      .select("id, conversation_id, sender_id, message_text, media_url, media_type, reply_to_message_id, read_status, created_at")
    .maybeSingle();

    if (error && /media_type|media_url|reply_to_message_id|schema cache/i.test(error.message)) {
      const fallback = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, message_text: text })
        .select("id, conversation_id, sender_id, message_text, read_status, created_at")
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, media_url: null, media_type: null, reply_to_message_id: null } : null;
      error = fallback.error;
    }

  // Bump conversation's last_message + updated_at
  await supabase
    .from("conversations")
    .update({ last_message: text, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (!error && data?.id) void notifyMentionedUsers(text, senderId, data.id);

  return { data: data as MessageRow | null, error: error?.message ?? null };
}

export async function toggleMessageReaction(messageId: string, userId: string, reaction: string) {
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("reaction")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .maybeSingle();
  const result = existing?.reaction === reaction
    ? await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", userId)
    : await supabase.from("message_reactions").upsert({ message_id: messageId, user_id: userId, reaction }, { onConflict: "message_id,user_id" });
  return { error: result.error?.message ?? null };
}

async function notifyMentionedUsers(text: string, actorId: string, messageId: string) {
  const handles = Array.from(new Set(Array.from(text.matchAll(/@([a-zA-Z0-9_]{2,24})/g), (match) => match[1])));
  if (!handles.length) return;
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("username", handles);
  const rows = (profiles ?? []).filter((profile) => profile.id !== actorId).map((profile) => ({
    user_id: profile.id,
    actor_id: actorId,
    type: "mention",
    title: "You were mentioned in Chat",
    body: `@${profile.username ?? "shopper"} was mentioned in a Shopitt conversation.`,
    message: text.slice(0, 160),
    is_read: false,
  }));
  if (rows.length) await supabase.from("notifications").insert(rows);
}
