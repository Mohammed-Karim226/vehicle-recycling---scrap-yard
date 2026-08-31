import { runRetentionMaintenance } from "../lib/maintenance/retention";
import { prisma } from "../lib/prisma";

runRetentionMaintenance()
  .then((result) => console.log(JSON.stringify(result)))
  .finally(() => prisma.$disconnect());
