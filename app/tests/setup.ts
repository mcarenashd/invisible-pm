import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

import { applyMigrations, disconnectTestDb, resetDatabase } from "./helpers/db";

// Apply migrations to test DB before all tests
beforeAll(async () => {
  applyMigrations();
});

// Clean database between test files
beforeEach(async () => {
  await resetDatabase();
});

// Close DB connection after all tests
afterAll(async () => {
  await disconnectTestDb();
});
