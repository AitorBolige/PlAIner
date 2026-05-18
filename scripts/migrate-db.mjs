// One-off: copia los datos de la BD B (origen) a la BD A (destino, la tuya).
// Uso:  node scripts/migrate-db.mjs            -> muestra recuentos (dry run)
//       node scripts/migrate-db.mjs --apply    -> ejecuta la migración
import { PrismaClient } from "@prisma/client";

const SRC_URL =
  "postgresql://postgres.bfcepymctxdbzayqabhl:plainerthegoat@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require";
const DST_URL =
  "postgresql://postgres.xibxfnfyttxusnntcoti:bogDud-tecje5-juvket@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";

const APPLY = process.argv.includes("--apply");

const src = new PrismaClient({ datasources: { db: { url: SRC_URL } } });
const dst = new PrismaClient({ datasources: { db: { url: DST_URL } } });

// Orden respetando claves foráneas.
const MODELS = [
  "user",
  "travelSearch",
  "account",
  "session",
  "passwordResetToken",
  "trip",
  "travelOffer",
  "travelRefreshRun",
  "day",
  "activity",
  "verificationToken",
];

async function main() {
  console.log(APPLY ? "=== MIGRACIÓN (apply) ===" : "=== DRY RUN (solo recuentos) ===\n");

  for (const model of MODELS) {
    let rows;
    try {
      if (model === "user") {
        // B tiene un esquema antiguo de User (sin campos de onboarding):
        // lo leemos en crudo y normalizamos travelStyles (null -> []).
        const raw = await src.$queryRaw`select * from "User"`;
        rows = raw.map((u) => ({
          ...u,
          travelStyles: u.travelStyles ?? [],
        }));
      } else {
        rows = await src[model].findMany();
      }
    } catch (e) {
      const msg = (e.message || "").split("\n").filter(Boolean).pop() || "tabla no existe en B";
      console.log(`${model}: omitido (origen) -> ${msg}`);
      continue;
    }

    if (!APPLY) {
      const dstCount = await dst[model].count();
      console.log(`${model}: ${rows.length} en B  |  ${dstCount} en A`);
      continue;
    }

    if (rows.length === 0) {
      console.log(`${model}: 0 filas, nada que copiar`);
      continue;
    }

    // Intento rápido en bloque.
    let inserted = 0;
    let skipped = 0;
    try {
      const res = await dst[model].createMany({ data: rows, skipDuplicates: true });
      inserted = res.count;
      skipped = rows.length - res.count;
    } catch {
      // Fallback fila a fila (p. ej. si falla una FK).
      for (const row of rows) {
        try {
          await dst[model].create({ data: row });
          inserted++;
        } catch {
          skipped++;
        }
      }
    }
    console.log(`${model}: ${inserted} insertadas, ${skipped} omitidas (ya existían o FK)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await src.$disconnect();
    await dst.$disconnect();
  });
