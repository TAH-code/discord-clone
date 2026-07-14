import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  requireAuthUserId,
  assertServerMember,
  assertCallParticipant,
} from "./lib/permissions";
import { MAX_CALL_PARTICIPANTS } from "./lib/validation";
import type { Id, Doc } from "./_generated/dataModel";

async function endCallIfEmpty(ctx: MutationCtx, callId: Id<"calls">) {
  const remaining = await ctx.db
    .query("callParticipants")
    .withIndex("by_call", (q) => q.eq("callId", callId))
    .collect();
  if (remaining.length === 0) {
    await ctx.db.patch(callId, { endedAt: Date.now() });
  }
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

export const joinVoiceChannel = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (channel === null) throw new Error("Channel not found");
    await assertServerMember(ctx, channel.serverId, userId);

    let call: Doc<"calls"> | null = await ctx.db
      .query("calls")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("endedAt"), undefined))
      .unique();

    if (call === null) {
      const callId = await ctx.db.insert("calls", {
        channelId: args.channelId,
        startedAt: Date.now(),
      });
      call = await ctx.db.get(callId);
    }
    if (call === null) throw new Error("Failed to create call");

    const existingParticipant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_and_user", (q) =>
        q.eq("callId", call!._id).eq("userId", userId),
      )
      .unique();
    if (existingParticipant !== null) {
      return { callId: call._id };
    }

    const participants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", call!._id))
      .collect();
    if (participants.length >= MAX_CALL_PARTICIPANTS) {
      return { error: "channel_full" as const };
    }

    await ctx.db.insert("callParticipants", {
      callId: call._id,
      userId,
      micOn: true,
      cameraOn: true,
      speaking: false,
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
    });
    return { callId: call._id };
  },
});

export const startDmCall = mutation({
  args: { threadId: v.id("directMessageThreads") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertThreadParticipant(ctx, args.threadId, userId);

    let call: Doc<"calls"> | null = await ctx.db
      .query("calls")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("endedAt"), undefined))
      .unique();

    if (call === null) {
      const callId = await ctx.db.insert("calls", {
        threadId: args.threadId,
        startedAt: Date.now(),
      });
      call = await ctx.db.get(callId);
    }
    if (call === null) throw new Error("Failed to create call");

    const existingParticipant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_and_user", (q) =>
        q.eq("callId", call!._id).eq("userId", userId),
      )
      .unique();
    if (existingParticipant === null) {
      await ctx.db.insert("callParticipants", {
        callId: call._id,
        userId,
        micOn: true,
        cameraOn: true,
        speaking: false,
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      });
    }
    return call._id;
  },
});

export const leaveCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const participant = await assertCallParticipant(ctx, args.callId, userId);
    await ctx.db.delete(participant._id);
    await endCallIfEmpty(ctx, args.callId);
  },
});

export const setMediaState = mutation({
  args: {
    callId: v.id("calls"),
    micOn: v.optional(v.boolean()),
    cameraOn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const participant = await assertCallParticipant(ctx, args.callId, userId);
    await ctx.db.patch(participant._id, {
      ...(args.micOn !== undefined ? { micOn: args.micOn } : {}),
      ...(args.cameraOn !== undefined ? { cameraOn: args.cameraOn } : {}),
    });
  },
});

export const setSpeaking = mutation({
  args: { callId: v.id("calls"), speaking: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const participant = await assertCallParticipant(ctx, args.callId, userId);
    await ctx.db.patch(participant._id, { speaking: args.speaking });
  },
});

export const heartbeatCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const participant = await assertCallParticipant(ctx, args.callId, userId);
    await ctx.db.patch(participant._id, { lastHeartbeat: Date.now() });
  },
});

export const listParticipants = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const call = await ctx.db.get(args.callId);
    if (call === null) throw new Error("Call not found");
    if (call.channelId) {
      const channel = await ctx.db.get(call.channelId);
      if (channel === null) throw new Error("Channel not found");
      await assertServerMember(ctx, channel.serverId, userId);
    } else if (call.threadId) {
      await assertThreadParticipant(ctx, call.threadId, userId);
    }

    const rows = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .collect();
    return await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return { ...row, userName: user?.name ?? "Unknown", userAvatarUrl: user?.avatarUrl };
      }),
    );
  },
});

export const getActiveCallForChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (channel === null) throw new Error("Channel not found");
    await assertServerMember(ctx, channel.serverId, userId);
    return await ctx.db
      .query("calls")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("endedAt"), undefined))
      .unique();
  },
});
