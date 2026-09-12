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
  read_status: boolean | null;
  created_at: string;
};

type ChatProfile = NonNullable<ConversationRow["other"]>;

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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, full_name, is_verified")
    .in("id", otherIds);
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
    .select("id, conversation_id, sender_id, message_text, read_status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as MessageRow[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_text: text,
    })
    .select("id, conversation_id, sender_id, message_text, read_status, created_at")
    .maybeSingle();

  // Bump conversation's last_message + updated_at
  await supabase
    .from("conversations")
    .update({ last_message: text, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { data: data as MessageRow | null, error: error?.message ?? null };
}
