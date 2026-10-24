import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import {
  NetworkIdentityValidationError,
  UnsupportedNetworkIdentitySchemaError,
  UnsupportedNetworkProfileError,
  validateNetworkIdentity,
} from '../src/index.js'

const schema = JSON.parse(await readFile(
  new URL('../../../schemas/v1/network-identity.schema.json', import.meta.url),
  'utf8',
))
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema)

const validLocalIdentity = Object.freeze({
  schemaVersion: 1,
  profileType: 'local-development',
  profileId: 'btcs-l2-local',
  chainId: '31337',
  clientVersion: 'BTCSL2/v0.14-local/test',
})

test('accepts the explicit local-development schema v1 identity', () => {
  assert.equal(validateSchema(validLocalIdentity), true)
  assert.deepEqual(validateNetworkIdentity(validLocalIdentity), validLocalIdentity)
})

test('rejects missing, malformed, and unknown identity fields in schema instances', () => {
  for (const field of ['schemaVersion', 'profileType', 'profileId', 'chainId', 'clientVersion']) {
    const invalid = { ...validLocalIdentity }
    delete invalid[field]
    assert.equal(validateSchema(invalid), false, `expected missing ${field} to be rejected`)
  }

  for (const invalid of [
    { ...validLocalIdentity, schemaVersion: '1' },
    { ...validLocalIdentity, schemaVersion: 2 },
    { ...validLocalIdentity, profileType: 'public-network' },
    { ...validLocalIdentity, profileId: 'btcs-l2-mainnet' },
    { ...validLocalIdentity, chainId: '0x7a69' },
    { ...validLocalIdentity, chainId: '1' },
    { ...validLocalIdentity, clientVersion: 'Geth/v1.15.0' },
    { ...validLocalIdentity, unexpected: true },
  ]) {
    assert.equal(validateSchema(invalid), false)
  }
})

test('runtime validation gives explicit schema-version and profile compatibility errors', () => {
  assert.throws(
    () => validateNetworkIdentity({ ...validLocalIdentity, schemaVersion: 2 }),
    UnsupportedNetworkIdentitySchemaError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validLocalIdentity, profileId: 'btcs-l2-mainnet' }),
    UnsupportedNetworkProfileError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validLocalIdentity, profileType: 'public-network' }),
    UnsupportedNetworkProfileError,
  )
  const { schemaVersion: _schemaVersion, ...unversionedIdentity } = validLocalIdentity
  assert.throws(
    () => validateNetworkIdentity(unversionedIdentity),
    NetworkIdentityValidationError,
  )
})

test('runtime validation rejects malformed and unknown fields deterministically', () => {
  assert.throws(
    () => validateNetworkIdentity({ ...validLocalIdentity, chainId: '0x7a69' }),
    NetworkIdentityValidationError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validLocalIdentity, unexpected: true }),
    NetworkIdentityValidationError,
  )
})
