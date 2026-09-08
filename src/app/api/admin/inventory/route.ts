import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { InventoryItem } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'inventory:read')
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const filter: Record<string, any> = {}
    if (category && category !== 'all') filter.category = category
    if (status && status !== 'all') filter.status = status

    let items = await InventoryItem.find(filter).sort({ createdAt: -1 }).lean()

    // Auto-seed if empty so laboratory has realistic clinical inventory ready!
    if (items.length === 0 && !category && !status) {
      const seedItems = [
        { name: 'K2 EDTA Purple Vacutainer Tubes (3ml)', category: 'vacutainer', sku: 'VT-EDTA-01', currentStock: 450, unit: 'tubes', minThreshold: 100, status: 'in_stock', costPerUnit: 12 },
        { name: 'SST Gel Gold Vacutainer Tubes (5ml)', category: 'vacutainer', sku: 'VT-SST-02', currentStock: 320, unit: 'tubes', minThreshold: 100, status: 'in_stock', costPerUnit: 15 },
        { name: 'Sodium Fluoride Grey Tubes (Glucose)', category: 'vacutainer', sku: 'VT-FL-03', currentStock: 45, unit: 'tubes', minThreshold: 80, status: 'low_stock', costPerUnit: 14 },
        { name: 'Beckman Coulter Glucose Hexokinase Reagent', category: 'reagent', sku: 'RG-GLU-10', currentStock: 8, unit: 'kits', minThreshold: 3, status: 'in_stock', costPerUnit: 2400 },
        { name: 'Sysmex Hematology Diluent Solution (20L)', category: 'reagent', sku: 'RG-DIL-20', currentStock: 2, unit: 'drums', minThreshold: 4, status: 'low_stock', costPerUnit: 4500 },
        { name: 'Roche Lipid Panel Calibrator Set', category: 'reagent', sku: 'RG-CAL-04', currentStock: 5, unit: 'vials', minThreshold: 2, status: 'in_stock', costPerUnit: 3800 },
        { name: 'Nitrile Examination Gloves (Medium)', category: 'ppe', sku: 'PPE-GLV-M', currentStock: 12, unit: 'boxes', minThreshold: 5, status: 'in_stock', costPerUnit: 450 },
        { name: 'Alcohol Swabs 70% Isopropyl', category: 'consumable', sku: 'CS-SWB-01', currentStock: 25, unit: 'boxes', minThreshold: 10, status: 'in_stock', costPerUnit: 180 },
        { name: 'Dengue NS1 Antigen Rapid Test Cards', category: 'rapid_kit', sku: 'KT-DNG-01', currentStock: 35, unit: 'kits', minThreshold: 15, status: 'in_stock', costPerUnit: 650 },
        { name: 'HbA1c Micro-column Chromatography Reagents', category: 'reagent', sku: 'RG-HBA1C', currentStock: 1, unit: 'kits', minThreshold: 3, status: 'low_stock', costPerUnit: 5200 },
      ]
      await InventoryItem.insertMany(seedItems)
      items = await InventoryItem.find().sort({ createdAt: -1 }).lean()
    }

    const lowStockCount = items.filter((i: any) => i.currentStock <= i.minThreshold).length
    const totalCount = items.length

    return NextResponse.json({ items, lowStockCount, totalCount })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List inventory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'inventory:write')
    const body = await request.json()
    const { name, category, sku, currentStock, unit, minThreshold, costPerUnit, expiryDate, location } = body

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }

    const stock = Number(currentStock) || 0
    const min = Number(minThreshold) || 10
    const status = stock <= 0 ? 'low_stock' : stock <= min ? 'low_stock' : 'in_stock'

    const item = await InventoryItem.create({
      name: name.trim(),
      category: category || 'reagent',
      sku: sku.trim().toUpperCase(),
      currentStock: stock,
      unit: unit || 'units',
      minThreshold: min,
      costPerUnit: Number(costPerUnit) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      location: location || 'Main Lab Storage',
      status,
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create inventory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
