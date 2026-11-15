import assert from 'node:assert';

const MASTER_PASSWORD = 'Iker2005izan@';

function verifyPassword(pwd) {
  return pwd === MASTER_PASSWORD;
}

// Test 1: Password validation
assert.strictEqual(verifyPassword('Iker2005izan@'), true, 'Password must be valid');
assert.strictEqual(verifyPassword('wrong'), false, 'Wrong password must fail');
assert.strictEqual(verifyPassword(''), false, 'Empty password must fail');

console.log('✅ Database Master Password Unit Tests Passed Successfully!');
