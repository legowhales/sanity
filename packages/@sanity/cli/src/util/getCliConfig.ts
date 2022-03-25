/**
 * Reads the Sanity CLI config from one of the following files (in preferred order):
 *   - sanity.cli.js
 *   - sanity.cli.ts
 *
 * Note: There are two ways of using this:
 * a) `getCliConfig(cwd)`
 * b) `getCliConfig(cwd, {forked: true})`
 *
 * Approach a is generally a bit faster as it avoids the forking startup time, while
 * approach b could be considered "safer" since any side-effects of running the config
 * file will not bleed into the current CLI process directly.
 */
import path from 'path'
import {promises as fs} from 'fs'
import {Worker} from 'worker_threads'
import {register} from 'esbuild-register/dist/node'
import type {CliConfig, SanityJson} from '../types'
import {dynamicRequire} from './dynamicRequire'
import {getCliWorkerPath} from './cliWorker'

export type CliMajorVersion = 2 | 3

export type CliConfigResult =
  | {config: SanityJson; path: string; version: 2}
  | {config: CliConfig; path: string; version: 3}
  | {config: null; path: string; version: CliMajorVersion}

export async function getCliConfig(
  cwd: string,
  {forked}: {forked?: boolean} = {}
): Promise<CliConfigResult | null> {
  if (forked) {
    try {
      return await getCliConfigForked(cwd)
    } catch (err) {
      // Intentional noop - try unforked variant
    }
  }

  const {unregister} = register()

  try {
    const v3Config = await getSanityCliConfig(cwd)
    if (v3Config) {
      return v3Config
    }

    return getSanityJsonConfig(cwd)
  } catch (err) {
    throw err
  } finally {
    unregister()
  }
}

async function getCliConfigForked(cwd: string): Promise<CliConfigResult | null> {
  const workerPath = await getCliWorkerPath('util/getCliConfig.worker')
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {workerData: cwd})
    worker.on('message', (message) => {
      if (message.type === 'config') {
        resolve(message.config)
      } else {
        const error = new Error(message.error)
        ;(error as any).type = message.errorType
        reject(new Error(message.error))
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

async function getSanityJsonConfig(cwd: string): Promise<CliConfigResult | null> {
  const configPath = path.join(cwd, 'sanity.json')
  const exists = await fs.stat(configPath).then(yes, nope)

  if (!exists) {
    return null
  }

  return {
    config: await loadJsonConfig(configPath),
    path: configPath,
    version: 2,
  }
}

async function getSanityCliConfig(cwd: string): Promise<CliConfigResult | null> {
  const jsConfigPath = path.join(cwd, 'sanity.cli.js')
  const tsConfigPath = path.join(cwd, 'sanity.cli.ts')

  const [js, ts] = await Promise.all([
    fs.stat(jsConfigPath).then(yes, nope),
    fs.stat(tsConfigPath).then(yes, nope),
  ])

  if (!js && !ts) {
    return null
  }

  if (!js && ts) {
    return {
      config: importConfig(tsConfigPath),
      path: tsConfigPath,
      version: 3,
    }
  }

  if (js && ts) {
    warn('Found both `sanity.cli.js` and `sanity.cli.ts` - using sanity.cli.js')
  }

  return {
    config: importConfig(jsConfigPath),
    path: jsConfigPath,
    version: 3,
  }
}

async function loadJsonConfig(filePath: string): Promise<SanityJson | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    console.error(`Error reading "${filePath}": ${err.message}`)
    return null
  }
}

function importConfig(filePath: string): CliConfig | null {
  try {
    const config = dynamicRequire<CliConfig | {default: CliConfig} | null>(filePath)
    if (config === null || typeof config !== 'object') {
      throw new Error('Module export is not a configuration object')
    }

    return 'default' in config ? config.default : config
  } catch (err) {
    console.error(`Error reading "${filePath}": ${err.message}`)
    return null
  }
}

function warn(warning: string) {
  if (typeof process.send === 'function') {
    process.send({type: 'warning', warning})
  } else {
    console.warn(warning)
  }
}

function yes() {
  return true
}

function nope() {
  return false
}
