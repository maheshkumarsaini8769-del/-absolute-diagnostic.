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

const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`,
  'Cookie': `session_token=${adminToken}`
};

async function runSyncAudit() {
  console.log('====================================================');
  console.log('🔄 AUDITING ADMIN -> DB -> PUBLIC WEBSITE DYNAMIC SYNC');
  console.log('====================================================\n');

  const results = [];

  // ─────────────────────────────────────────────────────────────
  // 1. TEST DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Testing "Test" Dynamic Synchronization ---');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/tests`, { headers: adminHeaders });
    const { tests } = await listRes.json();
    const testItem = tests.find(t => t.isActive && t.slug);

    if (!testItem) {
      throw new Error('No active test found with a slug');
    }

    const testId = testItem.id;
    const origPrice = testItem.price;
    const testNewPrice = origPrice + 19;

    console.log(`Target Test: "${testItem.name}" (Slug: ${testItem.slug}), Original Price: ₹${origPrice}`);

    // Update in Admin
    const updateRes = await fetch(`${BASE_URL}/api/admin/tests/${testId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ price: testNewPrice })
    });
    if (!updateRes.ok) throw new Error(`Admin update test failed: ${updateRes.status}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/tests`);
    const pubApiData = await pubApiRes.json();
    const pubTestFromApi = (pubApiData.tests || pubApiData).find(t => t.id === testId || t.slug === testItem.slug);
    const pubApiMatched = pubTestFromApi && pubTestFromApi.price === testNewPrice;

    // Verify on Public HTML Page
    const pubPageRes = await fetch(`${BASE_URL}/tests/${testItem.slug}`);
    const pubPageHtml = await pubPageRes.text();
    const pubHtmlMatched = pubPageHtml.includes(String(testNewPrice));

    console.log(`- Updated to ₹${testNewPrice}`);
    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public Slug page (${testItem.slug}) sync verified: ${pubHtmlMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Restore original price
    const restoreRes = await fetch(`${BASE_URL}/api/admin/tests/${testId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ price: origPrice })
    });
    console.log(`- Restored original price: ₹${origPrice} (${restoreRes.ok ? '✅ RESTORED' : '❌ ERROR'})`);

    results.push({
      feature: 'Tests Dynamic Sync',
      status: (pubApiMatched && pubHtmlMatched && restoreRes.ok) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Test sync error:', err.message);
    results.push({ feature: 'Tests Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PACKAGE DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing "Package" Dynamic Synchronization ---');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/packages`, { headers: adminHeaders });
    const { packages } = await listRes.json();
    const pkgItem = packages.find(p => p.isActive && p.slug);

    if (!pkgItem) {
      throw new Error('No active package found with a slug');
    }

    const pkgId = pkgItem.id;
    const origPrice = pkgItem.price;
    const pkgNewPrice = origPrice + 29;

    console.log(`Target Package: "${pkgItem.name}" (Slug: ${pkgItem.slug}), Original Price: ₹${origPrice}`);

    // Update in Admin
    const updateRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ price: pkgNewPrice })
    });
    if (!updateRes.ok) throw new Error(`Admin update package failed: ${updateRes.status}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/packages`);
    const pubApiData = await pubApiRes.json();
    const pubPkgFromApi = (pubApiData.packages || pubApiData).find(p => p.id === pkgId || p.slug === pkgItem.slug);
    const pubApiMatched = pubPkgFromApi && pubPkgFromApi.price === pkgNewPrice;

    // Verify on Public HTML Page
    const pubPageRes = await fetch(`${BASE_URL}/packages/${pkgItem.slug}`);
    const pubPageHtml = await pubPageRes.text();
    const pubHtmlMatched = pubPageHtml.includes(String(pkgNewPrice));

    console.log(`- Updated to ₹${pkgNewPrice}`);
    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public Slug page (${pkgItem.slug}) sync verified: ${pubHtmlMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Restore original price
    const restoreRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ price: origPrice })
    });
    console.log(`- Restored original price: ₹${origPrice} (${restoreRes.ok ? '✅ RESTORED' : '❌ ERROR'})`);

    results.push({
      feature: 'Packages Dynamic Sync',
      status: (pubApiMatched && pubHtmlMatched && restoreRes.ok) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Package sync error:', err.message);
    results.push({ feature: 'Packages Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SERVICE DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing "Service" Dynamic Synchronization ---');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/services`, { headers: adminHeaders });
    const { services } = await listRes.json();
    const srvItem = services.find(s => s.isActive && s.slug);

    if (!srvItem) {
      throw new Error('No active service found with a slug');
    }

    const srvId = srvItem.id;
    const origDesc = srvItem.description || '';
    const testMarker = ` [Sync Verified ${Date.now().toString().slice(-4)}]`;
    const newDesc = origDesc + testMarker;

    console.log(`Target Service: "${srvItem.title || srvItem.name}" (Slug: ${srvItem.slug})`);

    // Update in Admin
    const updateRes = await fetch(`${BASE_URL}/api/admin/services/${srvId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ description: newDesc })
    });
    if (!updateRes.ok) throw new Error(`Admin update service failed: ${updateRes.status}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/services`);
    const pubApiData = await pubApiRes.json();
    const pubSrvFromApi = (pubApiData.services || pubApiData).find(s => s.id === srvId || s.slug === srvItem.slug);
    const pubApiMatched = pubSrvFromApi && (pubSrvFromApi.description || '').includes(testMarker);

    // Verify on Public HTML Page
    const pubPageRes = await fetch(`${BASE_URL}/services/${srvItem.slug}`);
    const pubPageHtml = await pubPageRes.text();
    const pubHtmlMatched = pubPageHtml.includes(testMarker.trim());

    console.log(`- Updated description with test marker: "${testMarker.trim()}"`);
    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public Slug page (${srvItem.slug}) sync verified: ${pubHtmlMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Restore original description
    const restoreRes = await fetch(`${BASE_URL}/api/admin/services/${srvId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ description: origDesc })
    });
    console.log(`- Restored original description (${restoreRes.ok ? '✅ RESTORED' : '❌ ERROR'})`);

    results.push({
      feature: 'Services Dynamic Sync',
      status: (pubApiMatched && pubHtmlMatched && restoreRes.ok) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Service sync error:', err.message);
    results.push({ feature: 'Services Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. BRANCH DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing "Branch" Dynamic Synchronization ---');
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/branches`, { headers: adminHeaders });
    const { branches } = await listRes.json();
    const branchItem = branches.find(b => b.isActive);

    if (!branchItem) {
      throw new Error('No active branch found');
    }

    const branchId = branchItem.id;
    const origPhone = branchItem.phone || '+91 141 2987654';
    const testPhone = '9876543299';

    console.log(`Target Branch: "${branchItem.name}", Original Phone: ${origPhone}`);

    // Update in Admin
    const updateRes = await fetch(`${BASE_URL}/api/admin/branches/${branchId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ phone: testPhone })
    });
    if (!updateRes.ok) throw new Error(`Admin update branch failed: ${updateRes.status}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/branches`);
    const pubApiData = await pubApiRes.json();
    const pubBranchFromApi = (pubApiData.branches || pubApiData).find(b => b.id === branchId);
    const pubApiMatched = pubBranchFromApi && pubBranchFromApi.phone === testPhone;

    // Verify on Public HTML Page
    const pubPageRes = await fetch(`${BASE_URL}/branches`);
    const pubPageHtml = await pubPageRes.text();
    const pubHtmlMatched = pubPageHtml.includes(testPhone);

    console.log(`- Updated phone to: ${testPhone}`);
    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public /branches page sync verified: ${pubHtmlMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Restore original phone
    const restoreRes = await fetch(`${BASE_URL}/api/admin/branches/${branchId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ phone: origPhone })
    });
    console.log(`- Restored original phone (${restoreRes.ok ? '✅ RESTORED' : '❌ ERROR'})`);

    results.push({
      feature: 'Branches Dynamic Sync',
      status: (pubApiMatched && pubHtmlMatched && restoreRes.ok) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Branch sync error:', err.message);
    results.push({ feature: 'Branches Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. FAQ DYNAMIC SYNC (Create -> Verify Public -> Delete -> Verify Removed)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing "FAQ" Dynamic Synchronization ---');
  try {
    const testQuestion = `Audit Verification: How fast are test samples processed? [${Date.now()}]`;
    const testAnswer = 'Standard blood counts are completed within 2 hours of arrival at central lab.';

    // Create FAQ in Admin
    const createRes = await fetch(`${BASE_URL}/api/admin/faqs`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        question: testQuestion,
        answer: testAnswer,
        category: 'General',
        displayOrder: 99
      })
    });
    if (!createRes.ok) throw new Error(`Admin create FAQ failed: ${createRes.status}`);
    const { faq } = await createRes.json();
    console.log(`- Created Test FAQ ID: ${faq.id}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/faqs`);
    const pubApiData = await pubApiRes.json();
    const pubFaqFromApi = (pubApiData.faqs || pubApiData).find(f => f.id === faq.id || f.question === testQuestion);
    const pubApiMatched = !!pubFaqFromApi;

    // Verify on Public /faq HTML Page
    const pubPageRes = await fetch(`${BASE_URL}/faq`);
    const pubPageHtml = await pubPageRes.text();
    const pubHtmlMatched = pubPageHtml.includes(testQuestion);

    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public /faq page sync verified: ${pubHtmlMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Delete the test FAQ
    const deleteRes = await fetch(`${BASE_URL}/api/admin/faqs/${faq.id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    console.log(`- Deleted Test FAQ (${deleteRes.ok ? '✅ DELETED' : '❌ ERROR'})`);

    // Verify removal
    const postDelRes = await fetch(`${BASE_URL}/api/faqs`);
    const postDelData = await postDelRes.json();
    const stillPresent = (postDelData.faqs || postDelData).some(f => f.id === faq.id);
    console.log(`- Verified clean removal from public API: ${!stillPresent ? '✅ VERIFIED' : '❌ STILL PRESENT'}`);

    results.push({
      feature: 'FAQs Dynamic Sync',
      status: (pubApiMatched && pubHtmlMatched && deleteRes.ok && !stillPresent) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('FAQ sync error:', err.message);
    results.push({ feature: 'FAQs Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. BLOG DYNAMIC SYNC (Create -> Verify Public -> Delete -> Verify Removed)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing "Blog" Dynamic Synchronization ---');
  try {
    const testSlug = `audit-test-blog-${Date.now()}`;
    const testTitle = `Modern Clinical Diagnostic Innovations`;
    const testContent = '<p>Demonstrating real-time database synchronization on the public blog.</p>';

    // Create Blog in Admin
    const createRes = await fetch(`${BASE_URL}/api/admin/blogs`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: testTitle,
        slug: testSlug,
        content: testContent,
        excerpt: 'Audit test blog excerpt for dynamic sync verification.',
        author: 'Dr. Clinical Pathologist',
        isActive: true,
        tags: ['Diagnostics', 'Audit']
      })
    });
    if (!createRes.ok) throw new Error(`Admin create Blog failed: ${createRes.status}`);
    const { blog } = await createRes.json();
    console.log(`- Created Test Blog ID: ${blog.id}, Slug: ${testSlug}`);

    // Verify on Public API
    const pubApiRes = await fetch(`${BASE_URL}/api/blogs`);
    const pubApiData = await pubApiRes.json();
    const pubBlogFromApi = (pubApiData.blogs || pubApiData).find(b => b.id === blog.id || b.slug === testSlug);
    const pubApiMatched = !!pubBlogFromApi;

    // Verify on Public /blog Page
    const pubPageRes = await fetch(`${BASE_URL}/blog`);
    const pubPageHtml = await pubPageRes.text();
    const pubBlogPageMatched = pubPageHtml.includes(testTitle);

    // Verify on Public /blog/[slug] Page
    const slugPageRes = await fetch(`${BASE_URL}/blog/${testSlug}`);
    const slugPageHtml = await slugPageRes.text();
    const pubSlugMatched = slugPageRes.status === 200 && slugPageHtml.includes(testTitle);

    console.log(`- Public API sync verified: ${pubApiMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public /blog listing sync verified: ${pubBlogPageMatched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Public /blog/${testSlug} rendering verified (200 OK): ${pubSlugMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Delete the test blog
    const deleteRes = await fetch(`${BASE_URL}/api/admin/blogs/${blog.id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    console.log(`- Deleted Test Blog (${deleteRes.ok ? '✅ DELETED' : '❌ ERROR'})`);

    // Verify removal
    const postDelRes = await fetch(`${BASE_URL}/api/blogs`);
    const postDelData = await postDelRes.json();
    const stillPresent = (postDelData.blogs || postDelData).some(b => b.id === blog.id);
    console.log(`- Verified clean removal from public API: ${!stillPresent ? '✅ VERIFIED' : '❌ STILL PRESENT'}`);

    results.push({
      feature: 'Blogs Dynamic Sync',
      status: (pubApiMatched && pubBlogPageMatched && pubSlugMatched && deleteRes.ok && !stillPresent) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Blog sync error:', err.message);
    results.push({ feature: 'Blogs Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. SETTINGS DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing "Settings" Dynamic Synchronization ---');
  try {
    const getSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders });
    const { settings } = await getSettingsRes.json();
    const testKey = 'home_collection_charge';
    const origValue = settings[testKey] || '100';
    const testNewValue = '125';

    console.log(`Target Setting: "${testKey}", Original Value: ${origValue}`);

    // Update in Admin
    const updateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        settings: [
          { key: testKey, value: testNewValue, type: 'number' }
        ]
      })
    });
    if (!updateRes.ok) throw new Error(`Admin update settings failed: ${updateRes.status}`);

    // Verify via GET settings
    const verifyRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders });
    const verifyData = await verifyRes.json();
    const updatedMatched = verifyData.settings?.[testKey] === testNewValue;
    console.log(`- Verified updated setting value: ${updatedMatched ? '✅ PASS' : '❌ FAIL'}`);

    // Restore original setting
    const restoreRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        settings: [
          { key: testKey, value: origValue, type: 'number' }
        ]
      })
    });
    console.log(`- Restored original setting value (${restoreRes.ok ? '✅ RESTORED' : '❌ ERROR'})`);

    results.push({
      feature: 'Settings Dynamic Sync',
      status: (updatedMatched && restoreRes.ok) ? 'PASSED' : 'FAILED'
    });
  } catch (err) {
    console.error('Settings sync error:', err.message);
    results.push({ feature: 'Settings Dynamic Sync', status: 'FAILED', error: err.message });
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('📊 DYNAMIC SYNCHRONIZATION AUDIT SUMMARY');
  console.log('====================================================');
  results.forEach(r => {
    console.log(`${r.status === 'PASSED' ? '✅' : '❌'} ${r.feature}: ${r.status}${r.error ? ` (${r.error})` : ''}`);
  });
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  console.log(`Total: ${passedCount}/${results.length} Dynamic Features Synchronized & Restored.`);
  console.log('====================================================');
}

runSyncAudit();
