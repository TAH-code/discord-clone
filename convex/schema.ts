import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()),
  }),

  servers: defineTable({
    name: v.string(),
    imageUrl: v.optional(v.string()),
    ownerId: v.id("users"),
    inviteCode: v.string(),
  }).index("by_inviteCode", ["inviteCode"]),

  serverMembers: defineTable({
    serverId: v.id("servers"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_server", ["serverId"])
    .index("by_user", ["userId"])
    .index("by_server_and_user", ["serverId", "userId"]),

  channels: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
    createdAt: v.number(),
  }).index("by_server", ["serverId"]),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  }).index("by_channel", ["channelId", "createdAt"]),

  directMessageThreads: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    createdAt: v.number(),
  }).index("by_users", ["userAId", "userBId"]),

  directMessages: defineTable({
    threadId: v.id("directMessageThreads"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  }).index("by_thread", ["threadId", "createdAt"]),

  typingIndicators: defineTable({
    channelId: v.optional(v.id("channels")),
    threadId: v.optional(v.id("directMessageThreads")),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_thread", ["threadId"]),

  calls: defineTable({
    channelId: v.optional(v.id("channels")),
    threadId: v.optional(v.id("directMessageThreads")),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId"])
    .index("by_thread", ["threadId"]),

  callParticipants: defineTable({
    callId: v.id("calls"),
    userId: v.id("users"),
    micOn: v.boolean(),
    cameraOn: v.boolean(),
    speaking: v.boolean(),
    joinedAt: v.number(),
    lastHeartbeat: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_call_and_user", ["callId", "userId"]),

  signals: defineTable({
    callId: v.id("calls"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    kind: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("ice-candidate"),
    ),
    payload: v.string(),
    createdAt: v.number(),
  }).index("by_call_and_recipient", ["callId", "toUserId"]),
});
