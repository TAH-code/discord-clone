import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuthUserId } from "./lib/permissions";
import { isOnline } from "./lib/validation";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await ctx.db.patch(userId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
    });
  },
});

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    await ctx.db.patch(userId, { lastHeartbeat: Date.now() });
  },
});

export const getPresence = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const result: Record<string, "online" | "offline"> = {};
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      result[userId] = isOnline(user?.lastHeartbeat, now) ? "online" : "offline";
    }
    return result;
  },
});
