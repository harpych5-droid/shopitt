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

export async function fetchConversations(userId: string): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_1_id, user_2_id, last_message, updated_at, created_at")
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  const otherIds = Array.from(
    new Set(data.map((c: any) => (c.user_1_id === userId ? c.user_2_id : c.user_1_id))),
  );
  if (otherIds.length === 0) return data as ConversationRow[];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, full_name")
    .in("id", otherIds);
  const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return (data as any[]).map((c) => {
    const otherId = c.user_1_id === userId ? c.user_2_id : c.user_1_id;
    return { ...c, other: map.get(otherId) ?? null } as ConversationRow;
  });
}

export async function findOrCreateConversation(userA: string, userB: string) {
  const [u1, u2] = [userA, userB].sort();
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user_1_id.eq.${u1},user_2_id.eq.${u2}),and(user_1_id.eq.${u2},user_2_id.eq.${u1})`,
    )
    .maybeSingle();
  if (existing?.id) return { id: existing.id as string, error: null };
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_1_id: u1, user_2_id: u2 })
    .select("id")
    .maybeSingle();
  return { id: created?.id ?? null, error: error?.message ?? null };
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
