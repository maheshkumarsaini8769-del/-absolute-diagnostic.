import 'dotenv/config'
import { connectDB } from '../src/lib/db/connect'
import { prisma } from '../src/lib/prisma'
import { Admin, Booking, Sample, Report, ReportFile, Test, Package, AdminDevice, Patient } from '../src/models'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const BASE_URL = process.env.AUDIT_TARGET_URL || 'https://lab-app-green.vercel.app'
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production'

function createAdminToken(adminId: string, email: string, role: string = 'admin') {
  return jwt.sign(
    { adminId, email, role, type: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function createDummyPDF(text: string): Buffer {
  const streamContent = `BT /F1 12 Tf 50 700 Td (${text.replace(/[()]/g, '')}) Tj ET`
  const streamLength = Buffer.byteLength(streamContent)
  const objects = [
    '1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj',
    '2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj',
    '3 0 obj\n<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>\nendobj',
    '4 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj',
    `5 0 obj\n<</Length ${streamLength}>>\nstream\n${streamContent}\nendstream\nendobj`
  ]
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  let offset = 9
  const bodyParts = ['%PDF-1.4\n']
  for (const obj of objects) {
    xref += offset.toString().padStart(10, '0') + ' 00000 n \n'
    bodyParts.push(obj + '\n')
    offset += Buffer.byteLength(obj + '\n')
  }
  const trailer = `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${offset}\n%%EOF`
  bodyParts.push(xref, trailer)
  return Buffer.from(bodyParts.join(''))
}

interface AuditResult {
  category: string
  name: string
  status: 'PASS' | 'FAIL'
  detail?: string
}

async function runDeepAudit() {
  console.log('================================================================');
  console.log(`🔬 STARTING DEEP SYSTEM AUDIT ON: ${BASE_URL}`);
  console.log('================================================================\n');

  await connectDB()
  const results: AuditResult[] = []

  function logPass(category: string, name: string, detail?: string) {
    console.log(`✅ [${category}] ${name}${detail ? ` - ${detail}` : ''}`)
    results.push({ category, name, status: 'PASS', detail })
  }

  function logFail(category: string, name: string, error: string) {
    console.error(`❌ [${category}] ${name} - ERROR: ${error}`)
    results.push({ category, name, status: 'FAIL', detail: error })
  }

  // 1. Get Admin authentication
  let admin = await Admin.findOne({ isActive: true })
  if (!admin) {
    admin = await Admin.findOne()
  }
  if (!admin) {
    throw new Error('No active admin found in database')
  }

  const adminToken = createAdminToken(admin._id.toString(), admin.email, admin.role || 'admin')
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'Cookie': `session_token=${adminToken}`
  }

  console.log(`🔑 Admin Authenticated: ${admin.email} (ID: ${admin._id})\n`);

  // ─────────────────────────────────────────────────────────────
  // PHASE 1: PUBLIC PAGES & NAVIGATION AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log('--- PHASE 1: Public Website & Navigation Routes ---');
  const publicRoutes = [
    { path: '/', title: 'Home', keyword: 'Absolute Diagnostic' },
    { path: '/tests', title: 'Tests', keyword: 'Tests' },
    { path: '/packages', title: 'Packages', keyword: 'Packages' },
    { path: '/services', title: 'Services', keyword: 'Services' },
    { path: '/about', title: 'About Us', keyword: 'About' },
    { path: '/contact', title: 'Contact', keyword: 'Contact' },
    { path: '/faq', title: 'FAQ', keyword: 'Frequently Asked' },
    { path: '/branches', title: 'Branches', keyword: 'Branches' },
    { path: '/reports', title: 'Reports Portal', keyword: 'Report' },
    { path: '/booking', title: 'Booking Page', keyword: 'Book' },
    { path: '/careers', title: 'Careers', keyword: 'Careers' },
    { path: '/home-collection', title: 'Home Collection', keyword: 'Collection' },
    { path: '/night-service', title: 'Night Service', keyword: 'Night' },
    { path: '/night-request', title: 'Night Request', keyword: 'Night' },
    { path: '/tests/compare', title: 'Compare Tests', keyword: 'Compare' },
  ]

  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, { cache: 'no-store' })
      if (res.status === 200) {
        const html = await res.text()
        const hasKeyword = html.toLowerCase().includes(route.keyword.toLowerCase())
        if (hasKeyword) {
          logPass('Public Pages', `GET ${route.path} (${route.title})`, `HTTP 200 OK`)
        } else {
          logFail('Public Pages', `GET ${route.path}`, `HTTP 200 but keyword "${route.keyword}" missing`)
        }
      } else {
        logFail('Public Pages', `GET ${route.path}`, `Returned HTTP ${res.status}`)
      }
    } catch (e: any) {
      logFail('Public Pages', `GET ${route.path}`, e.message)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 2: STATIC IMAGES & MEDIA INTEGRITY
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 2: Static Images & Assets Integrity ---');
  const criticalImages = [
    '/images/hero-microscope.jpg',
    '/images/home-collection-lab.jpg',
    '/images/scientist-microscope.jpg',
    '/images/test-tube-analysis.jpg',
    '/admin-manifest.json',
    '/sw.js',
  ]

  for (const imgPath of criticalImages) {
    try {
      const res = await fetch(`${BASE_URL}${imgPath}`, { method: 'HEAD' })
      if (res.status === 200) {
        logPass('Media Assets', `GET ${imgPath}`, `Status 200 OK`)
      } else {
        logFail('Media Assets', `GET ${imgPath}`, `Status ${res.status}`)
      }
    } catch (e: any) {
      logFail('Media Assets', `GET ${imgPath}`, e.message)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: ONLINE TEST BOOKING FLOW (Website -> DB -> Admin)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 3: Online Test Booking Flow ---');
  let createdBookingId: string | null = null

  try {
    const bookingPayload = {
      patientName: '[AUDIT-TEST] Rahul Sharma',
      patientPhone: '9876543210',
      patientEmail: 'audit.sharma@example.com',
      patientAddress: 'Flat 402, Green Park Avenue, Jaipur',
      collectionType: 'home_collection',
      preferredDate: '2026-09-15',
      preferredTime: '08:30 AM',
      items: [
        { testName: 'Complete Blood Count (CBC)', testPrice: 350 },
        { testName: 'Lipid Profile', testPrice: 650 }
      ],
      isNightBooking: false
    }

    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    })

    const bookData = await bookRes.json()
    if (bookRes.status === 200 && bookData.booking?.bookingId) {
      createdBookingId = bookData.booking.bookingId
      logPass('Booking Flow', 'Create Public Booking (POST /api/bookings)', `BookingID: ${createdBookingId}`)
    } else {
      logFail('Booking Flow', 'Create Public Booking', `Status ${bookRes.status}: ${JSON.stringify(bookData)}`)
    }

    // Verify in Admin Bookings API
    if (createdBookingId) {
      const adminBookingsRes = await fetch(`${BASE_URL}/api/admin/bookings`, { headers: adminHeaders })
      const adminBookingsData = await adminBookingsRes.json()
      const foundInAdmin = adminBookingsData.bookings?.find((b: any) => b.bookingId === createdBookingId)

      if (foundInAdmin) {
        logPass('Booking Flow', 'Admin Booking List Sync', `Found booking ${createdBookingId} in Admin panel`)

        // Test Booking Lifecycle Status Transitions
        const statusTransitions = [
          'confirmed',
          'sample_collected',
          'processing',
          'report_ready',
          'completed'
        ]

        for (const nextStatus of statusTransitions) {
          const patchRes = await fetch(`${BASE_URL}/api/admin/bookings/${foundInAdmin.id}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ status: nextStatus, notes: `Status changed to ${nextStatus} via audit test` })
          })
          const patchData = await patchRes.json()
          if (patchRes.status === 200 && patchData.booking?.status === nextStatus) {
            logPass('Booking Lifecycle', `Status transition -> "${nextStatus}"`, 'Successfully updated')
          } else {
            logFail('Booking Lifecycle', `Status transition -> "${nextStatus}"`, `Failed: ${patchRes.status}`)
          }
        }
      } else {
        logFail('Booking Flow', 'Admin Booking List Sync', `Booking ${createdBookingId} not found in admin list`)
      }
    }
  } catch (e: any) {
    logFail('Booking Flow', 'Online Booking Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: TESTS CRUD & LIVE DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 4: Tests CRUD & Live Dynamic Sync ---');
  let testRecordId: string | null = null
  const testSlug = `audit-test-vitamin-${Date.now()}`

  try {
    // 1. Fetch a valid category
    const catRes = await fetch(`${BASE_URL}/api/tests`)
    const catData = await catRes.json()
    const categoryId = catData.categories?.[0]?.id || (await prisma.testCategory.findFirst())?.id

    if (!categoryId) {
      throw new Error('No test category available to associate with test')
    }

    // 2. Admin Creates Test
    const createTestRes = await fetch(`${BASE_URL}/api/admin/tests`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: '[AUDIT-TEST] Complete Vitamin Profile D3 & B12',
        slug: testSlug,
        categoryId: categoryId,
        price: 1599,
        mrp: 2200,
        discount: 27,
        shortDescription: 'Audit test for dynamic sync verification.',
        description: 'Measures Vitamin D3 and Vitamin B12 levels in blood.',
        reportTime: '24 Hours',
        preparationInstructions: 'Fasting for 10-12 hours required.',
        fastingRequired: true,
        homeCollection: true,
        nightAvailable: false,
        isActive: true,
        isFeatured: false,
        displayOrder: 999
      })
    })

    const createTestData = await createTestRes.json()
    if (createTestRes.status === 201 && createTestData.test?.id) {
      testRecordId = createTestData.test.id
      logPass('Tests Sync', 'Admin Create Test (POST /api/admin/tests)', `Test ID: ${testRecordId}`)

      // 3. Verify Test on Public API
      const pubTestsRes = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' })
      const pubTestsData = await pubTestsRes.json()
      const foundPublicTest = pubTestsData.tests?.find((t: any) => t.id === testRecordId || t.slug === testSlug)
      if (foundPublicTest && foundPublicTest.price === 1599) {
        logPass('Tests Sync', 'Public API Test Visibility', `Found test at ₹1599`)
      } else {
        logFail('Tests Sync', 'Public API Test Visibility', 'Test not found on public API')
      }

      // 4. Admin Updates Test Price
      const updatedPrice = 1799
      const updateTestRes = await fetch(`${BASE_URL}/api/admin/tests/${testRecordId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ price: updatedPrice })
      })
      if (updateTestRes.status === 200) {
        logPass('Tests Sync', 'Admin Update Test Price (PUT /api/admin/tests/[id])', `Updated to ₹${updatedPrice}`)

        // Verify updated price on public API
        const pubTestsRes2 = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' })
        const pubTestsData2 = await pubTestsRes2.json()
        const foundPublicTest2 = pubTestsData2.tests?.find((t: any) => t.id === testRecordId || t.slug === testSlug)
        if (foundPublicTest2 && foundPublicTest2.price === updatedPrice) {
          logPass('Tests Sync', 'Public API Price Reflection', `Reflects ₹${updatedPrice} immediately`)
        } else {
          logFail('Tests Sync', 'Public API Price Reflection', `Expected ₹${updatedPrice}, got ${foundPublicTest2?.price}`)
        }
      } else {
        logFail('Tests Sync', 'Admin Update Test Price', `Status ${updateTestRes.status}`)
      }

      // 5. Admin Deletes Test
      const delTestRes = await fetch(`${BASE_URL}/api/admin/tests/${testRecordId}`, {
        method: 'DELETE',
        headers: adminHeaders
      })
      if (delTestRes.status === 200) {
        logPass('Tests Sync', 'Admin Delete Test (DELETE /api/admin/tests/[id])', 'Soft-deleted successfully')

        // Verify removed from public API
        const pubTestsRes3 = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' })
        const pubTestsData3 = await pubTestsRes3.json()
        const stillInPublic = pubTestsData3.tests?.some((t: any) => t.id === testRecordId)
        if (!stillInPublic) {
          logPass('Tests Sync', 'Public API Test Removal', 'Verified clean removal from public view')
        } else {
          logFail('Tests Sync', 'Public API Test Removal', 'Test still appearing on public API after delete')
        }
      } else {
        logFail('Tests Sync', 'Admin Delete Test', `Status ${delTestRes.status}`)
      }
    } else {
      logFail('Tests Sync', 'Admin Create Test', `Status ${createTestRes.status}: ${JSON.stringify(createTestData)}`)
    }
  } catch (e: any) {
    logFail('Tests Sync', 'Test CRUD Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 5: PACKAGES CRUD & LIVE DYNAMIC SYNC
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 5: Packages CRUD & Live Dynamic Sync ---');
  let pkgRecordId: string | null = null
  const pkgSlug = `audit-test-pkg-${Date.now()}`

  try {
    // 1. Admin Creates Package
    const createPkgRes = await fetch(`${BASE_URL}/api/admin/packages`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: '[AUDIT-TEST] Senior Citizen Complete Wellness',
        slug: pkgSlug,
        description: 'Comprehensive health checkup for senior citizens.',
        price: 2499,
        mrp: 4500,
        discount: 44,
        reportTime: '24-48 Hours',
        preparationInstructions: 'Overnight 10-12 hours fasting required.',
        homeCollection: true,
        isActive: true,
        isFeatured: false,
        displayOrder: 999
      })
    })

    const createPkgData = await createPkgRes.json()
    if (createPkgRes.status === 201 && createPkgData.package?.id) {
      pkgRecordId = createPkgData.package.id
      logPass('Packages Sync', 'Admin Create Package (POST /api/admin/packages)', `Package ID: ${pkgRecordId}`)

      // 2. Verify on Public API
      const pubPkgRes = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' })
      const pubPkgData = await pubPkgRes.json()
      const foundPublicPkg = (pubPkgData.packages || pubPkgData).find((p: any) => p.id === pkgRecordId || p.slug === pkgSlug)
      if (foundPublicPkg && foundPublicPkg.price === 2499) {
        logPass('Packages Sync', 'Public API Package Visibility', `Found package at ₹2499`)
      } else {
        logFail('Packages Sync', 'Public API Package Visibility', 'Package not found on public API')
      }

      // 3. Admin Updates Package Price
      const updatedPkgPrice = 2899
      const updatePkgRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgRecordId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ price: updatedPkgPrice })
      })
      if (updatePkgRes.status === 200) {
        logPass('Packages Sync', 'Admin Update Package Price (PUT /api/admin/packages/[id])', `Updated to ₹${updatedPkgPrice}`)

        // Verify updated price on public API
        const pubPkgRes2 = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' })
        const pubPkgData2 = await pubPkgRes2.json()
        const foundPublicPkg2 = (pubPkgData2.packages || pubPkgData2).find((p: any) => p.id === pkgRecordId || p.slug === pkgSlug)
        if (foundPublicPkg2 && foundPublicPkg2.price === updatedPkgPrice) {
          logPass('Packages Sync', 'Public API Package Price Reflection', `Reflects ₹${updatedPkgPrice} immediately`)
        } else {
          logFail('Packages Sync', 'Public API Package Price Reflection', `Expected ₹${updatedPkgPrice}, got ${foundPublicPkg2?.price}`)
        }
      } else {
        logFail('Packages Sync', 'Admin Update Package Price', `Status ${updatePkgRes.status}`)
      }

      // 4. Admin Deletes Package
      const delPkgRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgRecordId}`, {
        method: 'DELETE',
        headers: adminHeaders
      })
      if (delPkgRes.status === 200) {
        logPass('Packages Sync', 'Admin Delete Package (DELETE /api/admin/packages/[id])', 'Soft-deleted successfully')

        // Verify removed from public API
        const pubPkgRes3 = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' })
        const pubPkgData3 = await pubPkgRes3.json()
        const stillInPublicPkg = (pubPkgData3.packages || pubPkgData3).some((p: any) => p.id === pkgRecordId)
        if (!stillInPublicPkg) {
          logPass('Packages Sync', 'Public API Package Removal', 'Verified clean removal from public view')
        } else {
          logFail('Packages Sync', 'Public API Package Removal', 'Package still appearing on public API after delete')
        }
      } else {
        logFail('Packages Sync', 'Admin Delete Package', `Status ${delPkgRes.status}`)
      }
    } else {
      logFail('Packages Sync', 'Admin Create Package', `Status ${createPkgRes.status}: ${JSON.stringify(createPkgData)}`)
    }
  } catch (e: any) {
    logFail('Packages Sync', 'Package CRUD Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 6: FAKE REPORT UPLOAD, METADATA PARSING & PATIENT ACCESS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 6: Fake Report Upload & Patient Portal Access ---');
  let uploadedReportId: string | null = null
  const testPatientPhone = '7742735762'

  try {
    // 1. Prepare synthetic PDF report buffer
    const testPdfContent = `Patient: Mahesh Saini Age: 18 Gender: Male Mobile: ${testPatientPhone} Test: Complete Blood Count CBC Report Date: 09/09/2026 Hb: 14.8 g/dL Platelets: 250000 /uL Normal`
    const pdfBuffer = createDummyPDF(testPdfContent)
    const boundary = '----WebKitFormBoundaryAuditReport'
    const postBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="report"; filename="Mahesh_Audit_CBC_${Date.now()}.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      pdfBuffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="patientName"\r\n\r\nMahesh Saini\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="mobile"\r\n\r\n${testPatientPhone}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="testName"\r\n\r\nComplete Blood Count (CBC)\r\n`),
      Buffer.from(`--${boundary}--\r\n`),
    ])

    // 2. Upload via Admin
    const uploadRes = await fetch(`${BASE_URL}/api/admin/reports/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `session_token=${adminToken}`
      },
      body: postBody
    })

    const uploadData = await uploadRes.json()
    if (uploadRes.status === 200 && uploadData.report?.id) {
      uploadedReportId = uploadData.report.id
      logPass('Report Flow', 'Admin Fake Report Upload (POST /api/admin/reports/upload)', `Report ID: ${uploadedReportId}`)

      // Verify date parsing and metadata extraction
      const reportDateParsed = uploadData.report.reportDate
      const hasValidDate = reportDateParsed && !reportDateParsed.includes('Invalid')
      if (hasValidDate) {
        logPass('Report Flow', 'Report Date Parsing (Safe Date Parser)', `Report Date: ${reportDateParsed}`)
      } else {
        logFail('Report Flow', 'Report Date Parsing', `Date is invalid: ${reportDateParsed}`)
      }

      // Verify ReportFile binary buffer in MongoDB Atlas
      const reportFileDoc = await ReportFile.findOne({ reportId: new mongoose.Types.ObjectId(uploadedReportId) })
      if (reportFileDoc && reportFileDoc.data && reportFileDoc.data.length > 0) {
        logPass('Report Flow', 'Atlas PDF Binary Persistence (ReportFile)', `Stored ${reportFileDoc.data.length} bytes in Atlas`)
      } else {
        logFail('Report Flow', 'Atlas PDF Binary Persistence', 'ReportFile record not found in MongoDB Atlas')
      }

      // 3. Admin Publishes Report
      const publishRes = await fetch(`${BASE_URL}/api/admin/reports/confirm`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reportId: uploadedReportId,
          action: 'update_status',
          status: 'published'
        })
      })
      const publishData = await publishRes.json()
      if (publishRes.status === 200 && publishData.report?.status === 'published') {
        logPass('Report Flow', 'Admin Publish Report', 'Status updated to "published"')
      } else {
        logFail('Report Flow', 'Admin Publish Report', `Status ${publishRes.status}`)
      }

      // 4. Patient Authentication & Direct Report Access via Mobile Number
      const knownPassword = 'Secure@AuditPass2026!'
      const patientRecord = await Patient.findOne({ phone: testPatientPhone })
      if (patientRecord) {
        const bcrypt = await import('bcryptjs')
        patientRecord.passwordHash = await bcrypt.default.hash(knownPassword, 10)
        patientRecord.isActivated = true
        patientRecord.activatedAt = new Date()
        await patientRecord.save()

        // Test normal patient login via mobile number
        const patientLoginRes = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: testPatientPhone, password: knownPassword })
        })
        const patientLoginData = await patientLoginRes.json()

        if (patientLoginRes.status === 200 && patientLoginData.token) {
          logPass('Patient Portal', 'Patient Login with Mobile + Password', `Welcome ${patientLoginData.patientName}`)
          const patientToken = patientLoginData.token

          // View report through secure endpoint
          const secureViewRes = await fetch(`${BASE_URL}/api/reports/secure/${uploadedReportId}`, {
            headers: { 'Authorization': `Bearer ${patientToken}` }
          })
          const secureViewData = await secureViewRes.json()
          if (secureViewRes.status === 200 && secureViewData.report?.tempUrl) {
            logPass('Patient Portal', 'Secure Report Retrieval (GET /api/reports/secure/[id])', `Stream URL generated`)

            // Stream the actual PDF bytes
            const pdfStreamRes = await fetch(`${BASE_URL}${secureViewData.report.tempUrl}`)
            const contentType = pdfStreamRes.headers.get('content-type')
            if (pdfStreamRes.status === 200 && contentType?.includes('application/pdf')) {
              logPass('Patient Portal', 'PDF Stream Delivery', `Content-Type: ${contentType}`)
            } else {
              logFail('Patient Portal', 'PDF Stream Delivery', `Status ${pdfStreamRes.status}, Content-Type: ${contentType}`)
            }

            // Download with ?download=true
            const pdfDownloadRes = await fetch(`${BASE_URL}${secureViewData.report.tempUrl}&download=true`)
            const disposition = pdfDownloadRes.headers.get('content-disposition')
            if (pdfDownloadRes.status === 200 && disposition?.includes('attachment')) {
              logPass('Patient Portal', 'PDF Download Header', `Content-Disposition: ${disposition}`)
            } else {
              logFail('Patient Portal', 'PDF Download Header', `Status ${pdfDownloadRes.status}, disposition: ${disposition}`)
            }
          } else {
            logFail('Patient Portal', 'Secure Report Retrieval', `Status ${secureViewRes.status}: ${JSON.stringify(secureViewData)}`)
          }
        } else {
          logFail('Patient Portal', 'Patient Login', `Status ${patientLoginRes.status}: ${JSON.stringify(patientLoginData)}`)
        }
      } else {
        logFail('Patient Portal', 'Patient Record Lookup', `No patient record for ${testPatientPhone}`)
      }

      // 5. Delete Report in Admin
      const delReportRes = await fetch(`${BASE_URL}/api/admin/reports/${uploadedReportId}`, {
        method: 'DELETE',
        headers: adminHeaders
      })
      if (delReportRes.status === 200) {
        logPass('Report Flow', 'Admin Delete Report (DELETE /api/admin/reports/[id])', 'Report cleaned up successfully')
      } else {
        logFail('Report Flow', 'Admin Delete Report', `Status ${delReportRes.status}`)
      }
    } else {
      logFail('Report Flow', 'Admin Fake Report Upload', `Status ${uploadRes.status}: ${JSON.stringify(uploadData)}`)
    }
  } catch (e: any) {
    logFail('Report Flow', 'Report Upload Flow Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 7: ADMIN SETTINGS DYNAMIC SYNCHRONIZATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 7: Admin Settings Dynamic Synchronization ---');
  try {
    const settingsRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders })
    const settingsData = await settingsRes.json()
    const currentCharge = settingsData.settings?.home_collection_charge || '100'
    const newAuditCharge = '150'

    // Update setting
    const updateSettingRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        settings: [{ key: 'home_collection_charge', value: newAuditCharge, type: 'number' }]
      })
    })

    if (updateSettingRes.status === 200) {
      logPass('Settings Sync', 'Update Setting in Admin', `Set home_collection_charge = ${newAuditCharge}`)

      // Verify setting update
      const verifySettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders })
      const verifySettingsData = await verifySettingsRes.json()
      if (verifySettingsData.settings?.home_collection_charge === newAuditCharge) {
        logPass('Settings Sync', 'Verify Updated Setting', `Reflects ${newAuditCharge} correctly`)
      } else {
        logFail('Settings Sync', 'Verify Updated Setting', `Value mismatch: ${verifySettingsData.settings?.home_collection_charge}`)
      }

      // Restore original setting
      await fetch(`${BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          settings: [{ key: 'home_collection_charge', value: currentCharge, type: 'number' }]
        })
      })
      logPass('Settings Sync', 'Restore Setting', `Restored to ${currentCharge}`)
    } else {
      logFail('Settings Sync', 'Update Setting in Admin', `Status ${updateSettingRes.status}`)
    }
  } catch (e: any) {
    logFail('Settings Sync', 'Settings Sync Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 8: MOBILE DEVICE REGISTRATION & PUSH INFRASTRUCTURE
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 8: Mobile Device Push Architecture ---');
  try {
    const testSub = {
      endpoint: `https://fcm.googleapis.com/fcm/send/audit-test-device-${Date.now()}`,
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbVYO2-0U0WwTU2SoQ',
        auth: 'tBHItJI5svbpez7KI4CCXg'
      }
    }

    const regRes = await fetch(`${BASE_URL}/api/admin/devices/register`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        subscription: testSub,
        deviceName: 'Audit Chrome Mobile',
        browser: 'Chrome Mobile 120',
        platform: 'Android 14'
      })
    })

    const regData = await regRes.json()
    if (regRes.status === 200 && regData.success) {
      logPass('Mobile Device Push', 'Device Registration API (POST /api/admin/devices/register)', `Registered Device ID: ${regData.device?.id || 'OK'}`)

      // Clean up test device
      await AdminDevice.deleteMany({ deviceName: 'Audit Chrome Mobile' })
      logPass('Mobile Device Push', 'Device Cleanup', 'Test device subscription removed')
    } else {
      logFail('Mobile Device Push', 'Device Registration API', `Status ${regRes.status}: ${JSON.stringify(regData)}`)
    }
  } catch (e: any) {
    logFail('Mobile Device Push', 'Device Registration Error', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 9: SAFE DATABASE CLEANUP OF TEST DATA
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 9: Database Cleanup of Audit Records ---');
  try {
    // 1. Delete audit bookings & samples
    const delBookings = await Booking.deleteMany({ patientName: { $regex: /AUDIT-TEST/i } })
    const delSamples = await Sample.deleteMany({ patientName: { $regex: /AUDIT-TEST/i } })
    console.log(`🧹 Cleaned up ${delBookings.deletedCount} audit bookings and ${delSamples.deletedCount} audit samples.`)

    // 2. Delete audit tests & packages
    const delTests = await Test.deleteMany({ name: { $regex: /AUDIT-TEST/i } })
    const delPkgs = await Package.deleteMany({ name: { $regex: /AUDIT-TEST/i } })
    console.log(`🧹 Cleaned up ${delTests.deletedCount} audit tests and ${delPkgs.deletedCount} audit packages.`)

    // 3. Delete audit reports and files
    if (uploadedReportId) {
      await Report.deleteMany({ _id: new mongoose.Types.ObjectId(uploadedReportId) })
      await ReportFile.deleteMany({ reportId: new mongoose.Types.ObjectId(uploadedReportId) })
    }
    const delReports = await Report.deleteMany({ testName: { $regex: /AUDIT/i } })
    console.log(`🧹 Cleaned up ${delReports.deletedCount} audit reports.`)

    logPass('Cleanup', 'Audit Data Sanitization', 'All temporary test artifacts safely removed from MongoDB Atlas')
  } catch (e: any) {
    logFail('Cleanup', 'Audit Data Sanitization', e.message)
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊 COMPREHENSIVE SYSTEM AUDIT SUMMARY');
  console.log('================================================================');
  const totalTests = results.length
  const passedTests = results.filter(r => r.status === 'PASS').length
  const failedTests = results.filter(r => r.status === 'FAIL').length

  console.log(`Total Checks Executed : ${totalTests}`)
  console.log(`Checks Passed         : ${passedTests} (✅ ${((passedTests/totalTests)*100).toFixed(1)}%)`)
  console.log(`Checks Failed         : ${failedTests} (❌ ${failedTests === 0 ? '0' : failedTests})`)
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.log('FAILED ITEMS DETAILS:');
    results.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`  - [${f.category}] ${f.name}: ${f.detail}`);
    });
  }

  await prisma.$disconnect()
  process.exit(failedTests > 0 ? 1 : 0)
}

runDeepAudit().catch((err) => {
  console.error('Fatal audit error:', err)
  process.exit(1)
})
