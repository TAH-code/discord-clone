import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../../../convex/schema";
import {
  assertCallParticipant,
  assertMessageAuthor,
  assertServerMember,
  assertServerOwner,
  requireAuthUserId,
} from "../../../convex/lib/permissions";

const modules = import.meta.glob("../../../convex/**/*.ts");

describe("requireAuthUserId", () => {
  test("throws when there is no authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await expect(t.run((ctx) => requireAuthUserId(ctx))).rejects.toThrow(
      /not authenticated/i,
    );
  });

  test("returns the user id for the current identity", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", { name: "Alice" }));
    const result = await t
      .withIdentity({ subject: userId })
      .run((ctx) => requireAuthUserId(ctx));
    expect(result).toBe(userId);
  });
});

describe("assertServerMember", () => {
  test("throws when the user never joined the server", async () => {
    const t = convexTest(schema, modules);
    const [ownerId, outsiderId] = await t.run(async (ctx) => [
      await ctx.db.insert("users", { name: "Owner" }),
      await ctx.db.insert("users", { name: "Outsider" }),
    ]);
    const serverId = await t.run((ctx) =>
      ctx.db.insert("servers", {
        name: "Test Server",
        ownerId,
        inviteCode: "abc123",
      }),
    );
    await expect(
      t.run((ctx) => assertServerMember(ctx, serverId, outsiderId)),
    ).rejects.toThrow(/not a member/i);
  });

  test("returns the membership row for an actual member", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await t.run((ctx) => ctx.db.insert("users", { name: "Owner" }));
    const serverId = await t.run((ctx) =>
      ctx.db.insert("servers", {
        name: "Test Server",
        ownerId,
        inviteCode: "abc123",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("serverMembers", {
        serverId,
        userId: ownerId,
        joinedAt: Date.now(),
      }),
    );
    const membership = await t.run((ctx) =>
      assertServerMember(ctx, serverId, ownerId),
    );
    expect(membership.userId).toBe(ownerId);
    expect(membership.serverId).toBe(serverId);
  });
});

describe("assertServerOwner", () => {
  test("throws when the server does not exist", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await t.run((ctx) => ctx.db.insert("users", { name: "Owner" }));
    const serverId = await t.run((ctx) =>
      ctx.db.insert("servers", {
        name: "Temp",
        ownerId,
        inviteCode: "xyz789",
      }),
    );
    await t.run((ctx) => ctx.db.delete(serverId));
    await expect(
      t.run((ctx) => assertServerOwner(ctx, serverId, ownerId)),
    ).rejects.toThrow(/server not found/i);
  });

  test("throws when the user is not the owner", async () => {
    const t = convexTest(schema, modules);
    const [ownerId, memberId] = await t.run(async (ctx) => [
      await ctx.db.insert("users", { name: "Owner" }),
      await ctx.db.insert("users", { name: "Member" }),
    ]);
    const serverId = await t.run((ctx) =>
      ctx.db.insert("servers", {
        name: "Test Server",
        ownerId,
        inviteCode: "abc123",
      }),
    );
    await expect(
      t.run((ctx) => assertServerOwner(ctx, serverId, memberId)),
    ).rejects.toThrow(/only the server owner/i);
  });

  test("returns the server for the actual owner", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await t.run((ctx) => ctx.db.insert("users", { name: "Owner" }));
    const serverId = await t.run((ctx) =>
      ctx.db.insert("servers", {
        name: "Test Server",
        ownerId,
        inviteCode: "abc123",
      }),
    );
    const server = await t.run((ctx) => assertServerOwner(ctx, serverId, ownerId));
    expect(server._id).toBe(serverId);
  });
});

describe("assertMessageAuthor", () => {
  test("throws when the user did not author the message", async () => {
    const t = convexTest(schema, modules);
    const [authorId, otherId] = await t.run(async (ctx) => [
      await ctx.db.insert("users", { name: "Author" }),
      await ctx.db.insert("users", { name: "Other" }),
    ]);
    expect(() =>
      assertMessageAuthor({ authorId }, otherId),
    ).toThrow(/only the author/i);
  });

  test("does not throw for the actual author", async () => {
    const t = convexTest(schema, modules);
    const authorId = await t.run((ctx) => ctx.db.insert("users", { name: "Author" }));
    expect(() => assertMessageAuthor({ authorId }, authorId)).not.toThrow();
  });
});

describe("assertCallParticipant", () => {
  test("throws when the user never joined the call", async () => {
    const t = convexTest(schema, modules);
    const [callerId, outsiderId] = await t.run(async (ctx) => [
      await ctx.db.insert("users", { name: "Caller" }),
      await ctx.db.insert("users", { name: "Outsider" }),
    ]);
    const callId = await t.run((ctx) =>
      ctx.db.insert("calls", { startedAt: Date.now() }),
    );
    await t.run((ctx) =>
      ctx.db.insert("callParticipants", {
        callId,
        userId: callerId,
        micOn: true,
        cameraOn: true,
        speaking: false,
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      }),
    );
    await expect(
      t.run((ctx) => assertCallParticipant(ctx, callId, outsiderId)),
    ).rejects.toThrow(/not a participant/i);
  });

  test("returns the participant row for an actual participant", async () => {
    const t = convexTest(schema, modules);
    const callerId = await t.run((ctx) => ctx.db.insert("users", { name: "Caller" }));
    const callId = await t.run((ctx) =>
      ctx.db.insert("calls", { startedAt: Date.now() }),
    );
    await t.run((ctx) =>
      ctx.db.insert("callParticipants", {
        callId,
        userId: callerId,
        micOn: true,
        cameraOn: true,
        speaking: false,
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      }),
    );
    const participant = await t.run((ctx) =>
      assertCallParticipant(ctx, callId, callerId),
    );
    expect(participant.userId).toBe(callerId);
    expect(participant.callId).toBe(callId);
  });
});
