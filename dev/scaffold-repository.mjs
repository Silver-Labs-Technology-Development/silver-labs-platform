import { mkdir, readFile, lstat, rmdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = 1
const FILES = ['README.md', 'AGENTS.md']
const TEMPLATE_DIRECTORY = new URL('../templates/repository/', import.meta.url)

function isMissing(error) {
  return typeof error === 'object' && error !== null && error.code === 'ENOENT'
}

function markerContent(projectName) {
  return `${JSON.stringify({ scaffoldVersion: VERSION, projectName }, null, 2)}\n`
}

async function readTemplateFiles(projectName) {
  const result = new Map()
  for (const fileName of FILES) {
    const template = await readFile(new URL(fileName, TEMPLATE_DIRECTORY), 'utf8')
    result.set(
      fileName,
      template.replaceAll('{{PROJECT_NAME}}', projectName),
    )
  }
  result.set('.silver-labs-scaffold.json', markerContent(projectName))
  return result
}

async function verifyExistingScaffold(destination, expectedFiles) {
  const markerPath = resolve(destination, '.silver-labs-scaffold.json')
  let marker
  try {
    const markerStat = await lstat(markerPath)
    if (!markerStat.isFile() || markerStat.isSymbolicLink()) {
      throw new Error('Scaffold marker is not a regular file')
    }
    marker = await readFile(markerPath, 'utf8')
  } catch (error) {
    if (isMissing(error)) {
      throw new Error(`Refusing to modify existing directory without a scaffold marker: ${destination}`)
    }
    throw error
  }
  if (!expectedFiles.has('.silver-labs-scaffold.json') ||
      marker !== expectedFiles.get('.silver-labs-scaffold.json')) {
    throw new Error(`Existing scaffold marker does not match requested project: ${destination}`)
  }

  for (const [fileName, expectedContent] of expectedFiles) {
    const filePath = resolve(destination, fileName)
    const stat = await lstat(filePath)
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`Scaffold-owned path is not a regular file: ${filePath}`)
    }
    if (await readFile(filePath, 'utf8') !== expectedContent) {
      throw new Error(`Scaffold-owned file has changed; refusing to overwrite: ${filePath}`)
    }
  }
}

export async function scaffoldRepository(projectName, destinationPath) {
  if (typeof projectName !== 'string' || !/^[a-z][a-z0-9-]{1,49}$/.test(projectName)) {
    throw new TypeError('Project name must be a 2-50 character lowercase slug')
  }
  if (typeof destinationPath !== 'string' || destinationPath.length === 0) {
    throw new TypeError('An explicit destination path is required')
  }

  const destination = resolve(destinationPath)
  if (destination === dirname(destination) || destination.split(sep).includes('.git')) {
    throw new Error('Refusing to scaffold a filesystem root or a Git metadata directory')
  }
  const expectedFiles = await readTemplateFiles(projectName)
  try {
    const existing = await lstat(destination)
    if (!existing.isDirectory() || existing.isSymbolicLink()) {
      throw new Error(`Destination exists and is not a regular directory: ${destination}`)
    }
    await verifyExistingScaffold(destination, expectedFiles)
    return { destination, created: false }
  } catch (error) {
    if (!isMissing(error)) throw error
  }

  await mkdir(dirname(destination), { recursive: true })
  await mkdir(destination)
  const createdPaths = []
  try {
    for (const [fileName, content] of expectedFiles) {
      const filePath = resolve(destination, fileName)
      await writeFile(filePath, content, { encoding: 'utf8', flag: 'wx', mode: 0o644 })
      createdPaths.push(filePath)
    }
  } catch (error) {
    for (const filePath of createdPaths.reverse()) {
      try {
        await unlink(filePath)
      } catch {
        // Preserve unexpected concurrent changes; the original error remains primary.
      }
    }
    try {
      await rmdir(destination)
    } catch {
      // Do not remove a directory that is no longer empty.
    }
    throw error
  }
  return { destination, created: true }
}

function printUsage() {
  process.stderr.write('Usage: node dev/scaffold-repository.mjs <project-slug> <destination>\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , projectName, destination] = process.argv
  if (!projectName || !destination) {
    printUsage()
    process.exitCode = 2
  } else {
    scaffoldRepository(projectName, destination).then(
      ({ destination: createdAt, created }) => {
        process.stdout.write(`${created ? 'Scaffold created' : 'Scaffold already up to date'}: ${createdAt}\n`)
      },
      (error) => {
        process.stderr.write(`Unable to scaffold repository: ${error.message}\n`)
        process.exitCode = 1
      },
    )
  }
}
