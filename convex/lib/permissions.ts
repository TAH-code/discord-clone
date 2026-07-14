import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireAuthUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function assertServerMember(
  ctx: Ctx,
  serverId: Id<"servers">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("serverMembers")
    .withIndex("by_server_and_user", (q) =>
      q.eq("serverId", serverId).eq("userId", userId),
    )
    .unique();
  if (membership === null) {
    throw new Error("Not a member of this server");
  }
  return membership;
}

export async function assertServerOwner(
  ctx: Ctx,
  serverId: Id<"servers">,
  userId: Id<"users">,
) {
  const server = await ctx.db.get(serverId);
  if (server === null) {
    throw new Error("Server not found");
  }
  if (server.ownerId !== userId) {
    throw new Error("Only the server owner can perform this action");
  }
  return server;
}

export function assertMessageAuthor(
  message: { authorId: Id<"users"> },
  userId: Id<"users">,
) {
  if (message.authorId !== userId) {
    throw new Error("Only the author can perform this action");
  }
}

export async function assertCallParticipant(
  ctx: Ctx,
  callId: Id<"calls">,
  userId: Id<"users">,
) {
  const participant = await ctx.db
    .query("callParticipants")
    .withIndex("by_call_and_user", (q) =>
      q.eq("callId", callId).eq("userId", userId),
    )
    .unique();
  if (participant === null) {
    throw new Error("Not a participant in this call");
  }
  return participant;
}
