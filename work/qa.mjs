import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
const issues = []
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`))
page.on('console', (message) => { if (message.type() === 'error') issues.push(`console: ${message.text()} @ ${message.location().url}:${message.location().lineNumber}`) })
page.on('response', (response) => { if (response.status() >= 400) issues.push(`http ${response.status()}: ${response.url()}`) })

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /Turn sound into a living pattern/i }).waitFor()
await page.screenshot({ path: 'work/qa-empty.png', fullPage: true })
const firstUse = {
  title: await page.title(),
  upload: await page.getByRole('button', { name: 'Upload audio' }).isVisible(),
  emptyLibrary: await page.getByText('No projects yet').isVisible(),
}

await page.getByRole('button', { name: /Try generated demo tone/i }).click()
await page.locator('.editor-layout').waitFor({ timeout: 45000 })
await page.locator('#synth-canvas').waitFor({ timeout: 15000 })
await page.waitForTimeout(1800)
await page.screenshot({ path: 'work/qa-editor.png', fullPage: true })
const editor = {
  canvas: await page.locator('#synth-canvas').isVisible(),
  patterns: await page.locator('.pattern-tile').count(),
  lanes: await page.locator('.lane').count(),
  inspector: await page.getByText('Inspector').isVisible(),
}

await page.getByRole('button', { name: 'Radial Sequencer' }).click()
await page.locator('.generator-readout').getByText('Radial Sequencer').waitFor()
await page.locator('.canvas-play').click()
await page.waitForTimeout(1200)
const progressed = !((await page.locator('.transport b').textContent()) || '').includes('00:00.0')

await page.getByRole('button', { name: /Export/i }).click()
await page.getByRole('button', { name: 'Live embed' }).click()
const embed = await page.getByText('Live website embed').isVisible()
await page.screenshot({ path: 'work/qa-export.png', fullPage: true })

console.log(JSON.stringify({ firstUse, editor, progressed, embed, issues }, null, 2))
await browser.close()
