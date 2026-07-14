import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthUserId, assertCallParticipant } from "./lib/permissions";

export const sendSignal = mutation({
  args: {
    callId: v.id("calls"),
    toUserId: v.id("users"),
    kind: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("ice-candidate"),
    ),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertCallParticipant(ctx, args.callId, userId);
    await assertCallParticipant(ctx, args.callId, args.toUserId);
    await ctx.db.insert("signals", {
      callId: args.callId,
      fromUserId: userId,
      toUserId: args.toUserId,
      kind: args.kind,
      payload: args.payload,
      createdAt: Date.now(),
    });
  },
});

export const listSignalsForMe = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertCallParticipant(ctx, args.callId, userId);
    return await ctx.db
      .query("signals")
      .withIndex("by_call_and_recipient", (q) =>
        q.eq("callId", args.callId).eq("toUserId", userId),
      )
      .collect();
  },
});

export const consumeSignal = mutation({
  args: { signalId: v.id("signals") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const signal = await ctx.db.get(args.signalId);
    if (signal === null) return;
    if (signal.toUserId !== userId) {
      throw new Error("Not the recipient of this signal");
    }
    await ctx.db.delete(args.signalId);
  },
});
