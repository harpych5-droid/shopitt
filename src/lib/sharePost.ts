export async function sharePost(id: string, title: string) {
  const url = `${window.location.origin}/p/${encodeURIComponent(id)}`;
  if (navigator.share) {
    await navigator.share({ title: title || "Shopitt post", url });
    return "shared" as const;
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
