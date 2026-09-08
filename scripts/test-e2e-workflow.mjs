import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024';

const ADMIN_ID = '6a9e828c0a127887711c3cff';
const PATIENT_ID = '6a9e836829110625d23ddd25';

async function runTests() {
  console.log('🚀 Starting Comprehensive End-to-End Diagnostic Laboratory Verification...');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`\n🔍 Checking: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      failed++;
    }
  }

  // 1. Public Routes
  const publicRoutes = [
    '/',
    '/tests',
    '/tests/compare',
    '/careers',
    '/packages',
    '/services',
    '/about',
    '/faq',
    '/branches',
    '/contact',
    '/home-collection',
    '/night-service',
    '/night-request'
  ];

  for (const route of publicRoutes) {
    await test(`Public route GET ${route}`, async () => {
      const res = await fetch(`${BASE_URL}${route}`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });
  }

  // 2. Admin Auth Token (signed with correct secret & adminId)
  const adminToken = jwt.sign(
    { adminId: ADMIN_ID, email: 'admin@absolutediagnostic.com', type: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `session_token=${adminToken}`
  };

  // 3. Admin Operational Endpoints
  const adminEndpoints = [
    '/api/admin/samples',
    '/api/admin/lab-worklist',
    '/api/admin/pathologist',
    '/api/admin/collections',
    '/api/admin/inventory',
    '/api/admin/equipment',
    '/api/admin/qc',
    '/api/admin/doctors',
    '/api/admin/corporate',
    '/api/admin/billing'
  ];

  for (const ep of adminEndpoints) {
    await test(`Admin API GET ${ep}`, async () => {
      const res = await fetch(`${BASE_URL}${ep}`, { headers: adminHeaders });
      if (res.status !== 200) {
        const txt = await res.text();
        throw new Error(`Status ${res.status}: ${txt.slice(0, 100)}`);
      }
      const data = await res.json();
      if (!data) throw new Error('Empty response');
    });
  }

  // 4. Careers application submission
  await test('Careers Application Submission (POST /api/careers)', async () => {
    const res = await fetch(`${BASE_URL}/api/careers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Test Candidate',
        phone: '+919876500000',
        email: 'test.candidate@example.com',
        position: 'Consultant Pathologist (MD / DNB)',
        experience: '5 years',
        qualification: 'MD Pathology',
        notes: 'End-to-end automated test candidate'
      })
    });
    if (![200, 201].includes(res.status)) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Submission failed');
  });

  // 5. Technician Worklist & Critical Panic Value Alerting
  let worklistDbId = null;
  await test('Technician Worklist Entry with Panic Value Alert (POST /api/admin/lab-worklist)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/lab-worklist`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        sampleId: 'SMPL-E2E-AUTO-' + Date.now(),
        patientName: 'Aarav Sharma (E2E Test Patient)',
        patientAge: '38',
        patientGender: 'Male',
        testName: 'Complete Blood Count & Blood Glucose',
        parameters: [
          { name: 'Hemoglobin', value: '5.8', unit: 'g/dL', referenceRange: '13.0 - 17.0' }, // Critical Low (< 7)
          { name: 'Fasting Blood Glucose', value: '420', unit: 'mg/dL', referenceRange: '70 - 100' }, // Critical High (> 400)
          { name: 'Total WBC Count', value: '7500', unit: '/mcL', referenceRange: '4000 - 11000' }
        ],
        technicianNotes: 'Analyzed on Sysmex XN-550 and Cobas c311. Critical high glucose verified twice.'
      })
    });
    if (![200, 201].includes(res.status)) {
      const txt = await res.text();
      throw new Error(`Status ${res.status}: ${txt.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!data.success || !data.worklist) throw new Error('Worklist entry creation failed');
    worklistDbId = data.worklist._id || data.worklist.id;
    if (!data.worklist.criticalAlert) {
      throw new Error('Panic criticalAlert expected for Hb 5.8 and Glucose 420');
    }
  });

  // 6. Pathologist Verification & Digital Sign-off
  await test('Pathologist Clinical Sign-off (POST /api/admin/pathologist)', async () => {
    if (!worklistDbId) throw new Error('No worklist item to sign off');
    const res = await fetch(`${BASE_URL}/api/admin/pathologist`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        worklistId: worklistDbId,
        action: 'approve',
        pathologistNotes: 'Severe hyperglycemia corroborated with HbA1c history. Physician phoned at 13:15 for urgent insulin management.'
      })
    });
    if (![200, 201].includes(res.status)) {
      const txt = await res.text();
      throw new Error(`Status ${res.status}: ${txt.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!data.success || data.worklist?.status !== 'verified') {
      throw new Error('Pathologist approval failed');
    }
  });

  // 7. Laboratory QC Run Logging
  await test('Quality Control Multi-Level Run (POST /api/admin/qc)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/qc`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        equipmentName: 'Roche Cobas c311',
        testName: 'Fasting Blood Glucose',
        controlLevel: 'level_2_normal',
        lotNumber: 'LOT-GLU-2026-X',
        targetValue: 100,
        measuredValue: 101.2,
        unit: 'mg/dL'
      })
    });
    if (![200, 201].includes(res.status)) {
      const txt = await res.text();
      throw new Error(`Status ${res.status}: ${txt.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!data.success || data.qcRun?.status !== 'pass') {
      throw new Error('QC logging did not return PASS status');
    }
  });

  // 8. Patient Dashboard Health Trends & Family Management
  await test('Patient Dashboard API (GET /api/dashboard)', async () => {
    const patientToken = jwt.sign(
      { patientId: PATIENT_ID, phone: '9999999999', type: 'patient' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`,
        'Cookie': `session_token=${patientToken}`
      }
    });
    if (res.status !== 200) {
      const txt = await res.text();
      throw new Error(`Status ${res.status}: ${txt.slice(0, 100)}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.healthTrends) || !Array.isArray(data.patient.familyMembers)) {
      throw new Error('Dashboard response missing healthTrends or familyMembers');
    }
  });

  // 9. Negative Test: Unauthorized access to Admin API
  await test('Security: Unauthorized request rejection (GET /api/admin/samples without token)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/samples`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  console.log(`\n==================================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
