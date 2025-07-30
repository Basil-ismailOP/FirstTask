import "dotenv/config";
import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

const client = new SQL(process.env.PGCONNECTION!);
export const db = drizzle({ client });
