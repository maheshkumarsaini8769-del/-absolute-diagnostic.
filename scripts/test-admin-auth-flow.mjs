import 'dotenv/config';

const BASE_URL = process.env.AUDIT_TARGET_URL || 'https://lab-app-green.vercel.app';
const TEST_ADMIN_EMAIL = 'admin@absolutediagnostic.com';
const TEST_NEW_PASSWORD = 'AdminSecure@2026!';

async function runAdminAuthTests() {
  console.log('================================================================');
  console.log(`🔐 TESTING ADMIN FIRST-TIME OTP & PASSWORD LOGIN ON: ${BASE_URL}`);
  console.log('================================================================\n');

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

  // ─────────────────────────────────────────────────────────────
  // 1. SEND OTP FOR ADMIN
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Testing Admin OTP Generation ---');
  let otpCode = null;

  try {
    const sendRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_ADMIN_EMAIL })
    });

    const sendData = await sendRes.json();
    assert(sendRes.status === 200 && sendData.success, `OTP requested for ${TEST_ADMIN_EMAIL}`);
    otpCode = sendData.devOtp || null;
    if (otpCode) {
      console.log(`     (Received dev OTP code: ${otpCode})`);
    } else if (process.env.MONGODB_URI) {
      try {
        const mongoose = (await import('mongoose')).default;
        const crypto = (await import('crypto')).default;
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(process.env.MONGODB_URI);
        }
        const doc = await mongoose.connection.db.collection('adminotps').findOne(
          { email: TEST_ADMIN_EMAIL.toLowerCase().trim(), isUsed: false },
          { sort: { createdAt: -1 } }
        );
        if (doc && doc.otpHash) {
          for (let i = 100000; i <= 999999; i++) {
            const h = crypto.createHash('sha256').update(String(i)).digest('hex');
            if (h === doc.otpHash) {
              otpCode = String(i);
              console.log(`     (Resolved OTP from DB for testing: ${otpCode})`);
              break;
            }
          }
        }
      } catch (err) {
        console.warn('     Could not retrieve OTP from DB:', err.message);
      }
    }
  } catch (e) {
    assert(false, `OTP send failed: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERIFY OTP
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Admin OTP Verification ---');
  let tempToken = null;
  let sessionCookie = null;

  if (otpCode) {
    try {
      const verifyRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_ADMIN_EMAIL, otp: otpCode })
      });

      const verifyData = await verifyRes.json();
      sessionCookie = verifyRes.headers.get('set-cookie');
      tempToken = verifyData.tempToken || null;

      assert(verifyRes.status === 200 && verifyData.success, `OTP verified for ${TEST_ADMIN_EMAIL} (admin: ${verifyData.admin?.name})`);
      assert(!!sessionCookie, 'Session cookie issued upon OTP verification');
    } catch (e) {
      assert(false, `OTP verify failed: ${e.message}`);
    }
  } else {
    console.log('  ⚠️ (Skipping OTP verify as OTP was sent via email only)');
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SET / CREATE ADMIN PASSWORD
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Set / Create Admin Password ---');
  try {
    // 3.1 Reject mismatching passwords
    const resMismatch = await fetch(`${BASE_URL}/api/auth/admin/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
      },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_NEW_PASSWORD,
        confirmPassword: 'MismatchPassword123!',
        tempToken
      })
    });
    assert(resMismatch.status === 400, 'Reject mismatching passwords (HTTP 400)');

    // 3.2 Reject weak password (< 8 chars)
    const resWeak = await fetch(`${BASE_URL}/api/auth/admin/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
      },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: 'short',
        confirmPassword: 'short',
        tempToken
      })
    });
    assert(resWeak.status === 400, 'Reject weak password under 8 chars (HTTP 400)');

    // 3.3 Set valid strong password
    const resSet = await fetch(`${BASE_URL}/api/auth/admin/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
      },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_NEW_PASSWORD,
        confirmPassword: TEST_NEW_PASSWORD,
        tempToken
      })
    });
    const setData = await resSet.json();
    assert(resSet.status === 200 && setData.success, `New password successfully created & saved: ${setData.message}`);
  } catch (e) {
    assert(false, `Set password failed: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SIGN IN WITH NEW PASSWORD
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Password Login Flow ---');
  let authCookie = null;

  try {
    // 4.1 Reject invalid password
    const resWrong = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: 'WrongPassword999!'
      })
    });
    assert(resWrong.status === 401, 'Reject incorrect password (HTTP 401 Unauthorized)');

    // 4.2 Sign in with correct new password
    const resLogin = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_NEW_PASSWORD
      })
    });
    const loginData = await resLogin.json();
    authCookie = resLogin.headers.get('set-cookie');

    assert(resLogin.status === 200 && loginData.success, `Successfully signed in with new password! Redirect: ${loginData.redirectUrl}`);
    assert(!!authCookie, 'Session cookie received for direct password login');

    // 4.3 Test alias /api/auth/login
    const resAlias = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_NEW_PASSWORD
      })
    });
    assert(resAlias.status === 200, 'Alias endpoint /api/auth/login also works (HTTP 200 OK)');
  } catch (e) {
    assert(false, `Password login failed: ${e.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ACCESS PROTECTED ADMIN PANEL WITH PASSWORD SESSION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Verifying Admin Dashboard Session Access ---');
  if (authCookie) {
    try {
      const match = authCookie.match(/session_token=([^;]+)/);
      const tokenVal = match ? match[1] : '';

      const testRes = await fetch(`${BASE_URL}/api/admin/bookings?limit=3`, {
        headers: {
          'Cookie': `session_token=${tokenVal}`,
          'Authorization': `Bearer ${tokenVal}`
        }
      });
      const testData = await testRes.json();
      assert(testRes.status === 200 && Array.isArray(testData.bookings), `Protected admin API accessible via password session (found ${testData.bookings?.length} bookings)`);
    } catch (e) {
      assert(false, `Protected API access failed: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`📊 ADMIN AUTHENTICATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (_) {}

  process.exit(failed > 0 ? 1 : 0);
}

runAdminAuthTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
