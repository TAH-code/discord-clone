import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireAuthUserId,
  assertServerMember,
  assertServerOwner,
} from "./lib/permissions";
import { isOnline } from "./lib/validation";

export const createServer = mutation({
  args: { name: v.string(), imageUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const serverId = await ctx.db.insert("servers", {
      name: args.name,
      imageUrl: args.imageUrl,
      ownerId: userId,
      inviteCode: crypto.randomUUID().replace(/-/g, ""),
    });
    await ctx.db.insert("serverMembers", {
      serverId,
      userId,
      joinedAt: Date.now(),
    });
    await ctx.db.insert("channels", {
      serverId,
      name: "general",
      type: "text",
      createdAt: Date.now(),
    });
    return serverId;
  },
});

export const renameServer = mutation({
  args: { serverId: v.id("servers"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerOwner(ctx, args.serverId, userId);
    await ctx.db.patch(args.serverId, { name: args.name });
  },
});

export const getInvite = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerMember(ctx, args.serverId, userId);
    const server = await ctx.db.get(args.serverId);
    if (server === null) throw new Error("Server not found");
    return { inviteCode: server.inviteCode };
  },
});

export const generateInvite = mutation({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerOwner(ctx, args.serverId, userId);
    const inviteCode = crypto.randomUUID().replace(/-/g, "");
    await ctx.db.patch(args.serverId, { inviteCode });
    return { inviteCode };
  },
});

export const joinViaInvite = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const server = await ctx.db
      .query("servers")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
    if (server === null) throw new Error("Invalid invite link");

    const existing = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_and_user", (q) =>
        q.eq("serverId", server._id).eq("userId", userId),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("serverMembers", {
        serverId: server._id,
        userId,
        joinedAt: Date.now(),
      });
    }
    return server._id;
  },
});

export const leaveServer = mutation({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const membership = await assertServerMember(ctx, args.serverId, userId);
    const server = await ctx.db.get(args.serverId);
    if (server === null) throw new Error("Server not found");

    const remainingMembers = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();
    const others = remainingMembers.filter((m) => m.userId !== userId);

    await ctx.db.delete(membership._id);

    if (others.length === 0) {
      const channels = await ctx.db
        .query("channels")
        .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
        .collect();
      for (const channel of channels) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();
        for (const message of messages) {
          await ctx.db.delete(message._id);
        }
        await ctx.db.delete(channel._id);
      }
      await ctx.db.delete(args.serverId);
      return;
    }

    if (server.ownerId === userId) {
      const nextOwner = others.reduce((oldest, m) =>
        m.joinedAt < oldest.joinedAt ? m : oldest,
      );
      await ctx.db.patch(args.serverId, { ownerId: nextOwner.userId });
    }
  },
});

export const removeMember = mutation({
  args: { serverId: v.id("servers"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await requireAuthUserId(ctx);
    await assertServerOwner(ctx, args.serverId, callerId);
    if (args.userId === callerId) {
      throw new Error("Use leaveServer to remove yourself");
    }
    const membership = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_and_user", (q) =>
        q.eq("serverId", args.serverId).eq("userId", args.userId),
      )
      .unique();
    if (membership === null) throw new Error("User is not a member");
    await ctx.db.delete(membership._id);
  },
});

export const listMyServers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const servers = await Promise.all(
      memberships.map((m) => ctx.db.get(m.serverId)),
    );
    return servers.filter((s) => s !== null);
  },
});

export const listMembers = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await assertServerMember(ctx, args.serverId, userId);
    const server = await ctx.db.get(args.serverId);
    if (server === null) throw new Error("Server not found");

    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    const now = Date.now();
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (user === null) return null;
        return {
          _id: membership._id,
          userId: membership.userId,
          name: user.name ?? "Unknown",
          avatarUrl: user.avatarUrl,
          presence: isOnline(user.lastHeartbeat, now)
            ? ("online" as const)
            : ("offline" as const),
          isOwner: server.ownerId === membership.userId,
        };
      }),
    );
    return members.filter((m) => m !== null);
  },
});
