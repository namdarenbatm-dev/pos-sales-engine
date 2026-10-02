import assert from "node:assert/strict";
import { test, run } from "./runner";
import { formatNumber, formatToman, toFarsiDigits, toEnglishDigits, parseUserNumber, formatPercent, formatUnits, formatCompact } from "../src/utils/format";

test("formatNumber renders Persian digits with thousands separators", () => {
  assert.equal(formatNumber(11500000), "۱۱,۵۰۰,۰۰۰");
});

test("formatToman appends the currency unit", () => {
  assert.equal(formatToman(11500000), "۱۱,۵۰۰,۰۰۰ تومان");
});

test("formatNumber rounds only at display time", () => {
  assert.equal(formatNumber(1234.6), "۱,۲۳۵");
});

test("formatNumber handles negative values with a leading minus", () => {
  assert.equal(formatNumber(-420000000), "-۴۲۰,۰۰۰,۰۰۰");
});

test("formatUnits appends the device unit label", () => {
  assert.equal(formatUnits(1265), "۱,۲۶۵ دستگاه");
});

test("toFarsiDigits / toEnglishDigits round-trip", () => {
  const fa = toFarsiDigits("12345");
  assert.equal(fa, "۱۲۳۴۵");
  assert.equal(toEnglishDigits(fa), "12345");
});

test("parseUserNumber strips non-numeric characters and converts Persian digits", () => {
  assert.equal(parseUserNumber("۱۱,۵۰۰,۰۰۰ تومان"), "11500000");
});

test("formatPercent caps at two decimal places", () => {
  assert.equal(formatPercent(26), "۲۶٪");
  assert.equal(formatPercent(26.567), "۲۶٫۵۷٪");
});

test("Infinity / NaN render as an em dash, never as raw JS values", () => {
  assert.equal(formatToman(Infinity), "—");
  assert.equal(formatNumber(NaN), "—");
});

test("formatCompact shortens large numbers for chart axes (K/M/B)", () => {
  assert.equal(formatCompact(850), "۸۵۰");
  assert.equal(formatCompact(11500000), "۱۱.۵M");
  assert.equal(formatCompact(2000000000), "۲B");
  assert.equal(formatCompact(-3645000000), "-۳.۶B");
  assert.equal(formatCompact(Infinity), "—");
});

run();
