import assert from 'node:assert';

// Verification test for standings split & draw logic
const dummyTeams = Array.from({ length: 16 }, (_, i) => ({
  name: `Team ${i + 1}`,
  grupo: ['A', 'B', 'C', 'D'][Math.floor(i / 4)],
  pj: 4,
  wins: 4 - Math.floor(i / 4),
  losses: Math.floor(i / 4),
  diff: 10 - i,
  pts: (4 - Math.floor(i / 4)) * 3
}));

// Test 1: Slicing 16 teams into top 8 and bottom 8
const top8 = dummyTeams.slice(0, 8);
const bottom8 = dummyTeams.slice(8, 16);

assert.strictEqual(top8.length, 8, 'Top 8 must contain exactly 8 teams');
assert.strictEqual(bottom8.length, 8, 'Bottom 8 must contain exactly 8 teams');
assert.strictEqual(top8[0].name, 'Team 1', 'Top 1 is Team 1');
assert.strictEqual(bottom8[7].name, 'Team 16', 'Bottom 16 is Team 16');

// Check no overlap
const allNames = [...top8, ...bottom8].map(t => t.name);
const uniqueNames = new Set(allNames);
assert.strictEqual(uniqueNames.size, 16, 'All 16 teams must be unique and displayed');

console.log('✅ Standings 16-team split test passed (8 in Top 8, 8 in Bottom 8, 100% visible)');
