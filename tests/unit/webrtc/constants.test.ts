import { describe, expect, it } from "vitest";
import { ICE_SERVERS } from "../../../src/lib/webrtc/constants";

describe("ICE_SERVERS", () => {
  it("is STUN-only (no TURN server) per research.md §5", () => {
    expect(ICE_SERVERS).toHaveLength(1);
    expect(ICE_SERVERS[0].urls).toBe("stun:stun.l.google.com:19302");
  });
});
