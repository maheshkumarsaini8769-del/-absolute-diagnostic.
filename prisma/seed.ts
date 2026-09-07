import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@absolutediagnostic.com' },
    update: {},
    create: {
      email: 'admin@absolutediagnostic.com',
      passwordHash,
      name: 'Admin',
    },
  })
  console.log('Admin user created:', admin.email)

  const categories = [
    { name: 'Hematology', slug: 'hematology', displayOrder: 1 },
    { name: 'Clinical Biochemistry', slug: 'clinical-biochemistry', displayOrder: 2 },
    { name: 'Molecular Diagnostics', slug: 'molecular-diagnostics', displayOrder: 3 },
    { name: 'Clinical Immunology', slug: 'clinical-immunology', displayOrder: 4 },
    { name: 'Microbiology & Serology', slug: 'microbiology-serology', displayOrder: 5 },
    { name: 'Histopathology', slug: 'histopathology', displayOrder: 6 },
    { name: 'Thyroid', slug: 'thyroid', displayOrder: 7 },
    { name: 'Diabetes', slug: 'diabetes', displayOrder: 8 },
    { name: 'Vitamins', slug: 'vitamins', displayOrder: 9 },
    { name: 'Hormones', slug: 'hormones', displayOrder: 10 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.testCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: cat,
    })
    createdCategories[cat.slug] = created.id
  }
  console.log('Categories created:', Object.keys(createdCategories).length)

  const tests = [
    { name: 'Complete Blood Count (CBC)', slug: 'cbc', categoryId: createdCategories['hematology'], price: 200, mrp: 250, reportTime: '4 hours', preparationInstructions: 'No fasting required', homeCollection: true, isFeatured: true, displayOrder: 1, shortDescription: 'Comprehensive blood count', description: 'Evaluates overall health and detects infections, anemia, and blood disorders.' },
    { name: 'Thyroid Profile (T3, T4, TSH)', slug: 'thyroid-profile', categoryId: createdCategories['thyroid'], price: 500, mrp: 600, reportTime: '24 hours', preparationInstructions: 'Fasting for 8-12 hours recommended', homeCollection: true, isFeatured: true, displayOrder: 2, shortDescription: 'Complete thyroid function test', description: 'Measures T3, T4, and TSH levels to evaluate thyroid function.' },
    { name: 'Blood Sugar Fasting', slug: 'blood-sugar-fasting', categoryId: createdCategories['diabetes'], price: 80, mrp: 100, reportTime: '2 hours', preparationInstructions: 'Fasting for 8-12 hours required', fastingRequired: true, homeCollection: true, isFeatured: true, displayOrder: 3, shortDescription: 'Fasting blood glucose test', description: 'Measures blood glucose levels after fasting.' },
    { name: 'HbA1c', slug: 'hba1c', categoryId: createdCategories['diabetes'], price: 400, mrp: 500, reportTime: '24 hours', preparationInstructions: 'No fasting required', homeCollection: true, isFeatured: true, displayOrder: 4, shortDescription: 'Average blood sugar over 3 months', description: 'Measures average blood glucose over 2-3 months.' },
    { name: 'Lipid Profile', slug: 'lipid-profile', categoryId: createdCategories['clinical-biochemistry'], price: 350, mrp: 450, reportTime: '24 hours', preparationInstructions: 'Fasting for 12 hours required', fastingRequired: true, homeCollection: true, isFeatured: true, displayOrder: 5, shortDescription: 'Cholesterol and triglycerides', description: 'Measures cholesterol, HDL, LDL, VLDL, and triglycerides.' },
    { name: 'Liver Function Test (LFT)', slug: 'lft', categoryId: createdCategories['clinical-biochemistry'], price: 450, mrp: 550, reportTime: '24 hours', preparationInstructions: 'Fasting for 8 hours recommended', homeCollection: true, isFeatured: true, displayOrder: 6, shortDescription: 'Liver function assessment', description: 'Evaluates liver health through SGOT, SGPT, ALP, bilirubin.' },
    { name: 'Kidney Function Test (KFT)', slug: 'kft', categoryId: createdCategories['clinical-biochemistry'], price: 400, mrp: 500, reportTime: '24 hours', preparationInstructions: 'No special preparation required', homeCollection: true, isFeatured: true, displayOrder: 7, shortDescription: 'Kidney health assessment', description: 'Measures creatinine, BUN, and electrolytes.' },
    { name: 'Vitamin D', slug: 'vitamin-d', categoryId: createdCategories['vitamins'], price: 600, mrp: 750, reportTime: '48 hours', preparationInstructions: 'No fasting required', homeCollection: true, isFeatured: true, displayOrder: 8, shortDescription: 'Vitamin D level test', description: 'Measures 25-hydroxyvitamin D levels.' },
    { name: 'Vitamin B12', slug: 'vitamin-b12', categoryId: createdCategories['vitamins'], price: 500, mrp: 600, reportTime: '48 hours', preparationInstructions: 'No fasting required', homeCollection: true, isFeatured: true, displayOrder: 9, shortDescription: 'Vitamin B12 level test', description: 'Measures vitamin B12 levels.' },
    { name: 'Iron Studies', slug: 'iron-studies', categoryId: createdCategories['hematology'], price: 350, mrp: 450, reportTime: '24 hours', preparationInstructions: 'Fasting for 12 hours recommended', fastingRequired: true, homeCollection: true, displayOrder: 10, shortDescription: 'Iron, TIBC, and ferritin', description: 'Comprehensive iron assessment.' },
    { name: 'Hepatitis B (HBsAg)', slug: 'hbsag', categoryId: createdCategories['microbiology-serology'], price: 300, mrp: 400, reportTime: '24 hours', preparationInstructions: 'No special preparation required', homeCollection: true, displayOrder: 11, shortDescription: 'Hepatitis B screening', description: 'Screening test for Hepatitis B virus.' },
    { name: 'PSA (Prostate)', slug: 'psa', categoryId: createdCategories['clinical-immunology'], price: 500, mrp: 600, reportTime: '48 hours', preparationInstructions: 'No special preparation required', homeCollection: true, displayOrder: 12, shortDescription: 'Prostate screening marker', description: 'Measures prostate-specific antigen levels.' },
    { name: 'ECG', slug: 'ecg', categoryId: createdCategories['hematology'], price: 200, mrp: 250, reportTime: '1 hour', preparationInstructions: 'No special preparation', homeCollection: false, nightAvailable: true, displayOrder: 13, shortDescription: 'Heart rhythm test', description: 'Records electrical activity of the heart.' },
    { name: 'Blood Group', slug: 'blood-group', categoryId: createdCategories['hematology'], price: 150, mrp: 200, reportTime: '2 hours', preparationInstructions: 'No special preparation required', homeCollection: true, displayOrder: 14, shortDescription: 'Blood typing test', description: 'Determines ABO blood group and Rh factor.' },
    { name: 'Urine Routine', slug: 'urine-routine', categoryId: createdCategories['clinical-biochemistry'], price: 100, mrp: 150, reportTime: '4 hours', preparationInstructions: 'Morning mid-stream urine sample', homeCollection: true, displayOrder: 15, shortDescription: 'Urinalysis test', description: 'Complete urinalysis.' },
  ]

  for (const test of tests) {
    await prisma.test.upsert({
      where: { slug: test.slug },
      update: { price: test.price, mrp: test.mrp, isActive: true },
      create: { ...test, isActive: true },
    })
  }
  console.log('Tests created:', tests.length)

  const basicTests = ['cbc', 'blood-sugar-fasting', 'lipid-profile', 'lft', 'kft']
  const fullTests = ['cbc', 'blood-sugar-fasting', 'lipid-profile', 'lft', 'kft', 'thyroid-profile', 'hba1c', 'vitamin-d', 'vitamin-b12', 'iron-studies']

  const basicPackage = await prisma.package.upsert({
    where: { slug: 'basic-health-checkup' },
    update: {},
    create: {
      name: 'Basic Health Checkup', slug: 'basic-health-checkup',
      description: 'Essential health screening',
      price: 999, mrp: 1500, discount: 33, reportTime: '24 hours',
      preparationInstructions: 'Fasting for 12 hours required',
      homeCollection: true, isFeatured: true, displayOrder: 1,
    },
  })

  const premiumPackage = await prisma.package.upsert({
    where: { slug: 'premium-health-package' },
    update: {},
    create: {
      name: 'Premium Health Package', slug: 'premium-health-package',
      description: 'Comprehensive health checkup',
      price: 2499, mrp: 3500, discount: 29, reportTime: '48 hours',
      preparationInstructions: 'Fasting for 12 hours required',
      homeCollection: true, isFeatured: true, displayOrder: 2,
    },
  })

  for (const slug of basicTests) {
    const test = await prisma.test.findUnique({ where: { slug } })
    if (test) {
      await prisma.packageTest.upsert({
        where: { packageId_testId: { packageId: basicPackage.id, testId: test.id } },
        update: {},
        create: { packageId: basicPackage.id, testId: test.id },
      })
    }
  }

  for (const slug of fullTests) {
    const test = await prisma.test.findUnique({ where: { slug } })
    if (test) {
      await prisma.packageTest.upsert({
        where: { packageId_testId: { packageId: premiumPackage.id, testId: test.id } },
        update: {},
        create: { packageId: premiumPackage.id, testId: test.id },
      })
    }
  }
  console.log('Packages created: 2')

  const services = [
    { title: 'Hematology', slug: 'hematology-service', description: 'Complete blood analysis including CBC, blood grouping, and coagulation studies.', displayOrder: 1 },
    { title: 'Clinical Biochemistry', slug: 'clinical-biochemistry-service', description: 'Advanced biochemical testing covering liver, kidney, lipid, and glucose panels.', displayOrder: 2 },
    { title: 'Molecular Diagnostics', slug: 'molecular-diagnostics-service', description: 'DNA/RNA-based testing including PCR and molecular pathogen detection.', displayOrder: 3 },
    { title: 'Clinical Immunology', slug: 'clinical-immunology-service', description: 'Immune system evaluation including autoimmune markers and allergy testing.', displayOrder: 4 },
    { title: 'Microbiology & Serology', slug: 'microbiology-serology-service', description: 'Infectious disease testing, culture & sensitivity, and serological investigations.', displayOrder: 5 },
    { title: 'Histopathology', slug: 'histopathology-service', description: 'Tissue examination and biopsy analysis for accurate disease diagnosis.', displayOrder: 6 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, isActive: true },
    })
  }
  console.log('Services created:', services.length)

  const branches = [
    { name: 'Main Branch', slug: 'main-branch', address: '123 Health Street, Medical District', city: 'Mumbai', phone: '+919876543210', whatsapp: '+919876543210', openingHours: 'Mon-Sat: 7:00 AM - 9:00 PM', nightAvailable: true, homeCollectionAvailable: true },
    { name: 'Andheri Branch', slug: 'andheri-branch', address: '456 Wellness Road, Andheri East', city: 'Mumbai', phone: '+919876543211', whatsapp: '+919876543211', openingHours: 'Mon-Sat: 8:00 AM - 8:00 PM', nightAvailable: false, homeCollectionAvailable: true },
    { name: 'Bandra Branch', slug: 'bandra-branch', address: '789 Care Avenue, Bandra West', city: 'Mumbai', phone: '+919876543212', whatsapp: '+919876543212', openingHours: 'Mon-Sat: 7:30 AM - 8:30 PM', nightAvailable: false, homeCollectionAvailable: true },
  ]

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { slug: branch.slug },
      update: {},
      create: { ...branch, isActive: true },
    })
  }
  console.log('Branches created:', branches.length)

  const settings: { key: string; value: string; type: string }[] = [
    { key: 'lab_name', value: 'Absolute Diagnostic', type: 'text' },
    { key: 'primary_phone', value: '+919876543210', type: 'text' },
    { key: 'whatsapp_number', value: '+919876543210', type: 'text' },
    { key: 'emergency_number', value: '+919876543210', type: 'text' },
    { key: 'email', value: 'info@absolutediagnostic.com', type: 'text' },
    { key: 'address', value: '123 Health Street, Medical District, Mumbai', type: 'text' },
    { key: 'home_collection_charge', value: '100', type: 'number' },
    { key: 'night_service_charge', value: '200', type: 'number' },
    { key: 'emergency_service_charge', value: '400', type: 'number' },
    { key: 'night_service_enabled', value: 'true', type: 'boolean' },
    { key: 'night_service_start', value: '19:00', type: 'time' },
    { key: 'night_service_end', value: '23:00', type: 'time' },
    { key: 'emergency_service_start', value: '23:00', type: 'time' },
    { key: 'emergency_service_end', value: '06:00', type: 'time' },
    { key: 'night_service_message', value: 'Night/Emergency service available by request.', type: 'text' },
    { key: 'home_collection_enabled', value: 'true', type: 'boolean' },
    { key: 'home_collection_timing', value: '7:00 AM - 7:00 PM', type: 'text' },
    { key: 'verification_provider', value: 'truecaller', type: 'text' },
    { key: 'facebook_url', value: '#', type: 'text' },
    { key: 'instagram_url', value: '#', type: 'text' },
    { key: 'twitter_url', value: '#', type: 'text' },
    { key: 'youtube_url', value: '#', type: 'text' },
  ]

  for (const setting of settings) {
    await prisma.websiteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('Settings created:', settings.length)

  const homepageContent: { key: string; value: string; type: string }[] = [
    { key: 'hero_heading', value: 'Advanced Diagnostics, Accurate Results', type: 'text' },
    { key: 'hero_description', value: 'Complete diagnostic solutions with home sample collection. Fast, accurate, and reliable results.', type: 'text' },
    { key: 'hero_cta_primary', value: 'Book a Test', type: 'text' },
    { key: 'hero_cta_secondary', value: 'Home Sample Collection', type: 'text' },
    { key: 'about_heading', value: 'About Absolute Diagnostic', type: 'text' },
    { key: 'about_description', value: 'Absolute Diagnostic is a leading diagnostic laboratory committed to providing accurate and timely diagnostic services.', type: 'text' },
    { key: 'about_mission', value: 'To provide accessible, accurate, and affordable diagnostic services to every patient.', type: 'text' },
    { key: 'trust_stat_1_label', value: 'Years of Service', type: 'text' },
    { key: 'trust_stat_1_value', value: '15+', type: 'text' },
    { key: 'trust_stat_2_label', value: 'Patients Served', type: 'text' },
    { key: 'trust_stat_2_value', value: '1,00,000+', type: 'text' },
    { key: 'trust_stat_3_label', value: 'Tests Available', type: 'text' },
    { key: 'trust_stat_3_value', value: '2000+', type: 'text' },
    { key: 'trust_stat_4_label', value: 'Doctor Partners', type: 'text' },
    { key: 'trust_stat_4_value', value: '500+', type: 'text' },
    { key: 'home_collection_heading', value: 'Home Sample Collection', type: 'text' },
    { key: 'home_collection_description', value: 'Get your samples collected from the comfort of your home.', type: 'text' },
    { key: 'night_service_heading', value: 'Night & Emergency Services', type: 'text' },
    { key: 'night_service_description', value: 'Need diagnostic tests during night hours? Our night service is available.', type: 'text' },
    { key: 'footer_description', value: 'Absolute Diagnostic - Advanced diagnostic laboratory.', type: 'text' },
    { key: 'working_hours', value: 'Mon-Sat: 7:00 AM - 9:00 PM | Sun: 8:00 AM - 2:00 PM', type: 'text' },
  ]

  for (const content of homepageContent) {
    await prisma.homepageContent.upsert({
      where: { key: content.key },
      update: { value: content.value },
      create: content,
    })
  }
  console.log('Homepage content created:', homepageContent.length)

  const faqs = [
    { question: 'How do I book a test?', answer: 'Book through our website, call our helpline, or WhatsApp us.', displayOrder: 1 },
    { question: 'Is home sample collection available?', answer: 'Yes, select home collection while booking.', displayOrder: 2 },
    { question: 'How long to get reports?', answer: 'Most routine tests within 24 hours.', displayOrder: 3 },
    { question: 'How can I access reports online?', answer: 'Visit View Reports, enter your mobile number, complete verification.', displayOrder: 4 },
    { question: 'What payment methods are accepted?', answer: 'Cash, UPI, debit/credit cards, and net banking.', displayOrder: 5 },
  ]

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } })
    if (!existing) await prisma.fAQ.create({ data: faq })
  }
  console.log('FAQs created')

  const testimonials = [
    { patientName: 'Rajesh Kumar', content: 'Excellent service! Home collection was convenient and reports were on time.', rating: 5, isFeatured: true },
    { patientName: 'Priya Sharma', content: 'Very professional staff and accurate results.', rating: 5, isFeatured: true },
    { patientName: 'Amit Patel', content: 'Quick and hassle-free experience.', rating: 5, isFeatured: true },
  ]

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { patientName: t.patientName } })
    if (!existing) await prisma.testimonial.create({ data: { ...t, isActive: true } })
  }
  console.log('Testimonials created')

  console.log('Seed completed!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
