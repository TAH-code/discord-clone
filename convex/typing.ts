import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthUserId, assertServerMember } from "./lib/permissions";
import type { Id } from "./_generated/dataModel";

const TYPING_TTL_MS = 5_000;

async function assertCanTypeInChannel(
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"channels">,
  userId: Id<"users">,
) {
  const channel = await ctx.db.get(channelId);
  if (channel === null) throw new Error("Channel not found");
  await assertServerMember(ctx, channel.serverId, userId);
}

async function assertThreadParticipant(
  ctx: QueryCtx | MutationCtx,
  threadId: Id<"directMessageThreads">,
  userId: Id<"users">,
) {
  const thread = await ctx.db.get(threadId);
  if (thread === null) throw new Error("Thread not found");
  if (thread.userAId !== userId && thread.userBId !== userId) {
    throw new Error("Not a participant in this conversation");
  }
}

export const setTyping = mutation({
  args: {
    channelId: v.optional(v.id("channels")),
    threadId: v.optional(v.id("directMessageThreads")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    if (args.channelId) {
      await assertCanTypeInChannel(ctx, args.channelId, userId);
    } else if (args.threadId) {
      await assertThreadParticipant(ctx, args.threadId, userId);
    } else {
      throw new Error("Must provide channelId or threadId");
    }

    const existing = args.channelId
      ? await ctx.db
          .query("typingIndicators")
          .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
          .filter((q) => q.eq(q.field("userId"), userId))
          .unique()
      : await ctx.db
          .query("typingIndicators")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .filter((q) => q.eq(q.field("userId"), userId))
          .unique();

    const expiresAt = Date.now() + TYPING_TTL_MS;
    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      await ctx.db.insert("typingIndicators", {
        channelId: args.channelId,
        threadId: args.threadId,
        userId,
        expiresAt,
      });
    }
  },
});

export const listTyping = query({
  args: {
    channelId: v.optional(v.id("channels")),
    threadId: v.optional(v.id("directMessageThreads")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    if (args.channelId) {
      await assertCanTypeInChannel(ctx, args.channelId, userId);
    } else if (args.threadId) {
      await assertThreadParticipant(ctx, args.threadId, userId);
    } else {
      throw new Error("Must provide channelId or threadId");
    }

    const rows = args.channelId
      ? await ctx.db
          .query("typingIndicators")
          .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
          .collect()
      : await ctx.db
          .query("typingIndicators")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect();

    const now = Date.now();
    const active = rows.filter(
      (row) => row.expiresAt > now && row.userId !== userId,
    );
    const users = await Promise.all(
      active.map((row) => ctx.db.get(row.userId)),
    );
    return users.filter((u) => u !== null);
  },
});
