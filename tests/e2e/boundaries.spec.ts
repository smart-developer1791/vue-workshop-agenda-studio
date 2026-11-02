import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
test('maximum accepted content stays inside reserved panels at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  const value = structuredClone(fixture)
  value.name = 'W'.repeat(80)
  value.start = 0
  value.budget = 720
  value.segments = Array.from({ length: 16 }, (_, i) => ({
    id: `segment-${i}`,
    title: 'T'.repeat(60),
    note: 'N'.repeat(240),
    minutes: 90,
    kind: i % 2 ? 'break' : 'activity',
  }))
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('heading', { name: value.name, level: 1, exact: true })).toBeVisible()
  await expect(page.locator('[data-ui="finish"]')).toHaveText('24:00')
  await expect(page.getByRole('button', { name: 'Add segment', exact: true })).toBeDisabled()
  expect(
    await page.locator('[data-ui="segment-list"]').evaluate((e) => e.scrollHeight > e.clientHeight),
  ).toBe(true)
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
