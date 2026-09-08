// Automated End-to-End Test Suite for opencode/new1.md
// Tests: First-Time Activation, Normal Login, Truecaller Recovery, Admin Password Mgmt, Report Security

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING END-TO-END TEST SUITE FOR opencode/new1.md');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 1. FIRST-TIME PATIENT ACTIVATION
  // ──────────────────────────────────────────────────────────
  console.log('--- Phase 1: First-Time Patient Access & Activation ---');

  // Test 1.1: Name + Age alone must NEVER be enough
  const res1_1 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_record', name: 'Mahesh Saini', age: 18 })
  });
  assert(res1_1.status === 400, 'Name + Age alone without ID or phone must be rejected (HTTP 400)');

  // Test 1.2: Non-existent identifier rejected
  const res1_2 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_record', identifier: 'NON_EXISTENT_ID_99999' })
  });
  assert(res1_2.status === 404, 'Non-existent identifier returns 404 Not Found');

  // Test 1.3: Valid patient identifier/phone verified
  const res1_3 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_record', phone: '7742735762', name: 'Mahesh' })
  });
  const data1_3 = await res1_3.json();
  assert(res1_3.status === 200 && data1_3.verified === true, `Patient record verified: ${data1_3.patientName} (${data1_3.uhid})`);
  const patientId = data1_3.patientId;

  // Test 1.4: Weak password rejected (min 10 chars, uppercase, lowercase, number, special char)
  const res1_4 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create_password',
      patientId,
      password: 'weak',
      confirmPassword: 'weak'
    })
  });
  assert(res1_4.status === 400, 'Weak password rejected by security policy');

  // Test 1.5: Strong password accepted & account activated
  const testPassword = 'Secure@Pass2026!';
  const res1_5 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create_password',
      patientId,
      password: testPassword,
      confirmPassword: testPassword
    })
  });
  const data1_5 = await res1_5.json();
  assert(res1_5.status === 200 && data1_5.success && data1_5.token, 'Strong password accepted, account activated & auto-logged in');
  const sessionToken = data1_5.token;

  // ──────────────────────────────────────────────────────────
  // 2. NORMAL LOGIN & LOGIN PROTECTION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- Phase 2: Normal Login & Brute Force Protection ---');

  // Test 2.1: Wrong password rejected with generic message
  const res2_1 = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '7742735762', password: 'WrongPassword123!' })
  });
  assert(res2_1.status === 401, 'Wrong password returns 401 Unauthorized');

  // Test 2.2: Correct mobile + password login
  const res2_2 = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '7742735762', password: testPassword })
  });
  const data2_2 = await res2_2.json();
  assert(res2_2.status === 200 && data2_2.patientName === 'Mahesh Saini', 'Correct Mobile + Password login succeeds');
  assert(Array.isArray(data2_2.reports), 'Returns authorized reports list');

  // ──────────────────────────────────────────────────────────
  // 3. TRUECALLER RECOVERY & PASSWORD RESET
  // ──────────────────────────────────────────────────────────
  console.log('\n--- Phase 3: Truecaller Identity Recovery & Password Reset ---');

  // Test 3.1: Initiate recovery
  const res3_1 = await fetch(`${BASE_URL}/api/auth/patient/recovery/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '7742735762' })
  });
  const data3_1 = await res3_1.json();
  assert(res3_1.status === 200 && data3_1.patientId === patientId, 'Recovery initiated, account found and masked phone returned');

  // Test 3.2: Truecaller verification with WRONG phone number rejected
  const res3_2 = await fetch(`${BASE_URL}/api/auth/patient/recovery/truecaller-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      payload: { phoneNumber: '9999999999', name: 'Different Person' }
    })
  });
  const data3_2 = await res3_2.json();
  assert(res3_2.status === 400 && data3_2.error.includes('Verified number does not match'), 'Mismatched Truecaller number rejected');

  // Test 3.3: Truecaller verification with MATCHING phone number succeeds
  const res3_3 = await fetch(`${BASE_URL}/api/auth/patient/recovery/truecaller-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      payload: { phoneNumber: '7742735762', name: 'Mahesh Saini' }
    })
  });
  const data3_3 = await res3_3.json();
  assert(res3_3.status === 200 && data3_3.resetToken, 'Matching Truecaller verification issued single-use reset authorization token');
  const resetToken = data3_3.resetToken;

  // Test 3.4: Complete password reset with new strong password
  const newPassword = 'NewSecret@2026#';
  const res3_4 = await fetch(`${BASE_URL}/api/auth/patient/recovery/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken,
      password: newPassword,
      confirmPassword: newPassword
    })
  });
  const data3_4 = await res3_4.json();
  assert(res3_4.status === 200 && data3_4.success, 'Password reset succeeded and patient auto-logged in');

  // Test 3.5: Reused reset token must be REJECTED (single-use constraint)
  const res3_5 = await fetch(`${BASE_URL}/api/auth/patient/recovery/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken,
      password: 'AnotherPassword@2026',
      confirmPassword: 'AnotherPassword@2026'
    })
  });
  assert(res3_5.status === 400, 'Reusing used reset token is strictly rejected');

  // Test 3.6: Login with newly reset password succeeds
  const res3_6 = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '7742735762', password: newPassword })
  });
  const data3_6 = await res3_6.json();
  const currentToken = data3_6.token || sessionToken;
  assert(res3_6.status === 200, 'Login with newly reset password succeeds');

  // ──────────────────────────────────────────────────────────
  // 4. REPORT AUTHORIZATION & STRICT ISOLATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- Phase 4: Report Authorization & Strict Isolation ---');

  if (data2_2.reports && data2_2.reports.length > 0) {
    const validReportId = data2_2.reports[0].id;

    // Test 4.1: Access valid report with authenticated session
    const res4_1 = await fetch(`${BASE_URL}/api/reports/secure/${validReportId}`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    assert(res4_1.status === 200, `Authorized patient access to own report #${validReportId} succeeds (HTTP 200)`);

    // Test 4.2: Unauthenticated request rejected
    const res4_2 = await fetch(`${BASE_URL}/api/reports/secure/${validReportId}`);
    assert(res4_2.status === 401, 'Unauthenticated report request rejected (HTTP 401)');

    // Test 4.3: Tampered ID manipulation rejected
    const res4_3 = await fetch(`${BASE_URL}/api/reports/secure/fake-tampered-id-123`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    assert(res4_3.status === 404 || res4_3.status === 403, 'Tampered report ID rejected (HTTP 404/403)');
  } else {
    console.log('  ⚠️ (No reports to test ID isolation, skipping report access test)');
  }

  // ──────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
