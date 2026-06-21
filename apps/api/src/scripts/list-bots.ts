import { config } from "dotenv";
config({ path: "../../.env" });
config();

import { db, projects } from "@askbase/database";

const rows = await db.select({ id: projects.id, name: projects.name }).from(projects);
console.log("\nBots in database:");
rows.forEach((r) => console.log(`  ${r.name}  →  ${r.id}`));
process.exit(0);
