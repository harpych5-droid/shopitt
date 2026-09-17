import { describe, expect, it } from "vitest";
import { normalizeHashtag, normalizeHashtags, extractHashtags, REACTION_OPTIONS } from "./hashtags";

describe("hashtags", () => {
  it("normalizes duplicate casing and invalid characters", () => {
    expect(normalizeHashtag("#Streetwear")).toBe("streetwear");
    expect(normalizeHashtag("#streetwear")).toBe("streetwear");
    expect(normalizeHashtag("###Streetwear!!!")).toBe("streetwear");
  });

  it("deduplicates and limits hashtag input", () => {
    const values = ["#Streetwear", "streetwear", "#nightfits", "#NightFits", "#MinimalStyle"]; 
    expect(normalizeHashtags(values, 10)).toEqual(["streetwear", "nightfits", "minimalstyle"]);
  });

  it("extracts only valid hashtags from text", () => {
    expect(extractHashtags("Late night #Streetwear #lusaka #bad tag #y2k")).toEqual(["streetwear", "lusaka", "bad", "y2k"]);
  });

  it("offers native reaction options", () => {
    expect(REACTION_OPTIONS.map((r) => r.value)).toEqual(["love", "fire", "obsessed", "vibe", "wow", "respect"]);
  });
});
