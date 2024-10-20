// import { test, expect } from '@playwright/test';
import { test, expect } from './base-fixture';

test('page1 test', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.getByRole('link', { name: 'page1' }).click();
    await page.getByRole('button', { name: 'do something on page1' }).click();
    await expect(page.locator('#result')).toHaveText(
        'something on page1 done.'
    );
});

// test('page2 test', async ({ page }) => {
//     await page.goto('http://localhost:4200/');
//     await page.getByRole('link', { name: 'page2' }).click();
//     await page.getByRole('button', { name: 'do something on page2' }).click();
//     await expect(page.locator('#result')).toHaveText(
//         'something on page2 done.'
//     );
// });