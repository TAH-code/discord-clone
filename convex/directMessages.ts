import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAuthUserId } from "./lib/permissions";
import { assertMessageLength } from "./lib/validation";
import type { Id } from "./_generated/dataModel";

function sortedPair(a: Id<"users">, b: Id<"users">): [Id<"users">, Id<"users">] {
  return a < b ? [a, b] : [b, a];
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
  return thread;
}

export const openThread = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    if (userId === args.otherUserId) {
      throw new Error("Cannot open a DM with yourself");
    }

    const myServers = await ctx.db
      .query("serverMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const otherServers = await ctx.db
      .query("serverMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.otherUserId))
      .collect();
    const mySeverIds = new Set(myServers.map((m) => m.serverId));
    const shareServer = otherServers.some((m) => mySeverIds.has(m.serverId));
    if (!shareServer) {
      throw new Error("You must share a server with this user to message them");
    }

    const [userAId, userBId] = sortedPair(userId, args.otherUserId);
    const existing = await ctx.db
      .query("directMessageThreads")
      .withIndex("by_users", (q) =>
        q.eq("userAId", userAId).eq("userBId", userBId),
      )
      .unique();
    if (existing !== null) return existing._id;

    return await ctx.db.insert("directMessageThreads", {
      userAId,
      userBId,
      createdAt: Date.now(),
    });
  },
});

export const listMyThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const asA = await ctx.db
      .query("directMessageThreads")
      .withIndex("by_users", (q) => q.eq("userAId", userId))
      .collect();
    // No index covers "userBId only" lookups; acceptable full scan at this
    // app's expected scale (small friend groups), per data-model.md's index set.
    const asB = (await ctx.db.query("directMessageThreads").collect()).filter(
      (t) => t.userBId === userId,
    );
    const threads = [...asA, ...asB];
    return await Promise.all(
      threads.map(async (thread) => {
        const otherUserId =
          thread.userAId === userId ? thread.userBId : thread.userAId;
        const otherUser = await ctx.db.get(otherUserId);
        return {
          _id: thread._id,
          otherUserId,
          otherUserName: otherUser?.name ?? "Unknown",
          otherUserAvatarUrl: otherUser?.avatarUrl,
        };
      }),
    );
  },
});

export const listMessages = query({
  args: {
    threadId: v.id("directMessageThreads"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertThreadParticipant(ctx, args.threadId, userId);
    const page = await ctx.db
      .query("directMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .paginate(args.paginationOpts);
    const withAuthors = await Promise.all(
      page.page.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          authorName: author?.name ?? "Unknown",
          authorAvatarUrl: author?.avatarUrl,
        };
      }),
    );
    return { ...page, page: withAuthors };
  },
});

export const sendMessage = mutation({
  args: { threadId: v.id("directMessageThreads"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertThreadParticipant(ctx, args.threadId, userId);
    assertMessageLength(args.body);
    return await ctx.db.insert("directMessages", {
      threadId: args.threadId,
      authorId: userId,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});

export const editMessage = mutation({
  args: { directMessageId: v.id("directMessages"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const message = await ctx.db.get(args.directMessageId);
    if (message === null) throw new Error("Message not found");
    if (message.authorId !== userId) {
      throw new Error("Only the author can perform this action");
    }
    assertMessageLength(args.body);
    await ctx.db.patch(args.directMessageId, {
      body: args.body,
      editedAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: { directMessageId: v.id("directMessages") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const message = await ctx.db.get(args.directMessageId);
    if (message === null) throw new Error("Message not found");
    if (message.authorId !== userId) {
      throw new Error("Only the author can perform this action");
    }
    await ctx.db.delete(args.directMessageId);
  },
});
