import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.ts");

test("joining an empty voice channel creates a call and participant; a 5th joiner is rejected", async () => {
  const t = convexTest(schema, modules);

  const ownerId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Owner" });
  });
  const owner = t.withIdentity({ subject: ownerId });

  const serverId = await owner.mutation(api.servers.createServer, {
    name: "Test Server",
  });
  const channelId = await owner.mutation(api.channels.createChannel, {
    serverId,
    name: "Hangout",
    type: "voice",
  });

  const memberIds = [ownerId];
  for (let i = 0; i < 4; i++) {
    const userId: string = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: `Member ${i}` });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("serverMembers", {
        serverId,
        userId: userId as any,
        joinedAt: Date.now(),
      });
    });
    memberIds.push(userId as any);
  }

  const results = [];
  for (const userId of memberIds) {
    const asUser = t.withIdentity({ subject: userId });
    results.push(await asUser.mutation(api.calls.joinVoiceChannel, { channelId }));
  }

  // first 4 joins succeed with a callId
  for (let i = 0; i < 4; i++) {
    expect(results[i]).toHaveProperty("callId");
  }
  // the 5th join is rejected as channel_full
  expect(results[4]).toEqual({ error: "channel_full" });

  const callId = (results[0] as { callId: string }).callId;
  const participants = await t
    .withIdentity({ subject: ownerId })
    .query(api.calls.listParticipants, { callId: callId as any });
  expect(participants).toHaveLength(4);
});
