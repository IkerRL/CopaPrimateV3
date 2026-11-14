import { runTier1Tests } from './tier1-features.test.mjs';
import { runTier2Tests } from './tier2-boundaries.test.mjs';
import { runTier3Tests } from './tier3-combinations.test.mjs';
import { runTier4Tests } from './tier4-scenarios.test.mjs';
import { stopTestServer } from './helpers/server-fixture.mjs';
import { backupDataFiles, restoreDataFiles } from './helpers/data-backup.mjs';

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(a => a.startsWith('--tier='));
  const selectedTier = tierArg ? tierArg.split('=')[1] : null;

  console.log('\n===============================================================');
  console.log('🏆 COPA PRIMATE VOL. III - COMPREHENSIVE E2E TEST SUITE');
  console.log('   Opaque-Box Automated Verification (Tiers 1 to 4)');
  console.log('===============================================================\n');

  backupDataFiles();
  const startTime = Date.now();
  const tierSummaries = [];

  try {
    if (!selectedTier || selectedTier === '1') {
      const s1 = await runTier1Tests();
      tierSummaries.push(s1);
    }

    if (!selectedTier || selectedTier === '2') {
      const s2 = await runTier2Tests();
      tierSummaries.push(s2);
    }

    if (!selectedTier || selectedTier === '3') {
      const s3 = await runTier3Tests();
      tierSummaries.push(s3);
    }

    if (!selectedTier || selectedTier === '4') {
      const s4 = await runTier4Tests();
      tierSummaries.push(s4);
    }
  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
  } finally {
    await stopTestServer();
    restoreDataFiles();
  }

  const totalDuration = Date.now() - startTime;
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  console.log('\n===============================================================');
  console.log('📊 TEST SUITE EXECUTION SUMMARY');
  console.log('===============================================================');

  for (const s of tierSummaries) {
    grandTotal += s.total;
    grandPassed += s.passed;
    grandFailed += s.failed;

    const rate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : 0;
    const mark = s.failed === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${mark} [${s.name}]`);
    console.log(`     Passed: ${s.passed}/${s.total} (${rate}%) | Failed: ${s.failed}`);

    for (const r of s.results) {
      if (r.status === 'FAIL') {
        console.log(`     ❌ ${r.name}`);
        const errMsg = r.error ? r.error.split('\n')[0] : 'Unknown error';
        console.log(`        Reason: ${errMsg}`);
      }
    }
  }

  const overallRate = grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : 0;
  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL SUITE RESULTS: ${grandPassed}/${grandTotal} passed (${overallRate}%)`);
  console.log(`TOTAL DURATION:      ${totalDuration}ms`);
  console.log(`STATUS:              ${grandFailed === 0 ? 'ALL PASSED' : 'BASELINE DEFECTS DETECTED'}`);
  console.log('===============================================================\n');

  process.exit(grandFailed > 0 ? 1 : 0);
}

main();
