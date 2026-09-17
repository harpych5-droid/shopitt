import { supabase } from "@/lib/supabase";
import { buildSellerOrderNotificationText, normalizeWhatsAppNumber } from "@/services/ordersService";

export type SellerWhatsAppNotificationInput = {
  sellerId: string;
  orderId: string;
  orderNumber: string;
  itemName: string;
  quantity: number;
  total: string;
  buyerName: string;
  deliveryLocation: string;
  orderLink: string;
};

async function fetchSellerWhatsAppPreference(sellerId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, phone, mobile_phone, whatsapp_number, contact_phone, contact_number")
    .eq("id", sellerId)
    .maybeSingle();

  if (error || !data) return { enabled: false, phone: null };
  const phone = normalizeWhatsAppNumber(
    data.whatsapp_number ?? data.mobile_phone ?? data.phone ?? data.contact_phone ?? data.contact_number,
  );
  const enabled = Boolean(phone);
  return { enabled, phone };
}

export async function triggerSellerOrderWhatsAppNotification(input: SellerWhatsAppNotificationInput) {
  const { enabled, phone } = await fetchSellerWhatsAppPreference(input.sellerId);
  if (!enabled || !phone) {
    return { sent: false, reason: "whatsapp_disabled_or_missing" };
  }

  const message = buildSellerOrderNotificationText({
    orderNumber: input.orderNumber,
    itemName: input.itemName,
    quantity: input.quantity,
    total: input.total,
    buyerName: input.buyerName,
    deliveryLocation: input.deliveryLocation,
    orderLink: input.orderLink,
  });

  const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  try {
    const response = await fetch(link, { method: "GET", redirect: "follow" });
    if (!response.ok) {
      return { sent: false, reason: `http_${response.status}` };
    }
    return { sent: true, provider: "click_to_chat", link };
  } catch {
    return { sent: false, reason: "fetch_failed" };
  }
}

export async function saveSellerWhatsAppConnection(sellerId: string, rawPhone: string, enabled = true) {
  const normalized = normalizeWhatsAppNumber(rawPhone);
  if (!normalized) {
    return { ok: false, error: "Please enter a valid WhatsApp Business number." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      whatsapp_number: normalized,
      phone: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, enabled, phone: normalized };
}
