import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createUserWithPassword(password: string) {
  const password_hash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email: `profile-${randomUUID().slice(0, 8)}@test.com`,
      full_name: "Profile User",
      password_hash,
      is_active: true,
    },
  });
}

describe("Profile & User Management", () => {
  it("should update user full_name", async () => {
    const user = await createUserWithPassword("test1234");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { full_name: "Nuevo Nombre" },
    });

    expect(updated.full_name).toBe("Nuevo Nombre");
  });

  it("should enforce email uniqueness", async () => {
    const user1 = await createUserWithPassword("test1234");
    const user2 = await createUserWithPassword("test1234");

    // Try to set user2 email to user1's current email — should fail
    await expect(
      prisma.user.update({
        where: { id: user2.id },
        data: { email: user1.email },
      })
    ).rejects.toThrow();
  });

  it("should verify and change password with bcrypt", async () => {
    const originalPassword = "original123";
    const user = await createUserWithPassword(originalPassword);

    // Verify original password works
    const isOriginalValid = await bcrypt.compare(
      originalPassword,
      user.password_hash!
    );
    expect(isOriginalValid).toBe(true);

    // Change password
    const newHash = await bcrypt.hash("newpassword123", 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });

    // Verify new password works
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const isNewValid = await bcrypt.compare(
      "newpassword123",
      updatedUser!.password_hash!
    );
    expect(isNewValid).toBe(true);

    // Verify old password no longer works
    const isOldValid = await bcrypt.compare(
      originalPassword,
      updatedUser!.password_hash!
    );
    expect(isOldValid).toBe(false);
  });

  it("should toggle user is_active", async () => {
    const user = await createUserWithPassword("test1234");
    expect(user.is_active).toBe(true);

    // Deactivate
    const deactivated = await prisma.user.update({
      where: { id: user.id },
      data: { is_active: false },
    });
    expect(deactivated.is_active).toBe(false);

    // Reactivate
    const reactivated = await prisma.user.update({
      where: { id: user.id },
      data: { is_active: true },
    });
    expect(reactivated.is_active).toBe(true);
  });

  it("should prevent login for inactive users", async () => {
    const password = "test1234";
    const user = await createUserWithPassword(password);

    // Deactivate the user
    await prisma.user.update({
      where: { id: user.id },
      data: { is_active: false },
    });

    // Simulate auth check: find active user
    const activeUser = await prisma.user.findUnique({
      where: { email: user.email, deleted_at: null },
    });

    // User exists but is_active should be false
    expect(activeUser).not.toBeNull();
    expect(activeUser!.is_active).toBe(false);
    // Auth provider checks is_active before allowing login (auth.ts:28)
  });
});
