// STUN-only, no TURN server (research.md §5). This means calls between peers
// behind strict/symmetric NAT (common on some corporate/mobile networks) may
// fail to connect — a known, documented limitation for v1, not a bug to chase.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];
