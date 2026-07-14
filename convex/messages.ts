import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAuthUserId, assertMessageAuthor } from "./lib/permissions";
import { assertMessageLength } from "./lib/validation";
import type { Id } from "./_generated/dataModel";

async function assertChannelMember(
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"channels">,
  userId: Id<"users">,
) {
  const channel = await ctx.db.get(channelId);
  if (channel === null) throw new Error("Channel not found");
  const membership = await ctx.db
    .query("serverMembers")
    .withIndex("by_server_and_user", (q) =>
      q.eq("serverId", channel.serverId).eq("userId", userId),
    )
    .unique();
  if (membership === null) throw new Error("Not a member of this server");
  return channel;
}

export const listMessages = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertChannelMember(ctx, args.channelId, userId);
    const page = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
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
  args: { channelId: v.id("channels"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertChannelMember(ctx, args.channelId, userId);
    assertMessageLength(args.body);
    return await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: userId,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});

export const editMessage = mutation({
  args: { messageId: v.id("messages"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const message = await ctx.db.get(args.messageId);
    if (message === null) throw new Error("Message not found");
    assertMessageAuthor(message, userId);
    assertMessageLength(args.body);
    await ctx.db.patch(args.messageId, {
      body: args.body,
      editedAt: Date.now(),
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const message = await ctx.db.get(args.messageId);
    if (message === null) throw new Error("Message not found");
    assertMessageAuthor(message, userId);
    await ctx.db.delete(args.messageId);
  },
});
