import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Add Scrap Metal Prices
  const scrapPrices = [
    { category: 'Bright Wire (Copper)', pricePerKgMin: 4.50, pricePerKgMax: 5.20, trend: 'Rising' as const },
    { category: 'Clean Brass', pricePerKgMin: 3.10, pricePerKgMax: 3.40, trend: 'Stable' as const },
    { category: 'Lead Scrap', pricePerKgMin: 1.15, pricePerKgMax: 1.35, trend: 'Falling' as const },
    { category: 'Aluminium Extrusions', pricePerKgMin: 0.85, pricePerKgMax: 1.05, trend: 'Rising' as const },
    { category: 'Heavy Scrap Iron', pricePerKgMin: 0.18, pricePerKgMax: 0.24, trend: 'Rising' as const },
    { category: 'Stainless Steel (304)', pricePerKgMin: 1.10, pricePerKgMax: 1.25, trend: 'Stable' as const },
  ]

  for (const price of scrapPrices) {
    await prisma.scrapMetalPrice.upsert({
      where: { category: price.category },
      update: price,
      create: price,
    })
  }

  console.log('✅ Seeded scrap metal prices')

  // 2. Optional: Add demo VehicleYard entries
  const demoVehicles = [
    {
      make: 'Ford', model: 'Focus 1.6 Zetec', year: 2012, trim: 'Zetec',
      color: 'Titanium Silver', status: 'In_Yard' as const,
      image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop'
    },
    {
      make: 'Vauxhall', model: 'Astra 1.7 CDTi', year: 2015, trim: 'SRi',
      color: 'Electric Orange', status: 'In_Yard' as const,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop'
    },
  ]

  for (const vehicle of demoVehicles) {
    await prisma.vehicleYard.upsert({
      where: { id: `demo-${vehicle.make}-${vehicle.model}` },
      update: vehicle,
      create: {
        ...vehicle,
        id: `demo-${vehicle.make}-${vehicle.model}`
      }
    })
  }

  console.log('✅ Seeded demo yard vehicles')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
