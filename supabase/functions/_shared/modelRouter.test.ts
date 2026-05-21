import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getModelForAction, getMaxTokensForAction } from "./modelRouter.ts";

Deno.test("modelRouter — advice uses fast model", () => {
  assertEquals(getModelForAction("advice"), "llama-3.1-8b-instant");
});

Deno.test("modelRouter — chat uses fast model", () => {
  assertEquals(getModelForAction("chat"), "llama-3.1-8b-instant");
});

Deno.test("modelRouter — report-analysis uses smart model", () => {
  assertEquals(getModelForAction("report-analysis"), "llama-3.3-70b-versatile");
});

Deno.test("modelRouter — agentic uses smart model", () => {
  assertEquals(getModelForAction("agentic"), "llama-3.3-70b-versatile");
});

Deno.test("modelRouter — max tokens for advice is 120", () => {
  assertEquals(getMaxTokensForAction("advice"), 120);
});

Deno.test("modelRouter — max tokens for chat is 250", () => {
  assertEquals(getMaxTokensForAction("chat"), 250);
});

Deno.test("modelRouter — max tokens for report-analysis is 500", () => {
  assertEquals(getMaxTokensForAction("report-analysis"), 500);
});

Deno.test("modelRouter — max tokens for agentic is 350", () => {
  assertEquals(getMaxTokensForAction("agentic"), 350);
});

Deno.test("modelRouter — unknown action falls back to fast model", () => {
  assertEquals(getModelForAction("unknown" as never), "llama-3.1-8b-instant");
});

Deno.test("modelRouter — unknown action falls back to 150 tokens", () => {
  assertEquals(getMaxTokensForAction("unknown" as never), 150);
});
