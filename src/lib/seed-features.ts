// @ts-nocheck
import mongoose from 'mongoose'
import { Patient, Booking, Sample, Report, SampleStatusHistory } from '@/models'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://maheshkumarsaini8769_db_user:UM7pQFeHOIefQE5Y@ac-neqmat8-shard-00-00.4oygjqo.mongodb.net:27017,ac-neqmat8-shard-00-01.4oygjqo.mongodb.net:27017,ac-neqmat8-shard-00-02.4oygjqo.mongodb.net:27017/absolute_diagnostic?retryWrites=true&w=majority&appName=Cluster0&tls=true&authSource=admin'

const FIRST_NAMES = ['Rajesh','Suresh','Mahesh','Ramesh','Dinesh','Naresh','Paresh','Shailesh','Kailash','Girish','Hitesh','Jignesh','Bhavesh','Nilesh','Mukesh','Umesh','Vikram','Arjun','Sanjay','Vijay','Ravi','Amit','Deepak','Rahul','Aman','Nitin','Ashish','Manoj','Pankaj','Sanjay','Sunil','Anil','Vinod','Pradeep','Manish','Sachin','Ajay','Dharmesh','Ketan','Bhupendra','Govind','Himanshu','Jatin','Karan','Lalit','Nikhil','Omkar','Prakash','Qadir','Rajiv','Sachin','Tushar','Uday','Wasim','Yogesh','Zubin','Aarti','Bhavana','Chhaya','Deepa','Falguni','Ganga','Hema','Indira','Jaya','Kavita','Leena','Meena','Nisha','Pooja','Rekha','Saroj','Tarla','Usha','Vandana','Yashoda','Zarna']
const LAST_NAMES = ['Sharma','Patel','Singh','Kumar','Verma','Gupta','Joshi','Reddy','Nair','Iyer','Desai','Mehta','Shah','Rao','Mishra','Tiwari','Pandey','Saxena','Chauhan','Rathore','Malhotra','Kapoor','Chopra','Sinha','Bhatt','Pandit','Kulkarni','Deshpande','Tamhane','Gokhale']
const SOURCES = ['Ranoli', 'Sikar', 'Jaipur', 'Neem Ka Thana', 'Chomu', 'Kuchaman', 'Walk-in']
const TEST_NAMES = ['CBC', 'LFT', 'KFT', 'Thyroid Profile', 'Lipid Profile', 'Blood Sugar Fasting', 'HbA1c', 'Urine Routine', 'ESR', 'CRP', 'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Liver Function', 'Kidney Function']
const STATUSES = ['booked', 'collection_assigned', 'collected', 'received', 'processing', 'report_under_review', 'report_ready', 'completed']
const REPORT_STATUSES = ['uploaded', 'processing', 'report_under_review', 'report_ready', 'rejected']

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randomPhone(): string { return '9' + Math.floor(100000000 + Math.random() * 900000000).toString() }
function randomAge(): number { return Math.floor(18 + Math.random() * 60) }
function generateBookingId(i: number): string { return `ADC-2026${String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0')}${String(Math.floor(Math.random() * 28 + 1)).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}` }
function generateSampleId(i: number): string { return `APC-2026-${String(1000000 + i).padStart(7, '0')}` }

async function seed() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected.')

  console.log('Creating 300 patients...')
  const patients = []
  for (let i = 0; i < 300; i++) {
    const p = await Patient.create({
      name: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
      phone: randomPhone(),
      age: randomAge(),
      gender: randomItem(['Male', 'Female']),
      source: randomItem(SOURCES),
    })
    patients.push(p)
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/300 patients created`)
  }
  console.log('300 patients created.')

  console.log('Creating 300 bookings + samples...')
  const bookings = []
  for (let i = 0; i < 300; i++) {
    const patient = patients[i]
    const bookingId = generateBookingId(i)
    const sampleId = generateSampleId(i)
    const status = randomItem(STATUSES)
    const source = patient.source || 'Walk-in'
    const testCount = Math.floor(1 + Math.random() * 3)
    const tests = Array.from({ length: testCount }, () => randomItem(TEST_NAMES))
    const items = tests.map(name => ({ testName: name, testPrice: Math.floor(200 + Math.random() * 800) }))
    const totalAmount = items.reduce((s, it) => s + it.testPrice, 0)

    const booking = await Booking.create({
      bookingId,
      sampleId,
      patientId: patient._id,
      patientName: patient.name,
      patientPhone: patient.phone,
      collectionType: randomItem(['lab_visit', 'home_collection']),
      status,
      source,
      totalAmount,
      paidAmount: Math.random() > 0.3 ? totalAmount : Math.floor(totalAmount * 0.5),
      paymentStatus: Math.random() > 0.3 ? 'paid' : 'partial',
      paymentMethod: randomItem(['cash', 'upi', 'card']),
      items,
    })
    bookings.push(booking)

    const sample = await Sample.create({
      sampleId,
      bookingId: new mongoose.Types.ObjectId((booking as any)._id?.toString() || (booking as any).id),
      patientId: new mongoose.Types.ObjectId((patient as any)._id?.toString() || (patient as any).id),
      patientName: patient.name,
      patientPhone: patient.phone,
      source,
      status,
      tests,
      collectedAt: status !== 'booked' ? new Date() : undefined,
      receivedAt: ['received', 'processing', 'report_under_review', 'report_ready', 'completed'].includes(status) ? new Date() : undefined,
      processedAt: ['processing', 'report_under_review', 'report_ready', 'completed'].includes(status) ? new Date() : undefined,
    })

    await SampleStatusHistory.create({
      sampleId: sample._id as mongoose.Types.ObjectId,
      oldStatus: '',
      newStatus: status,
      changedBy: new mongoose.Types.ObjectId(),
      changedByName: 'System (Seed)',
      notes: 'Initial seed status',
    })

    if (['report_ready', 'completed'].includes(status) && Math.random() > 0.2) {
      await Report.create({
        patientId: new mongoose.Types.ObjectId((patient as any)._id?.toString() || (patient as any).id),
        bookingId: new mongoose.Types.ObjectId((booking as any)._id?.toString() || (booking as any).id),
        testName: tests[0],
        reportDate: new Date(),
        fileUrl: `/reports/${sampleId}.pdf`,
        fileName: `${sampleId}.pdf`,
        status: 'report_ready',
        uploadedBy: 'System (Seed)',
        source,
        fileHash: `seed-hash-${i}`,
      })
    }

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/300 bookings+samples created`)
  }
  console.log('300 bookings + samples created.')

  console.log('Seed complete!')
  console.log(`  Patients: ${patients.length}`)
  console.log(`  Bookings: ${bookings.length}`)
  await mongoose.disconnect()
}

seed().catch(console.error)
