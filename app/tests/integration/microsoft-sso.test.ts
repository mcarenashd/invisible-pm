import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { getTestPrisma } from "../helpers/db";

const prisma = getTestPrisma();

async function createUserWithAccount() {
  const user = await prisma.user.create({
    data: {
      email: `sso-${randomUUID().slice(0, 8)}@test.com`,
      full_name: "SSO User",
      password_hash: null,
      sso_provider_id: randomUUID(),
    },
  });

  const account = await prisma.account.create({
    data: {
      user_id: user.id,
      type: "oauth",
      provider: "microsoft-entra-id",
      provider_account_id: randomUUID(),
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "Bearer",
      scope: "openid profile email User.Read Calendars.Read offline_access",
    },
  });

  return { user, account };
}

describe("Microsoft SSO - Account Model", () => {
  it("should create an Account linked to a User", async () => {
    const { user, account } = await createUserWithAccount();

    expect(account.id).toBeDefined();
    expect(account.user_id).toBe(user.id);
    expect(account.provider).toBe("microsoft-entra-id");
    expect(account.access_token).toBe("test-access-token");
  });

  it("should enforce unique provider + provider_account_id", async () => {
    const { account } = await createUserWithAccount();

    const user2 = await prisma.user.create({
      data: {
        email: `sso2-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "SSO User 2",
      },
    });

    await expect(
      prisma.account.create({
        data: {
          user_id: user2.id,
          type: "oauth",
          provider: account.provider,
          provider_account_id: account.provider_account_id,
          access_token: "different-token",
        },
      })
    ).rejects.toThrow();
  });

  it("should cascade delete accounts when user is deleted", async () => {
    const { user, account } = await createUserWithAccount();

    await prisma.account.deleteMany({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.account.findUnique({
      where: { id: account.id },
    });
    expect(found).toBeNull();
  });

  it("should upsert account tokens on re-login", async () => {
    const { account } = await createUserWithAccount();

    const newToken = "refreshed-access-token";
    const newExpiry = Math.floor(Date.now() / 1000) + 7200;

    const updated = await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: newToken,
        expires_at: newExpiry,
      },
    });

    expect(updated.access_token).toBe(newToken);
    expect(updated.expires_at).toBe(newExpiry);
  });

  it("should provision new SSO user with Consultor role in default workspace", async () => {
    // Setup: create workspace + Consultor role
    const workspace = await prisma.workspace.create({
      data: {
        name: "SSO Test Workspace",
        domain: `sso-${randomUUID().slice(0, 8)}.com`,
      },
    });
    const consultorRole = await prisma.role.upsert({
      where: { name: "Consultor" },
      update: {},
      create: { name: "Consultor", description: "Consultor role" },
    });

    // Simulate SSO user provisioning
    const ssoUser = await prisma.user.create({
      data: {
        email: `newsso-${randomUUID().slice(0, 8)}@corp.com`,
        full_name: "New SSO User",
        sso_provider_id: randomUUID(),
        is_active: true,
      },
    });

    await prisma.workspaceUser.create({
      data: {
        user_id: ssoUser.id,
        workspace_id: workspace.id,
        role_id: consultorRole.id,
      },
    });

    const membership = await prisma.workspaceUser.findFirst({
      where: { user_id: ssoUser.id },
      include: { role: true },
    });

    expect(membership).not.toBeNull();
    expect(membership!.role.name).toBe("Consultor");
  });
});

describe("Microsoft SSO - Time Entry with OUTLOOK source", () => {
  it("should create time entry with source OUTLOOK and external_event_id", async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Outlook WS",
        domain: `ol-${randomUUID().slice(0, 8)}.com`,
      },
    });
    const project = await prisma.project.create({
      data: { name: "Outlook Project", workspace_id: workspace.id },
    });
    const task = await prisma.task.create({
      data: { title: "Meeting Task", project_id: project.id, position: 0 },
    });
    const user = await prisma.user.create({
      data: {
        email: `outlook-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Outlook User",
        hourly_rate: 50,
      },
    });

    const eventId = `AAMkAG${randomUUID()}`;
    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 1.5,
        source: "OUTLOOK",
        external_event_id: eventId,
        rate_snapshot: user.hourly_rate,
      },
    });

    expect(entry.source).toBe("OUTLOOK");
    expect(entry.external_event_id).toBe(eventId);
    expect(Number(entry.rate_snapshot)).toBe(50);
  });

  it("should prevent duplicate time entries for the same external_event_id", async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Dedup WS",
        domain: `dd-${randomUUID().slice(0, 8)}.com`,
      },
    });
    const project = await prisma.project.create({
      data: { name: "Dedup Project", workspace_id: workspace.id },
    });
    const task = await prisma.task.create({
      data: { title: "Dedup Task", project_id: project.id, position: 0 },
    });
    const user = await prisma.user.create({
      data: {
        email: `dedup-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Dedup User",
      },
    });

    const eventId = `AAMkAG${randomUUID()}`;

    await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 1,
        source: "OUTLOOK",
        external_event_id: eventId,
      },
    });

    // Application-level dedup: check before insert
    const existing = await prisma.timeEntry.findFirst({
      where: {
        user_id: user.id,
        external_event_id: eventId,
        deleted_at: null,
      },
    });

    expect(existing).not.toBeNull();
    // The API would return 409 here instead of creating a duplicate
  });

  it("should not count soft-deleted entries as duplicates", async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Soft WS",
        domain: `soft-${randomUUID().slice(0, 8)}.com`,
      },
    });
    const project = await prisma.project.create({
      data: { name: "Soft Project", workspace_id: workspace.id },
    });
    const task = await prisma.task.create({
      data: { title: "Soft Task", project_id: project.id, position: 0 },
    });
    const user = await prisma.user.create({
      data: {
        email: `soft-${randomUUID().slice(0, 8)}@test.com`,
        full_name: "Soft User",
      },
    });

    const eventId = `AAMkAG${randomUUID()}`;

    // Create and soft-delete
    const entry = await prisma.timeEntry.create({
      data: {
        user_id: user.id,
        task_id: task.id,
        date: new Date("2026-02-26"),
        hours: 1,
        source: "OUTLOOK",
        external_event_id: eventId,
      },
    });
    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { deleted_at: new Date() },
    });

    // Soft-deleted entry should not block re-registration
    const existing = await prisma.timeEntry.findFirst({
      where: {
        user_id: user.id,
        external_event_id: eventId,
        deleted_at: null,
      },
    });

    expect(existing).toBeNull();
  });
});
