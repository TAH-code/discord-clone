import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireAuthUserId,
  assertServerMember,
  assertServerOwner,
} from "./lib/permissions";

export const listChannels = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerMember(ctx, args.serverId, userId);
    return await ctx.db
      .query("channels")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();
  },
});

export const createChannel = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerOwner(ctx, args.serverId, userId);
    return await ctx.db.insert("channels", {
      serverId: args.serverId,
      name: args.name,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const renameChannel = mutation({
  args: { channelId: v.id("channels"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (channel === null) throw new Error("Channel not found");
    await assertServerOwner(ctx, channel.serverId, userId);
    await ctx.db.patch(args.channelId, { name: args.name });
  },
});

export const deleteChannel = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (channel === null) throw new Error("Channel not found");
    await assertServerOwner(ctx, channel.serverId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const activeCall = await ctx.db
      .query("calls")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("endedAt"), undefined))
      .unique();
    if (activeCall !== null) {
      await ctx.db.patch(activeCall._id, { endedAt: Date.now() });
      const participants = await ctx.db
        .query("callParticipants")
        .withIndex("by_call", (q) => q.eq("callId", activeCall._id))
        .collect();
      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }
    }

    await ctx.db.delete(args.channelId);
  },
});
