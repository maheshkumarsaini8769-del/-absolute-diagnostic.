import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { Equipment } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'equipment:read')
    let list = await Equipment.find().sort({ createdAt: -1 }).lean()

    // Auto-seed realistic NABL-grade laboratory analyzers if none exist
    if (list.length === 0) {
      const seedEquipment = [
        {
          name: 'Beckman Coulter DxC 700 AU Chemistry Analyzer',
          modelNumber: 'DxC-700AU',
          serialNumber: 'BC-AU-2024-991',
          department: 'biochemistry',
          status: 'operational',
          lastCalibrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          nextCalibrationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 23),
          serviceProvider: 'Beckman Coulter India Service Team',
          logs: [
            { date: new Date(), type: 'Bi-weekly Photometer Calibration', performedBy: 'Er. Rajesh Sen (Service Eng)', notes: 'Photometer optical filters aligned. Zero drift.' }
          ]
        },
        {
          name: 'Sysmex XN-1000 Automated Hematology Analyzer',
          modelNumber: 'XN-1000',
          serialNumber: 'SYS-XN-88210',
          department: 'hematology',
          status: 'operational',
          lastCalibrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          nextCalibrationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 27),
          serviceProvider: 'Sysmex India Diagnostics',
          logs: [
            { date: new Date(), type: 'Aspirating Needle Cleaning & 5-Part Differential Calibration', performedBy: 'Lab Bio-Engineer', notes: 'All 5-part WBC channels passing control checks.' }
          ]
        },
        {
          name: 'Roche Cobas e 411 Immunoassay Analyzer',
          modelNumber: 'Cobas e411',
          serialNumber: 'ROCHE-411-1029',
          department: 'immunology',
          status: 'calibration_due',
          lastCalibrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31),
          nextCalibrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          serviceProvider: 'Roche Diagnostics Support',
          logs: [
            { date: new Date(), type: 'Monthly Chemiluminescence Assay Calibration', performedBy: 'Dr. Pathologist', notes: 'Calibration due for Thyroid and Vitamin D reagents.' }
          ]
        },
        {
          name: 'EasyLyte Plus Na+/K+/Cl- Electrolyte Analyzer',
          modelNumber: 'Medica EasyLyte',
          serialNumber: 'MED-EL-3391',
          department: 'biochemistry',
          status: 'operational',
          lastCalibrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          nextCalibrationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          serviceProvider: 'Medica Corp Technical Services',
          logs: [
            { date: new Date(), type: 'Electrode Membrane Voltage Standardization', performedBy: 'Technician', notes: 'Sodium and Potassium slopes in 98% ideal range.' }
          ]
        },
      ]
      await Equipment.insertMany(seedEquipment)
      list = await Equipment.find().sort({ createdAt: -1 }).lean()
    }

    const calibrationDueCount = list.filter((e: any) => e.status === 'calibration_due').length

    return NextResponse.json({ equipment: list, calibrationDueCount })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List equipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'equipment:write')
    const body = await request.json()
    const { action, equipmentId, name, modelNumber, serialNumber, department, serviceProvider, logType, logNotes } = body

    if (action === 'log') {
      const eq = await Equipment.findById(equipmentId)
      if (!eq) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })

      eq.logs.unshift({
        date: new Date(),
        type: logType || 'Calibration / Preventive Maintenance',
        performedBy: admin.name,
        notes: logNotes || 'Calibration verified and passed standard control curve',
      })
      eq.lastCalibrationDate = new Date()
      eq.nextCalibrationDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // +30 days
      eq.status = 'operational'
      await eq.save()

      return NextResponse.json({ success: true, equipment: eq })
    }

    // Register new equipment
    if (!name) return NextResponse.json({ error: 'Equipment name is required' }, { status: 400 })

    const eq = await Equipment.create({
      name: name.trim(),
      modelNumber,
      serialNumber,
      department: department || 'general',
      serviceProvider,
      status: 'operational',
      lastCalibrationDate: new Date(),
      nextCalibrationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      logs: [{
        date: new Date(),
        type: 'Initial Installation & Commissioning Qualification',
        performedBy: admin.name,
        notes: 'Machine installed, tested, and approved for diagnostic operations.',
      }]
    })

    return NextResponse.json({ success: true, equipment: eq }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create equipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
