import 'dotenv/config';
import { prisma } from '../src/lib/prisma.ts';

async function main() {
  const admin = await prisma.admin.findFirst({ where: { isActive: true } });
  const patient = await prisma.patient.findFirst();
  console.log("FOUND ADMIN:", admin ? { id: admin.id, email: admin.email, role: admin.role } : "None");
  console.log("FOUND PATIENT:", patient ? { id: patient.id, phone: patient.phone, name: patient.name } : "None");
  process.exit(0);
}

main();
