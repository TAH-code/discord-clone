import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.ts");

test("member can send and list messages; non-member is rejected", async () => {
  const t = convexTest(schema, modules);

  const aliceId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Alice" });
  });
  const bobId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { name: "Bob" });
  });

  const alice = t.withIdentity({ subject: aliceId });
  const bob = t.withIdentity({ subject: bobId });

  const serverId = await alice.mutation(api.servers.createServer, {
    name: "Test Server",
  });
  const channels = await alice.query(api.channels.listChannels, { serverId });
  const generalChannel = channels[0];

  const messageId = await alice.mutation(api.messages.sendMessage, {
    channelId: generalChannel._id,
    body: "hey Bob",
  });

  const page = await alice.query(api.messages.listMessages, {
    channelId: generalChannel._id,
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(page.page.some((m) => m._id === messageId)).toBe(true);

  await expect(
    bob.mutation(api.messages.sendMessage, {
      channelId: generalChannel._id,
      body: "I'm not a member",
    }),
  ).rejects.toThrow();
});
