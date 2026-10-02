/* Minimal dependency-free test runner so the financial engine can be
 * verified in any environment, even without vitest/jest installed. */
type Test = { name: string; fn: () => void };
const tests: Test[] = [];

export function test(name: string, fn: () => void) {
  tests.push({ name, fn });
}

export function run() {
  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (err) {
      fail++;
      console.log(`  ✗ ${t.name}`);
      console.log(`      ${(err as Error).message}`);
    }
  }
  console.log(`\n${pass} passed, ${fail} failed, ${tests.length} total`);
  if (fail > 0) process.exit(1);
}
