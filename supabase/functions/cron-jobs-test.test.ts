import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.test({
  name: "Background Jobs - assign_daily_quests_batch and resolve_stale_battles_batch integration test",
  sanitizeOps: false,
  sanitizeResources: false,
  ignore: !supabaseUrl || !supabaseServiceKey,
  async fn() {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
      },
    });

    // 1. Generate unique IDs for testing
    const testChallengerId = crypto.randomUUID();
    const testOpponentId = crypto.randomUUID();
    const testDailyQuestId = crypto.randomUUID();

    try {
      // 2. Setup mock data
      // Insert test users into profiles
      const { error: profileErr1 } = await supabase.from("profiles").insert({
        id: testChallengerId,
        coins: 100,
        experience: 0,
        level: 1,
      });
      assertEquals(profileErr1, null, "Failed to insert test challenger profile");

      const { error: profileErr2 } = await supabase.from("profiles").insert({
        id: testOpponentId,
        coins: 100,
        experience: 0,
        level: 1,
      });
      assertEquals(profileErr2, null, "Failed to insert test opponent profile");

      // Set water intake for battle testing
      // Note: public_profiles is typically updated via trigger or process_hydration_event.
      // We update public_profiles directly for the test (or profiles if public_profiles is a view/table).
      // Let's check public_profiles and make sure we set water_today.
      const { error: ppErr1 } = await supabase
        .from("public_profiles")
        .update({ water_today: 1200 })
        .eq("id", testChallengerId);
      if (ppErr1) {
        console.log("Direct update to public_profiles failed (might be a view), updating profiles/water_logs instead.");
        // If it's a view/trigger, we insert into water_logs to populate it
        await supabase.from("water_logs").insert({
          user_id: testChallengerId,
          amount: 1200,
          day: new Date().toISOString().split("T")[0],
        });
        await supabase.from("water_logs").insert({
          user_id: testOpponentId,
          amount: 800,
          day: new Date().toISOString().split("T")[0],
        });
      } else {
        const { error: ppErr2 } = await supabase
          .from("public_profiles")
          .update({ water_today: 800 })
          .eq("id", testOpponentId);
        assertEquals(ppErr2, null, "Failed to update opponent water_today");
      }

      // Insert at least 3 quests to ensure assign_daily_quests_batch has daily quests to assign
      const { data: existingQuests } = await supabase
        .from("quests")
        .select("id")
        .eq("quest_type", "daily");

      if (!existingQuests || existingQuests.length < 3) {
        // Insert dummy daily quests
        await supabase.from("quests").insert([
          { id: testDailyQuestId, title: "Test Quest 1", quest_type: "daily", reward_exp: 10, reward_coins: 5 },
          { id: crypto.randomUUID(), title: "Test Quest 2", quest_type: "daily", reward_exp: 10, reward_coins: 5 },
          { id: crypto.randomUUID(), title: "Test Quest 3", quest_type: "daily", reward_exp: 10, reward_coins: 5 },
        ]);
      }

      // 3. Test assign_daily_quests_batch() RPC
      const { data: assignResult, error: assignError } = await supabase.rpc("assign_daily_quests_batch");
      assertEquals(assignError, null, "Error running assign_daily_quests_batch RPC");
      console.log(`assign_daily_quests_batch resolved: ${assignResult} quests assigned.`);

      // Verify challenger now has exactly 3 daily quests today
      const { data: challengerQuests, error: getQuestsError } = await supabase
        .from("user_quests")
        .select("*, quests!inner(*)")
        .eq("user_id", testChallengerId)
        .eq("assigned_date", new Date().toISOString().split("T")[0])
        .eq("quests.quest_type", "daily");
      
      assertEquals(getQuestsError, null);
      assertEquals(challengerQuests?.length, 3, "Challenger should have 3 daily quests assigned");

      // 4. Test resolve_stale_battles_batch() RPC
      // Create a stale active battle
      const endsAt = new Date();
      endsAt.setMinutes(endsAt.getMinutes() - 5); // 5 minutes ago

      const { data: battleData, error: battleErr } = await supabase
        .from("hydration_battles")
        .insert({
          challenger_id: testChallengerId,
          opponent_id: testOpponentId,
          stake_coins: 50,
          status: "active",
          ends_at: endsAt.toISOString(),
        })
        .select()
        .single();
      assertEquals(battleErr, null, "Failed to insert test hydration battle");

      const { data: resolveResult, error: resolveError } = await supabase.rpc("resolve_stale_battles_batch");
      assertEquals(resolveError, null, "Error running resolve_stale_battles_batch RPC");
      console.log(`resolve_stale_battles_batch resolved: ${resolveResult} battles.`);

      // Verify the battle was marked completed and challenger was set as winner
      const { data: updatedBattle, error: checkBattleErr } = await supabase
        .from("hydration_battles")
        .select("*")
        .eq("id", battleData.id)
        .single();
      
      assertEquals(checkBattleErr, null);
      assertEquals(updatedBattle.status, "completed", "Battle status should be completed");
      assertEquals(updatedBattle.winner_id, testChallengerId, "Winner should be the challenger (who drank more)");

      // Verify challenger received the stake coins (started at 100 + 50 = 150)
      const { data: updatedChallengerProfile, error: getChallengerErr } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", testChallengerId)
        .single();

      assertEquals(getChallengerErr, null);
      assertEquals(updatedChallengerProfile.coins, 150, "Challenger coins should be increased by stake_coins");

    } finally {
      // 5. Cleanup test data
      await supabase.from("hydration_battles").delete().eq("challenger_id", testChallengerId);
      await supabase.from("user_quests").delete().eq("user_id", testChallengerId);
      await supabase.from("user_quests").delete().eq("user_id", testOpponentId);
      await supabase.from("quests").delete().eq("id", testDailyQuestId);
      await supabase.from("profiles").delete().eq("id", testChallengerId);
      await supabase.from("profiles").delete().eq("id", testOpponentId);
    }
  },
});
