import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

// Simulates the authorize() logic from our credentials provider

async function authorize(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email, deleted_at: null },
  });

  if (!user || !user.password_hash || !user.is_active) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  return { id: user.id, email: user.email, name: user.full_name };
}

describe("Auth - Login (authorize logic)", () => {
  const testEmail = "login@example.com";
  const testPassword = "correctpassword";

  async function seedUser(overrides: Record<string, unknown> = {}) {
    return prisma.user.create({
      data: {
        email: testEmail,
        password_hash: await bcrypt.hash(testPassword, 12),
        full_name: "Login User",
        ...overrides,
      },
    });
  }

  it("should return user for valid credentials", async () => {
    await seedUser();

    const result = await authorize(testEmail, testPassword);

    expect(result).not.toBeNull();
    expect(result!.email).toBe(testEmail);
    expect(result!.name).toBe("Login User");
    expect(result!.id).toBeDefined();
  });

  it("should return null for wrong password", async () => {
    await seedUser();

    const result = await authorize(testEmail, "wrongpassword");
    expect(result).toBeNull();
  });

  it("should return null for non-existent email", async () => {
    const result = await authorize("nobody@example.com", "anypassword");
    expect(result).toBeNull();
  });

  it("should return null for inactive user", async () => {
    await seedUser({ is_active: false });

    const result = await authorize(testEmail, testPassword);
    expect(result).toBeNull();
  });

  it("should return null for soft-deleted user", async () => {
    await seedUser({ deleted_at: new Date() });

    const result = await authorize(testEmail, testPassword);
    expect(result).toBeNull();
  });

  it("should return null for user without password (SSO user)", async () => {
    await prisma.user.create({
      data: {
        email: "sso@example.com",
        password_hash: null,
        full_name: "SSO User",
        sso_provider_id: "azure-ad-123",
      },
    });

    const result = await authorize("sso@example.com", "anypassword");
    expect(result).toBeNull();
  });
});
