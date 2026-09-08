import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024';
const ADMIN_ID = '6a9e828c0a127887711c3cff';

const adminToken = jwt.sign(
  { adminId: ADMIN_ID, email: 'admin@absolutediagnostic.com', type: 'admin' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`,
  'Cookie': `session_token=${adminToken}`
};

const adminPages = [
  '/admin/dashboard',
  '/admin/bookings',
  '/admin/collections',
  '/admin/samples',
  '/admin/lab-worklist',
  '/admin/pathologist',
  '/admin/reports',
  '/admin/tests',
  '/admin/packages',
  '/admin/services',
  '/admin/branches',
  '/admin/qc',
  '/admin/inventory',
  '/admin/equipment',
  '/admin/patients',
  '/admin/doctors',
  '/admin/corporate',
  '/admin/billing',
  '/admin/notifications',
  '/admin/cms',
  '/admin/media',
  '/admin/faqs',
  '/admin/testimonials',
  '/admin/blogs',
  '/admin/authorized-admins',
  '/admin/devices',
  '/admin/settings',
  '/admin/audit',
  '/admin/login'
];

const adminApis = [
  { name: 'Analytics', url: '/api/admin/analytics' },
  { name: 'Bookings', url: '/api/admin/bookings' },
  { name: 'Collections', url: '/api/admin/collections' },
  { name: 'Samples', url: '/api/admin/samples' },
  { name: 'Lab Worklist', url: '/api/admin/lab-worklist' },
  { name: 'Pathologist', url: '/api/admin/pathologist' },
  { name: 'Reports', url: '/api/admin/reports' },
  { name: 'Tests', url: '/api/admin/tests' },
  { name: 'Packages', url: '/api/admin/packages' },
  { name: 'Services', url: '/api/admin/services' },
  { name: 'Branches', url: '/api/admin/branches' },
  { name: 'QC', url: '/api/admin/qc' },
  { name: 'Inventory', url: '/api/admin/inventory' },
  { name: 'Equipment', url: '/api/admin/equipment' },
  { name: 'Patients', url: '/api/admin/patients' },
  { name: 'Doctors', url: '/api/admin/doctors' },
  { name: 'Corporate', url: '/api/admin/corporate' },
  { name: 'Billing', url: '/api/admin/billing' },
  { name: 'Notifications', url: '/api/admin/notifications' },
  { name: 'CMS', url: '/api/admin/cms' },
  { name: 'Media', url: '/api/admin/media' },
  { name: 'FAQs', url: '/api/admin/faqs' },
  { name: 'Testimonials', url: '/api/admin/testimonials' },
  { name: 'Blogs', url: '/api/admin/blogs' },
  { name: 'Authorized Admins', url: '/api/admin/authorized-admins' },
  { name: 'Devices', url: '/api/admin/devices' },
  { name: 'Settings', url: '/api/admin/settings' },
  { name: 'Audit', url: '/api/admin/audit' },
  { name: 'Search', url: '/api/admin/search?q=blood' },
  { name: 'Roles', url: '/api/admin/roles' }
];

async function runAudit() {
  console.log('====================================================');
  console.log('📋 AUDITING FULL ADMIN PANEL (PAGES & APIS)');
  console.log('====================================================');

  const pageResults = [];
  const apiResults = [];

  console.log('\n--- 1. Testing Admin Pages (HTML Rendering) ---');
  for (const page of adminPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`, { headers });
      if (res.status === 200) {
        pageResults.push({ page, status: 'WORKING (200)' });
        console.log(`✅ ${page}: 200 OK`);
      } else {
        pageResults.push({ page, status: `ERROR (${res.status})` });
        console.log(`❌ ${page}: Status ${res.status}`);
      }
    } catch (err) {
      pageResults.push({ page, status: `FAILED: ${err.message}` });
      console.log(`❌ ${page}: FAILED - ${err.message}`);
    }
  }

  console.log('\n--- 2. Testing Admin REST APIs (Data Endpoints) ---');
  for (const api of adminApis) {
    try {
      const res = await fetch(`${BASE_URL}${api.url}`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        const keys = Object.keys(data).slice(0, 3).join(', ');
        apiResults.push({ name: api.name, url: api.url, status: 'WORKING (200)', sampleKeys: keys });
        console.log(`✅ [${api.name}] ${api.url}: 200 OK -> keys: [${keys}]`);
      } else {
        const txt = await res.text();
        apiResults.push({ name: api.name, url: api.url, status: `ERROR (${res.status})`, error: txt.slice(0, 80) });
        console.log(`❌ [${api.name}] ${api.url}: Status ${res.status}`);
      }
    } catch (err) {
      apiResults.push({ name: api.name, url: api.url, status: `FAILED`, error: err.message });
      console.log(`❌ [${api.name}] ${api.url}: FAILED - ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY:');
  const workingPages = pageResults.filter(p => p.status.startsWith('WORKING')).length;
  const workingApis = apiResults.filter(a => a.status.startsWith('WORKING')).length;
  console.log(`Admin Pages: ${workingPages}/${pageResults.length} WORKING`);
  console.log(`Admin APIs:  ${workingApis}/${apiResults.length} WORKING`);
  console.log('====================================================');
}

runAudit();
