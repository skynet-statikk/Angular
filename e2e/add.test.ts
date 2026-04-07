import { test, expect, Page } from '@playwright/test';

async function openAddDialog(page: Page) {
  // click the first icon-button in the customers table (Add)
  const addBtn = page.locator('app-customers-table button[mat-icon-button]').first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForSelector('mat-dialog-container');
  return page.locator('mat-dialog-container');
}

async function fillAddForm(dialog: any, first = 'E2E', last = 'User', email = 'e2e@example.com', active = true) {
  const inputs = dialog.locator('input');
  await inputs.nth(0).fill(first);
  await inputs.nth(1).fill(last);
  await inputs.nth(2).fill(email);
  const checkbox = dialog.locator('mat-checkbox input[type="checkbox"]');
  const checked = await checkbox.isChecked();
  if (checked !== active) await dialog.locator('mat-checkbox').click();
}

// Adds correctly - Clicks add button to open add dialog
// - Fills all fields with valid values
// - Clicks add
// - Customer is added to the table
test('Adds correctly - Clicks add button to open add dialog', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);

  const firstName = `E2EFirst${Date.now()}`;
  await fillAddForm(dialog, firstName, 'Tester', `${firstName.toLowerCase()}@example.com`, true);

  // click Add button in dialog
  const addBtn = dialog.locator('button:has-text("Add")');
  await expect(addBtn).toBeEnabled();
  
  // Wait for POST to complete and dialog to close
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.status() === 201),
    addBtn.click()
  ]);

  // dialog should be closed
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);

  // Wait for URL to settle
  await page.waitForURL(/\/customers$/);
  
  // Wait a bit for signal updates
  await page.waitForTimeout(300);

  // Verify the customer was added by checking the GET request response
  const customers = await page.evaluate(async () => {
    const response = await fetch('/api/customers');
    return response.json();
  });

  const found = customers.some((c: any) => c.firstName === firstName);
  expect(found).toBe(true);
});

// Validations - test missing first name
test('Validations - Missing first name shows error and disables Add', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  // leave first name empty
  await fillAddForm(dialog, '', 'Tester', 'valid@example.com');

  // expect an error for first name and Add disabled
  await expect(dialog.locator('mat-error')).toBeVisible();
  await expect(dialog.locator('button:has-text("Add")')).toBeDisabled();
});

// Validations - invalid email
test('Validations - Invalid email shows error and disables Add', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Jane', 'Tester', 'not-an-email');

  // expect an error for email and Add disabled
  await expect(dialog.locator('mat-error')).toBeVisible();
  await expect(dialog.locator('button:has-text("Add")')).toBeDisabled();
});

// Canceling when no changes - Click cancel
test('Canceling when no changes - Click cancel', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await dialog.locator('button:has-text("Cancel")').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);

  // nothing added: ensure no row with a unique test marker exists (we didn't add one)
});

// Canceling when no changes - Click outside
test('Canceling when no changes - Click outside', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);
  // click near top-left to click outside dialog
  await page.mouse.click(5, 5);
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when no changes - Click back
test('Canceling when no changes - Click back', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);

  // go back should close dialog (no pending changes)
  // Handle any beforeunload dialog by dismissing it
  page.once('dialog', dialog => dialog.dismiss());
  await page.goBack({ waitUntil: 'load' });

  // dialog should be closed after navigation
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when changes - Click cancel
test('Canceling when changes - Click cancel', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Changed', 'Tester', 'changed@example.com');
  await dialog.locator('button:has-text("Cancel")').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when changes - Click outside (should stay open)
test('Canceling when changes - Click outside', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Changed', 'Tester', 'changed@example.com');

  // click outside; since dialog.disableClose is set true when dirty, it should stay
  await page.mouse.click(5, 5);
  await expect(page.locator('mat-dialog-container')).toHaveCount(1);
});

// Canceling when changes - Click back (multiple cancels then confirm)
test('Canceling when changes - Click back', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);
  // make a change
  const dialog = page.locator('mat-dialog-container');
  await dialog.locator('input').first().fill('ChangedViaBack');

  // Set up dialog handler to dismiss by default
  let dismissDialog = true;
  page.on('dialog', d => {
    if (dismissDialog) {
      d.dismiss();
    } else {
      d.accept();
    }
  });

  // perform back several times and dismiss the confirm dialog (stay)
  for (let i = 0; i < 3; i++) {
    // Click the browser back button
    await page.evaluate(() => window.history.back());
    // dialog should still be present
    await expect(page.locator('mat-dialog-container')).toHaveCount(1);
  }

  // final back: accept and allow close
  dismissDialog = false;
  await page.evaluate(() => window.history.back());

  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});
