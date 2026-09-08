import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

const publicStaticPages = [
  '/',
  '/about',
  '/services',
  '/tests',
  '/tests/compare',
  '/packages',
  '/branches',
  '/contact',
  '/careers',
  '/faq',
  '/blog',
  '/privacy-policy',
  '/terms',
  '/reports',
  '/booking',
  '/home-collection',
  '/night-service',
  '/night-request',
  '/walk-in-reports',
  '/dashboard'
];

const publicApis = [
  '/api/tests',
  '/api/packages',
  '/api/services',
  '/api/branches',
  '/api/faqs',
  '/api/testimonials',
  '/api/blogs',
  '/api/homepage',
  '/api/homepage-data'
];

async function runAudit() {
  console.log('====================================================');
  console.log('🌐 AUDITING PUBLIC WEBSITE (PAGES, SLUGS & PUBLIC APIS)');
  console.log('====================================================');

  const pageResults = [];
  const apiResults = [];
  const dynamicResults = [];

  console.log('\n--- 1. Testing Static Public Pages ---');
  for (const page of publicStaticPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      const text = await res.text();
      const hasErrorOverlay = text.includes('Next.js Error') || text.includes('Unhandled Runtime Error');
      if (res.status === 200 && !hasErrorOverlay) {
        pageResults.push({ page, status: 'WORKING (200)' });
        console.log(`✅ ${page}: 200 OK (${text.length} bytes)`);
      } else {
        pageResults.push({ page, status: `ERROR (${res.status})` });
        console.log(`❌ ${page}: Status ${res.status}, errorOverlay: ${hasErrorOverlay}`);
      }
    } catch (err) {
      pageResults.push({ page, status: `FAILED: ${err.message}` });
      console.log(`❌ ${page}: FAILED - ${err.message}`);
    }
  }

  console.log('\n--- 2. Testing Public APIs ---');
  let testsData = [];
  let packagesData = [];
  let servicesData = [];
  let blogsData = [];

  for (const api of publicApis) {
    try {
      const res = await fetch(`${BASE_URL}${api}`);
      if (res.status === 200) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data.tests?.length || data.packages?.length || data.blogs?.length || data.faqs?.length || data.services?.length || Object.keys(data).length);
        if (api === '/api/tests') testsData = data.tests || data || [];
        if (api === '/api/packages') packagesData = data.packages || data || [];
        if (api === '/api/services') servicesData = data.services || data || [];
        if (api === '/api/blogs') blogsData = data.blogs || data || [];
        apiResults.push({ api, status: 'WORKING (200)', count });
        console.log(`✅ ${api}: 200 OK (count/keys: ${count})`);
      } else {
        apiResults.push({ api, status: `ERROR (${res.status})` });
        console.log(`❌ ${api}: Status ${res.status}`);
      }
    } catch (err) {
      apiResults.push({ api, status: `FAILED: ${err.message}` });
      console.log(`❌ ${api}: FAILED - ${err.message}`);
    }
  }

  console.log('\n--- 3. Testing Dynamic Slug Routes ---');
  // Test slug for test
  const testSlug = testsData[0]?.slug;
  if (testSlug) {
    const res = await fetch(`${BASE_URL}/tests/${testSlug}`);
    console.log(`${res.status === 200 ? '✅' : '❌'} /tests/${testSlug}: ${res.status}`);
    dynamicResults.push({ route: `/tests/${testSlug}`, status: res.status });
  } else {
    console.log('⚠️ No test slug found to test /tests/[slug]');
  }

  // Test slug for package
  const pkgSlug = packagesData[0]?.slug;
  if (pkgSlug) {
    const res = await fetch(`${BASE_URL}/packages/${pkgSlug}`);
    console.log(`${res.status === 200 ? '✅' : '❌'} /packages/${pkgSlug}: ${res.status}`);
    dynamicResults.push({ route: `/packages/${pkgSlug}`, status: res.status });
  } else {
    console.log('⚠️ No package slug found to test /packages/[slug]');
  }

  // Test slug for service
  const serviceSlug = servicesData[0]?.slug;
  if (serviceSlug) {
    const res = await fetch(`${BASE_URL}/services/${serviceSlug}`);
    console.log(`${res.status === 200 ? '✅' : '❌'} /services/${serviceSlug}: ${res.status}`);
    dynamicResults.push({ route: `/services/${serviceSlug}`, status: res.status });
  } else {
    console.log('⚠️ No service slug found to test /services/[slug]');
  }

  // Test slug for blog
  const blogSlug = blogsData[0]?.slug;
  if (blogSlug) {
    const res = await fetch(`${BASE_URL}/blog/${blogSlug}`);
    console.log(`${res.status === 200 ? '✅' : '❌'} /blog/${blogSlug}: ${res.status}`);
    dynamicResults.push({ route: `/blog/${blogSlug}`, status: res.status });
  } else {
    console.log('⚠️ No blog slug found to test /blog/[slug]');
  }

  console.log('\n====================================================');
  console.log('📊 PUBLIC AUDIT SUMMARY:');
  const workingPages = pageResults.filter(p => p.status.startsWith('WORKING')).length;
  const workingApis = apiResults.filter(a => a.status.startsWith('WORKING')).length;
  const workingDynamic = dynamicResults.filter(d => d.status === 200).length;
  console.log(`Public Static Pages: ${workingPages}/${pageResults.length} WORKING`);
  console.log(`Public APIs:         ${workingApis}/${apiResults.length} WORKING`);
  console.log(`Dynamic Slugs:       ${workingDynamic}/${dynamicResults.length} WORKING`);
  console.log('====================================================');
}

runAudit();
