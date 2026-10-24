import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'

const schema = JSON.parse(await readFile(
  new URL('../../../schemas/v1/l2-capabilities.schema.json', import.meta.url),
  'utf8',
))
const manifest = JSON.parse(await readFile(
  new URL('../../../capabilities/v1/l2-capabilities.json', import.meta.url),
  'utf8',
))
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema)

const clone = (value) => structuredClone(value)

test('the observed local capability manifest validates against schema v1', () => {
  assert.equal(validateSchema(manifest), true, JSON.stringify(validateSchema.errors))
  assert.equal(manifest.schemaVersion, 1)
})

test('the manifest records the committed local RPC surface exactly', () => {
  assert.deepEqual(manifest.methods.read, [
    'web3_clientVersion',
    'eth_chainId',
    'net_version',
    'net_listening',
    'net_peerCount',
    'eth_blockNumber',
    'eth_getBlockByNumber',
    'eth_getBlockByHash',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_getBalance',
    'eth_getTransactionCount',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_call',
    'eth_estimateGas',
    'eth_getLogs',
  ])
  assert.deepEqual(manifest.methods.write, ['eth_sendRawTransaction'])
  assert.deepEqual(manifest.methods.developmentOnly, ['btcs_dev_mine'])
})

test('the manifest states identity and trust boundaries without overclaiming', () => {
  assert.equal(manifest.profile.profileId, 'btcs-l2-local')
  assert.equal(manifest.profile.profileType, 'local-development')
  assert.equal(manifest.profile.chainId, '31337')
  assert.equal(manifest.profile.chainIdHex, '0x7a69')
  assert.equal(BigInt(manifest.profile.chainId), BigInt(manifest.profile.chainIdHex))
  assert.equal(manifest.profile.clientVersionPrefix, 'BTCSL2/')
  assert.deepEqual(manifest.profile.nativeGas, { symbol: 'BTCS', decimals: 18 })
  assert.equal(manifest.semantics.inclusionIsFinality, false)
  assert.equal(manifest.semantics.netListening, false)
  assert.equal(manifest.semantics.netPeerCount, '0')
  assert.equal(manifest.signing.supported, false)
  assert.ok(manifest.semantics.blockTags.rejected.includes('pending'))
  assert.ok(manifest.trust.length >= 1)
})

test('every unsupported or wallet-critical method is classified exactly once', () => {
  const supported = new Set([
    ...manifest.methods.read,
    ...manifest.methods.write,
    ...manifest.methods.developmentOnly,
  ])
  for (const method of manifest.methods.unsupported) {
    assert.equal(supported.has(method), false, `${method} is both supported and unsupported`)
  }
  for (const method of [
    'eth_accounts',
    'eth_requestAccounts',
    'eth_sendTransaction',
    'eth_gasPrice',
    'eth_feeHistory',
    'eth_maxPriorityFeePerGas',
  ]) {
    assert.ok(manifest.methods.unsupported.includes(method), `${method} must be declared unsupported`)
  }
})

test('known gaps have stable unique identifiers and actionable requests', () => {
  const ids = manifest.knownGaps.map((gap) => gap.id)
  assert.equal(new Set(ids).size, ids.length, 'knownGaps ids must be unique')
  for (const id of ['cors', 'pending-block-tag', 'fee-discovery', 'funding', 'address-history']) {
    assert.ok(ids.includes(id), `missing known gap ${id}`)
  }
  for (const gap of manifest.knownGaps) {
    assert.ok(gap.impact.length > 0)
    assert.ok(gap.requestedChange.length > 0)
  }
})

test('declared consumers identify a repository or package and a status', () => {
  assert.ok(Object.hasOwn(manifest.consumers, 'readOnlyClient'))
  assert.ok(Object.hasOwn(manifest.consumers, 'silverPayWallet'))
  for (const [name, consumer] of Object.entries(manifest.consumers)) {
    assert.ok(consumer.repository || consumer.package, `${name} must name a repository or package`)
    assert.ok(consumer.status.length > 0, `${name} must describe its status`)
  }
  assert.match(manifest.consumers.silverPayWallet.repository, /SilverPay$/)
})

test('rejects missing, malformed, and unknown capability fields', () => {
  for (const field of [
    'schemaVersion',
    'profile',
    'observed',
    'methods',
    'semantics',
    'signing',
    'trust',
    'knownGaps',
    'consumers',
  ]) {
    const invalid = clone(manifest)
    delete invalid[field]
    assert.equal(validateSchema(invalid), false, `expected missing ${field} to be rejected`)
  }

  const mutations = [
    (value) => { value.schemaVersion = 2 },
    (value) => { value.schemaVersion = '1' },
    (value) => { value.unexpected = true },
    (value) => { value.profile.chainId = 31337 },
    (value) => { value.profile.chainIdHex = '31337' },
    (value) => { value.profile.nativeGas.decimals = 19.5 },
    (value) => { value.observed.cors = 'no' },
    (value) => { value.observed.revision = 'not-a-revision' },
    (value) => { value.methods.read.push(value.methods.read[0]) },
    (value) => { value.methods.read.push('not a method') },
    (value) => { value.semantics.inclusionIsFinality = true },
    (value) => { value.semantics.netPeerCount = 0 },
    (value) => { value.signing.supported = 'false' },
    (value) => { value.trust = [] },
    (value) => { value.knownGaps[0].id = 'Not Kebab' },
    (value) => { delete value.knownGaps[0].impact },
    (value) => { value.consumers.readOnlyClient = { status: 'unreleased' } },
    (value) => { value.consumers.readOnlyClient.version = 'v0.1' },
  ]
  for (const mutate of mutations) {
    const invalid = clone(manifest)
    mutate(invalid)
    assert.equal(validateSchema(invalid), false, `expected mutation to be rejected: ${mutate}`)
  }
})
