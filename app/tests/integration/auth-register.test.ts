import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

// Test the registration logic directly against the database
// This validates our data layer without needing the full Next.js server

describe("Auth - Register", () => {
  it("should create a new user with hashed password", async () => {
    const email = "test@example.com";
    const password = "securepass123";
    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name: "Test User",
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.full_name).toBe("Test User");
    expect(user.password_hash).not.toBe(password);
    expect(user.is_active).toBe(true);

    const isValid = await bcrypt.compare(password, user.password_hash!);
    expect(isValid).toBe(true);
  });

  it("should reject duplicate emails", async () => {
    const email = "duplicate@example.com";
    const password_hash = await bcrypt.hash("pass123", 12);

    await prisma.user.create({
      data: { email, password_hash, full_name: "First User" },
    });

    await expect(
      prisma.user.create({
        data: { email, password_hash, full_name: "Second User" },
      })
    ).rejects.toThrow();
  });

  it("should set default values correctly", async () => {
    const user = await prisma.user.create({
      data: {
        email: "defaults@example.com",
        password_hash: await bcrypt.hash("pass123", 12),
        full_name: "Default User",
      },
    });

    expect(user.is_active).toBe(true);
    expect(user.hourly_rate).toBeNull();
    expect(user.sso_provider_id).toBeNull();
    expect(user.deleted_at).toBeNull();
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
