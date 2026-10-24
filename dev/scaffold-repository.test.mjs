import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { scaffoldRepository } from './scaffold-repository.mjs'

async function withDirectory(run) {
  const parent = await mkdtemp(join(tmpdir(), 'silver-labs-scaffold-'))
  try {
    await run(parent)
  } finally {
    await rm(parent, { recursive: true, force: true })
  }
}

test('creates a starter repository and safely reruns without overwriting it', async () => {
  await withDirectory(async (parent) => {
    const destination = join(parent, 'silver-scan')
    assert.deepEqual(await scaffoldRepository('silver-scan', destination), {
      destination,
      created: true,
    })
    const readmePath = join(destination, 'README.md')
    const original = await readFile(readmePath, 'utf8')
    assert.match(original, /^# silver-scan/m)

    assert.deepEqual(await scaffoldRepository('silver-scan', destination), {
      destination,
      created: false,
    })
    assert.equal(await readFile(readmePath, 'utf8'), original)
  })
})

test('refuses to overwrite existing projects or modified scaffolds', async () => {
  await withDirectory(async (parent) => {
    const existing = join(parent, 'existing')
    await mkdir(existing)
    await writeFile(join(existing, 'README.md'), 'user project\n')
    await assert.rejects(scaffoldRepository('silver-scan', existing), /without a scaffold marker/)
    assert.equal(await readFile(join(existing, 'README.md'), 'utf8'), 'user project\n')

    const generated = join(parent, 'generated')
    await scaffoldRepository('silver-scan', generated)
    await writeFile(join(generated, 'README.md'), 'user edit\n')
    await assert.rejects(scaffoldRepository('silver-scan', generated), /refusing to overwrite/)
    assert.equal(await readFile(join(generated, 'README.md'), 'utf8'), 'user edit\n')
  })
})

test('rejects invalid project names and filesystem roots', async () => {
  await assert.rejects(scaffoldRepository('../unsafe', '/tmp/unsafe'), TypeError)
  await assert.rejects(scaffoldRepository('silver-scan', '/'), /filesystem root/)
})
