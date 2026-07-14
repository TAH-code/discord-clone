export const MAX_MESSAGE_LENGTH = 2000;

export function assertMessageLength(body: string) {
  if (body.length === 0) {
    throw new Error("Message cannot be empty");
  }
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit`,
    );
  }
}

export const PRESENCE_TIMEOUT_MS = 30_000;

export function isOnline(lastHeartbeat: number | undefined, now: number) {
  if (lastHeartbeat === undefined) return false;
  return now - lastHeartbeat <= PRESENCE_TIMEOUT_MS;
}

export const MAX_CALL_PARTICIPANTS = 4;
