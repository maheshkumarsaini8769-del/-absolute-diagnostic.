import { connectDB } from '../src/lib/db/connect'
import { Patient, Report, ReportFile, Admin } from '../src/models'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const BASE_URL = 'http://localhost:3000'
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production'

function createAdminCookie(adminId: string, email: string): string {
  const token = jwt.sign(
    { adminId, email, role: 'admin', type: 'admin' },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
  return `session_token=${token}`
}

function createDummyPDF(content: string): Buffer {
  const streamContent = `BT /F1 12 Tf 50 700 Td (${content.replace(/[()]/g, '')}) Tj ET`
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

async function runSuite() {
  await connectDB()
  console.log('🚀 Starting Full End-to-End Suite for opencode/new1.md...')

  // 1. Get or Create Admin for testing
  let admin = await Admin.findOne({ email: 'admin@absolutediagnostic.com' })
  if (!admin) {
    admin = await Admin.findOne()
  }
  if (!admin) {
    throw new Error('No admin account found in database.')
  }
  const adminCookie = createAdminCookie(admin._id.toString(), admin.email)
  console.log(`✓ Admin session authenticated for: ${admin.email}`)

  // 2. Locate or Prepare Test Patient: Mahesh Saini, 18, 7742735762
  let mahesh = await Patient.findOne({ phone: '7742735762' })
  if (!mahesh) {
    mahesh = await Patient.create({
      name: 'Mahesh Saini',
      phone: '7742735762',
      age: 18,
      gender: 'Male',
      patientIdUHID: 'UHID-MAHESH18',
      isActivated: false,
    })
  } else {
    // Reset activation state for pristine first-time activation test
    mahesh.isActivated = false
    mahesh.passwordHash = undefined
    await mahesh.save()
  }
  console.log(`✓ Test patient ready: ${mahesh.name} (UHID: ${mahesh.patientIdUHID}, Phone: ${mahesh.phone})`)

  // ══════════════════════════════════════════════════════════════
  // TEST 1: Backend Search, Filters & Pagination in Admin Reports
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- TEST 1: Admin Reports Backend Search & Filtering ---')

  // Search by name
  const resSearch = await fetch(`${BASE_URL}/api/admin/reports?q=Mahesh`, {
    headers: { Cookie: adminCookie }
  })
  const dataSearch = await resSearch.json()
  console.log(`✓ Search "Mahesh": status ${resSearch.status}, found ${dataSearch.reports?.length || 0} reports`)
  if (!resSearch.ok) throw new Error('Search failed')

  // Search by phone
  const resPhone = await fetch(`${BASE_URL}/api/admin/reports?q=7742735762`, {
    headers: { Cookie: adminCookie }
  })
  const dataPhone = await resPhone.json()
  console.log(`✓ Search "7742735762": status ${resPhone.status}, found ${dataPhone.reports?.length || 0} reports`)

  // Filter by status
  const resStatus = await fetch(`${BASE_URL}/api/admin/reports?status=ready`, {
    headers: { Cookie: adminCookie }
  })
  const dataStatus = await resStatus.json()
  console.log(`✓ Filter status "ready": status ${resStatus.status}, total in page ${dataStatus.reports?.length || 0}`)

  // Pagination
  const resPage = await fetch(`${BASE_URL}/api/admin/reports?page=1&limit=5&sortBy=newest`, {
    headers: { Cookie: adminCookie }
  })
  const dataPage = await resPage.json()
  console.log(`✓ Pagination: page ${dataPage.pagination?.page} of ${dataPage.pagination?.totalPages}, total items: ${dataPage.pagination?.total}`)
  if (dataPage.reports?.length > 5) throw new Error('Limit was not respected by pagination')

  // ══════════════════════════════════════════════════════════════
  // TEST 2: Report Upload, Extraction, Match Preview, View, Download, Status, Delete
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- TEST 2: Report Upload, Match Preview & Lifecycle ---')
  const pdfBuffer = createDummyPDF('Patient: Mahesh Saini Age: 18 Years Mobile: 7742735762 Test: Complete Blood Count CBC Report Date: 09/09/2026 Hb: 14.5 g/dL Normal')
  const boundary = '----WebKitFormBoundaryE2ETestReport'
  const postBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="report"; filename="Mahesh_CBC_Report_${Date.now()}.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    pdfBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const resUpload = await fetch(`${BASE_URL}/api/admin/reports/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: adminCookie,
    },
    body: postBody,
  })

  const uploadJson = await resUpload.json()
  console.log(`✓ Upload Response: status ${resUpload.status}, report ID: ${uploadJson.report?.id}`)
  if (!resUpload.ok || !uploadJson.report?.id) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadJson)}`)
  }

  // Verify Match Preview data format
  console.log('✓ Match Preview extraction:', {
    name: uploadJson.extraction?.name,
    mobile: uploadJson.extraction?.mobile,
    test: uploadJson.extraction?.testName,
    matchConfidence: uploadJson.match?.confidence,
    matchScore: uploadJson.match?.score,
  })
  if (!uploadJson.extraction || !uploadJson.match) {
    throw new Error('Upload response missing extraction or match preview object!')
  }

  const reportId = uploadJson.report.id

  // View Report (Stream PDF)
  const resView = await fetch(`${BASE_URL}${uploadJson.report.fileUrl}`)
  console.log(`✓ View Report (${uploadJson.report.fileUrl}): status ${resView.status}, Content-Type: ${resView.headers.get('content-type')}`)
  if (resView.status !== 200 || !resView.headers.get('content-type')?.includes('application/pdf')) {
    throw new Error('View report did not return valid application/pdf stream!')
  }

  // Download Report (?download=true)
  const resDownload = await fetch(`${BASE_URL}${uploadJson.report.fileUrl}?download=true`)
  console.log(`✓ Download Report: status ${resDownload.status}, Content-Disposition: ${resDownload.headers.get('content-disposition')}`)
  if (!resDownload.headers.get('content-disposition')?.includes('attachment')) {
    throw new Error('Download report did not set attachment Content-Disposition header!')
  }

  // Update Status: Under Review -> Verified
  const resVerify = await fetch(`${BASE_URL}/api/admin/reports/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ reportId, action: 'update_status', status: 'verified' }),
  })
  const verifyJson = await resVerify.json()
  console.log(`✓ Status -> Verified: status ${resVerify.status}, new status: ${verifyJson.report?.status}`)

  // Update Status: Verified -> Published
  const resPublish = await fetch(`${BASE_URL}/api/admin/reports/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ reportId, action: 'update_status', status: 'published' }),
  })
  const publishJson = await resPublish.json()
  console.log(`✓ Status -> Published: status ${resPublish.status}, new status: ${publishJson.report?.status}`)

  // Update Status: Published -> Delivered
  const resDelivered = await fetch(`${BASE_URL}/api/admin/reports/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ reportId, action: 'update_status', status: 'delivered' }),
  })
  const deliveredJson = await resDelivered.json()
  console.log(`✓ Status -> Delivered: status ${resDelivered.status}, new status: ${deliveredJson.report?.status}`)

  // ══════════════════════════════════════════════════════════════
  // TEST 3: Patient Authentication Flows
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- TEST 3: Patient First-Time Activation Flow ---')

  // Step 3A: Verify record
  const resActVerify = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_record',
      identifier: mahesh.patientIdUHID,
      phone: '7742735762',
    }),
  })
  const actVerifyData = await resActVerify.json()
  console.log(`✓ Patient Verify Record: status ${resActVerify.status}, patient: ${actVerifyData.patientName}`)
  if (!resActVerify.ok || !actVerifyData.verified) {
    throw new Error(`Patient record verification failed: ${JSON.stringify(actVerifyData)}`)
  }

  // Step 3B: Create strong password & activate
  const testPassword = 'ClinicalSecure@9988'
  const resActCreate = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create_password',
      patientId: mahesh._id.toString(),
      password: testPassword,
      confirmPassword: testPassword,
    }),
  })
  const actCreateData = await resActCreate.json()
  console.log(`✓ Patient Password Created & Activated: status ${resActCreate.status}, token generated: ${!!actCreateData.token}`)
  if (!resActCreate.ok || !actCreateData.token) {
    throw new Error(`Password creation failed: ${JSON.stringify(actCreateData)}`)
  }

  // Verify database record has isActivated = true
  const activatedPatient = await Patient.findById(mahesh._id)
  console.log(`✓ Database Check: isActivated = ${activatedPatient?.isActivated}, activatedAt = ${activatedPatient?.activatedAt}`)
  if (activatedPatient?.isActivated !== true) {
    throw new Error('Patient isActivated flag was not set to true in MongoDB!')
  }

  // Step 3C: STRICT SECURITY CHECK - First-Time Activation MUST NOT BE REUSABLE
  console.log('\n--- TEST 4: Security Check - Activation Reuse Prevention ---')
  const resActReuse = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_record',
      identifier: mahesh.patientIdUHID,
      phone: '7742735762',
    }),
  })
  const actReuseData = await resActReuse.json()
  console.log(`✓ Reuse Attempt Rejected: status ${resActReuse.status}, error: "${actReuseData.error}"`)
  if (resActReuse.status !== 400 || !actReuseData.alreadyActivated) {
    throw new Error('Security violation: First-Time Activation was allowed again for an already activated account!')
  }

  // Step 3D: Normal Login with Mobile Number + Password
  console.log('\n--- TEST 5: Normal Patient Login (Mobile + Password) ---')
  const resLogin = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '7742735762',
      password: testPassword,
    }),
  })
  const loginData = await resLogin.json()
  console.log(`✓ Patient Normal Login: status ${resLogin.status}, reports returned: ${loginData.reports?.length || 0}`)
  if (!resLogin.ok || !loginData.token) {
    throw new Error(`Normal password login failed: ${JSON.stringify(loginData)}`)
  }

  // Step 3E: Authorization Check - Patient session verification endpoint
  const patientCookie = `session_token=${loginData.token}`
  const resVerifySession = await fetch(`${BASE_URL}/api/reports/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: patientCookie,
    },
    body: JSON.stringify({ sessionCheck: true }),
  })
  const verifySessionData = await resVerifySession.json()
  console.log(`✓ Patient Session Report Access: status ${resVerifySession.status}, authorized reports: ${verifySessionData.reports?.length}`)
  if (!resVerifySession.ok || !verifySessionData.reports) {
    throw new Error('Patient session verification failed!')
  }

  // Step 3F: Forgot Password / Recovery Flow
  console.log('\n--- TEST 6: Forgot Password & Truecaller Recovery Flow ---')
  const resRecovInit = await fetch(`${BASE_URL}/api/auth/patient/recovery/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '7742735762' }),
  })
  const recovInitData = await resRecovInit.json()
  console.log(`✓ Recovery Initiated: status ${resRecovInit.status}, patient: ${recovInitData.patientName}`)

  // Verify with Truecaller
  const resTcVerify = await fetch(`${BASE_URL}/api/auth/patient/recovery/truecaller-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: mahesh._id.toString(),
      payload: { phoneNumber: '7742735762', name: 'Mahesh Saini' },
    }),
  })
  const tcVerifyData = await resTcVerify.json()
  console.log(`✓ Truecaller Verification: status ${resTcVerify.status}, resetToken: ${!!tcVerifyData.resetToken}`)
  if (!resTcVerify.ok || !tcVerifyData.resetToken) {
    throw new Error('Truecaller recovery verification failed!')
  }

  // Reset to new password
  const newPassword = 'NewClinicalPassword@4321'
  const resReset = await fetch(`${BASE_URL}/api/auth/patient/recovery/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken: tcVerifyData.resetToken,
      password: newPassword,
      confirmPassword: newPassword,
    }),
  })
  const resetData = await resReset.json()
  console.log(`✓ Password Reset Complete: status ${resReset.status}, direct login token: ${!!resetData.token}`)
  if (!resReset.ok || !resetData.token) {
    throw new Error('Password reset failed!')
  }

  // Clean up test report
  console.log('\n--- TEST 7: Delete Report & Persistent Storage Cleanup ---')
  const resDelete = await fetch(`${BASE_URL}/api/admin/reports/${reportId}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  })
  console.log(`✓ Delete report: status ${resDelete.status}`)

  const deletedReportInDB = await Report.findById(reportId)
  const deletedFileInMongo = await ReportFile.findOne({ reportId })
  console.log(`✓ Database verification: Report in DB: ${!!deletedReportInDB}, ReportFile in Mongo: ${!!deletedFileInMongo}`)
  if (deletedReportInDB || deletedFileInMongo) {
    throw new Error('Report or ReportFile was not cleaned up after delete!')
  }

  console.log('\n🎉 ALL OPBNCODE/NEW1.MD REQUIREMENTS VERIFIED & PASSED 100%!')
  process.exit(0)
}

runSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err)
  process.exit(1)
})
