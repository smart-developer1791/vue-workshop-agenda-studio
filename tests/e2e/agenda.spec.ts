import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
test('partial minute drafts preserve the last timeline and saved workspace', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('11:10')
  const duration = page.getByRole('textbox', { name: 'Duration (min)', exact: true })
  await duration.fill('')
  await expect(page.getByRole('alert')).toContainText('whole minutes')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('11:10')
  await expect(page.getByRole('button', { name: 'Markdown', exact: true })).toBeDisabled()
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('vue-workshop-agenda-studio:v1') ?? 'null'),
    ),
  ).toBeNull()
  await duration.fill('15')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('11:15')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('vue-workshop-agenda-studio:v1')!).segments[0].minutes,
      ),
    )
    .toBe(15)
  await duration.fill('1e2')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('11:15')
  await page.reload()
  await expect(duration).toHaveValue('15')
})
test('native time and budget fields show same-day limits and overruns', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Time budget (min)', exact: true }).fill('80')
  await expect(page.locator('[data-ui="budget"]')).toHaveText('20m')
  await expect(page.getByText('OVER BUDGET', { exact: true })).toBeVisible()
  await page.getByLabel('Start time', { exact: true }).fill('23:00')
  await expect(page.getByRole('alert')).toContainText('midnight')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('11:10')
  await page.getByLabel('Start time', { exact: true }).fill('13:30')
  await expect(page.locator('[data-ui="finish"]')).toHaveText('15:10')
})
test('reordering, adding, and confirmed removal retain fixed editor geometry', async ({ page }) => {
  await page.goto('/')
  const panel = page.locator('[data-ui="timeline"]')
  const dimensions = () =>
    panel.evaluate((e) => ({
      top: e.getBoundingClientRect().top + scrollY,
      height: e.getBoundingClientRect().height,
    }))
  const before = await dimensions()
  await page
    .locator('[data-ui="segment-list"]')
    .getByRole('button', { name: /Map the possibilities/ })
    .click()
  await page.getByRole('button', { name: 'Move earlier', exact: true }).click()
  await expect(
    page.getByRole('list', { name: 'Timeline' }).getByRole('heading').first(),
  ).toHaveText('Map the possibilities')
  await page.getByRole('button', { name: 'Add segment', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Segment title', exact: true })).toHaveValue(
    'A new conversation',
  )
  await page.getByRole('button', { name: 'Remove segment', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-ui="segment-list"] button')).toHaveCount(6)
  await page.getByRole('button', { name: 'Remove segment', exact: true }).click()
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Remove segment', exact: true })
    .click()
  await expect(page.locator('[data-ui="segment-list"] button')).toHaveCount(5)
  expect(await dimensions()).toEqual(before)
})
test('Markdown download contains complete edited program and escaped notes', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('textbox', { name: 'Facilitator note', exact: true })
    .fill('Bring [ideas] | <cards>')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown', exact: true }).click()
  const download = await pending,
    content = await readFile((await download.path())!, 'utf8')
  expect(download.suggestedFilename()).toMatch(/^WA-[A-F0-9]{8}\.md$/)
  expect(content).toContain('Bring \\[ideas\\] \\| \\<cards\\>')
  expect(content).toContain('09:30–09:40')
  expect(content).toContain('Share and reflect')
  expect(content).toContain('CodeSculptor')
})
