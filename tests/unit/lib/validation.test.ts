import { describe, expect, it } from "vitest";
import {
  assertMessageLength,
  isOnline,
  MAX_CALL_PARTICIPANTS,
  MAX_MESSAGE_LENGTH,
  PRESENCE_TIMEOUT_MS,
} from "../../../convex/lib/validation";

describe("assertMessageLength", () => {
  it("accepts a normal message", () => {
    expect(() => assertMessageLength("hello")).not.toThrow();
  });

  it("rejects an empty message", () => {
    expect(() => assertMessageLength("")).toThrow(/empty/i);
  });

  it("accepts a message exactly at the limit", () => {
    expect(() =>
      assertMessageLength("a".repeat(MAX_MESSAGE_LENGTH)),
    ).not.toThrow();
  });

  it("rejects a message over the limit", () => {
    expect(() =>
      assertMessageLength("a".repeat(MAX_MESSAGE_LENGTH + 1)),
    ).toThrow(/2000-character limit/);
  });
});

describe("isOnline", () => {
  const now = 1_000_000;

  it("is offline when there is no heartbeat", () => {
    expect(isOnline(undefined, now)).toBe(false);
  });

  it("is online right at the heartbeat timestamp", () => {
    expect(isOnline(now, now)).toBe(true);
  });

  it("is online exactly at the presence cutoff", () => {
    expect(isOnline(now - PRESENCE_TIMEOUT_MS, now)).toBe(true);
  });

  it("is offline just past the presence cutoff", () => {
    expect(isOnline(now - PRESENCE_TIMEOUT_MS - 1, now)).toBe(false);
  });
});

describe("MAX_CALL_PARTICIPANTS", () => {
  it("is capped at 4 per data-model.md/spec Clarification", () => {
    expect(MAX_CALL_PARTICIPANTS).toBe(4);
  });
});
