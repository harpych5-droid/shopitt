export const MAX_HASHTAGS_PER_POST = 10;

export const HASHTAG_SUGGESTIONS = [
  "streetwear",
  "streetstyle",
  "streetfashion",
  "lusakastyle",
  "sneakerculture",
  "cleanfit",
  "minimalstyle",
  "nightfits",
  "afrostreetwear",
  "denim",
  "y2k",
  "fashiontok",
  "afrofashion",
  "cityfit",
  "outfitideas",
] as const;

export const REACTION_OPTIONS = [
  { value: "love", label: "Love", emoji: "❤️" },
  { value: "fire", label: "Fire", emoji: "🔥" },
  { value: "obsessed", label: "Obsessed", emoji: "😍" },
  { value: "vibe", label: "Vibe", emoji: "🖤" },
  { value: "wow", label: "Wow", emoji: "😮" },
  { value: "respect", label: "Respect", emoji: "👏" },
] as const;

export function normalizeHashtag(raw: string): string {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/^#+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
  return cleaned.replace(/^\d+$/, "") ? cleaned : "";
}

export function normalizeHashtags(values: Iterable<string> | string[], limit = MAX_HASHTAGS_PER_POST): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const tag = normalizeHashtag(value);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
    if (normalized.length >= limit) break;
  }
  return normalized;
}

export function extractHashtags(source: string): string[] {
  return normalizeHashtags((source.match(/#([A-Za-z0-9_]+)/g) ?? []).map((tag) => tag.replace(/^#/, "")));
}
