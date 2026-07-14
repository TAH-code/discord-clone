import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 10_000;

/**
 * Sends a presence heartbeat while the app is open and authenticated.
 * Constitution Principle II: presence is derived from these heartbeats via a
 * reactive query, never polled by the UI.
 */
export function usePresenceHeartbeat(enabled: boolean) {
  const heartbeat = useMutation(api.users.heartbeat);

  useEffect(() => {
    if (!enabled) return;
    void heartbeat();
    const id = setInterval(() => {
      void heartbeat();
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, heartbeat]);
}
