export async function sharePost(id: string, title: string) {
  // Shared links must always use the public production origin. Using
  // window.location.origin leaks localhost and preview deployment URLs into
  // copied links, neither of which are reliable destinations for recipients.
  const url = `https://shopitt.shop/p/${encodeURIComponent(id)}`;
  if (navigator.share) {
    await navigator.share({ title: title || "Shopitt post", url });
    return "shared" as const;
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
