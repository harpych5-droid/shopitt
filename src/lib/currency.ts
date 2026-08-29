/** Display a compact currency symbol without altering the stored ISO code. */
export const currencyLabel = (currency: string | null | undefined, fallback = "USD") => {
  const value = currency?.trim() || fallback;
  return value === "ZMW" ? "K" : value;
};
