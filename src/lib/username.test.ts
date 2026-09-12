import { describe, expect, it } from "vitest";
import { isValidUsername, normalizeUsername, sanitizeUsername } from "./username";

describe("username handling", () => {
  it("preserves valid capitalization for display", () => {
    expect(sanitizeUsername("HappyChilala")).toBe("HappyChilala");
    expect(sanitizeUsername("FASHION_SAINT")).toBe("FASHION_SAINT");
  });

  it("normalizes casing only for comparisons", () => {
    expect(normalizeUsername("HaPpY")).toBe("happy");
    expect(normalizeUsername(" Happy ")).toBe("happy");
  });

  it("allows mixed-case letters while keeping existing character rules", () => {
    expect(isValidUsername("StyleByHAPPY")).toBe(true);
    expect(isValidUsername("StreetKing")).toBe(true);
    expect(isValidUsername("bad-name")).toBe(false);
    expect(isValidUsername("a")).toBe(false);
  });
});
