/**
 * Loaded before every test file (via --import). Points the data layer at a
 * throwaway database so tests never touch data/curatit.db.
 */
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

process.env.CURATIT_DB_PATH = path.join(os.tmpdir(), `curatit-test-${randomUUID()}.db`);
process.env.CURATIT_SECRET = "test-secret-not-for-production";
