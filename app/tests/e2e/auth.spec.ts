import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  const testUser = {
    fullName: "E2E Test User",
    email: `e2e-${Date.now()}@test.com`,
    password: "testpass123!",
  };

  test("should show login page for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Inicia sesión en tu cuenta")).toBeVisible();

    await page.getByRole("link", { name: "Regístrate" }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText("Regístrate en Invisible PM")).toBeVisible();

    await page.getByRole("link", { name: "Inicia sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should register a new user and redirect to dashboard", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel("Nombre completo").fill(testUser.fullName);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Contraseña").fill(testUser.password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(`Bienvenido, ${testUser.fullName}`)).toBeVisible();
  });

  test("should login with existing user", async ({ page }) => {
    // Use the seed user
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@invisiblepm.dev");
    await page.getByLabel("Contraseña").fill("admin123!");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Bienvenido, Admin Dev")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@email.com");
    await page.getByLabel("Contraseña").fill("wrongpassword");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Credenciales inválidas")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
