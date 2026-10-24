const QUANTITY_PATTERN = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/
const HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/

export const BTCS_L2_LOCAL = Object.freeze({
  id: 'btcs-l2-local',
  profileType: 'local-development',
  chainId: '31337',
  clientVersionPrefix: 'BTCSL2/',
})

export const NETWORK_IDENTITY_SCHEMA_VERSION = 1

export class BtcsL2ClientError extends Error {
  constructor(message, options) {
    super(message, options)
    this.name = new.target.name
  }
}

export class RpcTransportError extends BtcsL2ClientError {
  constructor(message, { cause, status } = {}) {
    super(message, { cause })
    this.status = status
  }
}

export class RpcProtocolError extends BtcsL2ClientError {}

export class JsonRpcError extends BtcsL2ClientError {
  constructor(code, message, data) {
    super(`JSON-RPC error ${code}: ${message}`)
    this.code = code
    this.data = data
  }
}

export class NetworkMismatchError extends BtcsL2ClientError {}

export class UnsupportedNetworkProfileError extends BtcsL2ClientError {
  constructor(profileId) {
    super(`Unsupported BTCS L2 network profile: ${String(profileId)}`)
  }
}

export class UnsupportedNetworkIdentitySchemaError extends BtcsL2ClientError {
  constructor(schemaVersion) {
    super(`Unsupported BTCS L2 network identity schema version: ${String(schemaVersion)}`)
    this.schemaVersion = schemaVersion
  }
}

export class NetworkIdentityValidationError extends BtcsL2ClientError {}

export function validateNetworkIdentity(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new NetworkIdentityValidationError('Network identity must be an object')
  }
  if (!Object.hasOwn(value, 'schemaVersion')) {
    throw new NetworkIdentityValidationError('Network identity is missing schemaVersion')
  }
  if (value.schemaVersion !== NETWORK_IDENTITY_SCHEMA_VERSION) {
    throw new UnsupportedNetworkIdentitySchemaError(value.schemaVersion)
  }

  const requiredFields = [
    'schemaVersion',
    'profileType',
    'profileId',
    'chainId',
    'clientVersion',
  ]
  const unknownField = Object.keys(value).find((field) => !requiredFields.includes(field))
  if (unknownField !== undefined) {
    throw new NetworkIdentityValidationError(`Network identity has an unknown field: ${unknownField}`)
  }
  const missingField = requiredFields.find((field) => !Object.hasOwn(value, field))
  if (missingField !== undefined) {
    throw new NetworkIdentityValidationError(`Network identity is missing ${missingField}`)
  }
  if (
    typeof value.profileType !== 'string' ||
    typeof value.profileId !== 'string' ||
    typeof value.chainId !== 'string' ||
    typeof value.clientVersion !== 'string'
  ) {
    throw new NetworkIdentityValidationError('Network identity fields have invalid types')
  }
  if (value.profileType !== BTCS_L2_LOCAL.profileType || value.profileId !== BTCS_L2_LOCAL.id) {
    throw new UnsupportedNetworkProfileError(value.profileId)
  }
  if (!/^(0|[1-9][0-9]*)$/.test(value.chainId)) {
    throw new NetworkIdentityValidationError('Network identity chainId must be an unsigned decimal string')
  }
  if (value.chainId !== BTCS_L2_LOCAL.chainId) {
    throw new NetworkMismatchError(
      `Expected chain id ${BTCS_L2_LOCAL.chainId}; received ${value.chainId}`,
    )
  }
  if (!value.clientVersion.startsWith(BTCS_L2_LOCAL.clientVersionPrefix)) {
    throw new NetworkMismatchError(
      `Expected a client version beginning ${BTCS_L2_LOCAL.clientVersionPrefix}; received ${value.clientVersion}`,
    )
  }
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    profileType: value.profileType,
    profileId: value.profileId,
    chainId: value.chainId,
    clientVersion: value.clientVersion,
  })
}

function parseQuantity(value, label) {
  if (typeof value !== 'string' || !QUANTITY_PATTERN.test(value)) {
    throw new RpcProtocolError(`${label} is not a valid JSON-RPC quantity`)
  }
  return BigInt(value)
}

function requireObject(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RpcProtocolError(`${label} is not an object`)
  }
  return value
}

function validateEndpoint(endpoint, profile) {
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new TypeError('An explicit BTCS L2 RPC endpoint is required')
  }
  let parsed
  try {
    parsed = new URL(endpoint)
  } catch (cause) {
    throw new TypeError('BTCS L2 RPC endpoint must be an absolute HTTP(S) URL', { cause })
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new TypeError('BTCS L2 RPC endpoint must use HTTP(S) without credentials, query, or fragment')
  }
  if (
    profile.id === BTCS_L2_LOCAL.id &&
    !['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname.toLowerCase())
  ) {
    throw new TypeError('The BTCS L2 local profile only permits loopback RPC endpoints')
  }
  return parsed.toString()
}

function validateProfile(profile) {
  if (
    typeof profile !== 'object' ||
    profile === null ||
    typeof profile.id !== 'string' ||
    profile.id.length === 0 ||
    typeof profile.chainId !== 'string' ||
    !/^(0|[1-9][0-9]*)$/.test(profile.chainId) ||
    typeof profile.clientVersionPrefix !== 'string' ||
    profile.clientVersionPrefix.length === 0
  ) {
    throw new TypeError('A complete expected network profile is required')
  }
  if (profile.id !== BTCS_L2_LOCAL.id) {
    throw new UnsupportedNetworkProfileError(profile.id)
  }
  return Object.freeze({ ...profile })
}

function validateBlockReference(reference) {
  if (typeof reference === 'bigint') {
    if (reference < 0n) throw new RangeError('Block number cannot be negative')
    return `0x${reference.toString(16)}`
  }
  if (reference === 'latest' || reference === 'earliest') return reference
  throw new TypeError('Block reference must be a non-negative bigint, latest, or earliest')
}

function validateAddress(address) {
  if (typeof address !== 'string' || !ADDRESS_PATTERN.test(address)) {
    throw new TypeError('Address must be exactly 20 bytes of hexadecimal data')
  }
}

function validateHash(hash, label) {
  if (typeof hash !== 'string' || !HASH_PATTERN.test(hash)) {
    throw new TypeError(`${label} must be exactly 32 bytes of hexadecimal data`)
  }
}

function validateBlock(value) {
  if (value === null) return null
  const block = requireObject(value, 'Block result')
  if (
    typeof block.hash !== 'string' ||
    !HASH_PATTERN.test(block.hash) ||
    typeof block.parentHash !== 'string' ||
    !HASH_PATTERN.test(block.parentHash) ||
    typeof block.number !== 'string' ||
    !Array.isArray(block.transactions)
  ) {
    throw new RpcProtocolError('Block result is missing required fields')
  }
  parseQuantity(block.number, 'Block number')
  return block
}

function validateTransaction(value, expectedHash) {
  if (value === null) return null
  const transaction = requireObject(value, 'Transaction result')
  if (
    typeof transaction.hash !== 'string' ||
    !HASH_PATTERN.test(transaction.hash) ||
    transaction.hash.toLowerCase() !== expectedHash.toLowerCase() ||
    !(transaction.blockHash === null || (typeof transaction.blockHash === 'string' && HASH_PATTERN.test(transaction.blockHash))) ||
    !(transaction.blockNumber === null || typeof transaction.blockNumber === 'string')
  ) {
    throw new RpcProtocolError('Transaction result is malformed or does not match the requested hash')
  }
  if (transaction.blockNumber !== null) parseQuantity(transaction.blockNumber, 'Transaction block number')
  return transaction
}

function validateReceipt(value, expectedHash) {
  if (value === null) return null
  const receipt = requireObject(value, 'Receipt result')
  if (
    typeof receipt.transactionHash !== 'string' ||
    !HASH_PATTERN.test(receipt.transactionHash) ||
    receipt.transactionHash.toLowerCase() !== expectedHash.toLowerCase() ||
    typeof receipt.blockHash !== 'string' ||
    !HASH_PATTERN.test(receipt.blockHash) ||
    typeof receipt.blockNumber !== 'string' ||
    !(receipt.status === '0x0' || receipt.status === '0x1')
  ) {
    throw new RpcProtocolError('Receipt result is malformed or does not match the requested hash')
  }
  parseQuantity(receipt.blockNumber, 'Receipt block number')
  return receipt
}

export function createBtcsL2Client({
  endpoint,
  profile,
  timeoutMs = 5_000,
  fetchImpl = globalThis.fetch,
} = {}) {
  const expectedProfile = validateProfile(profile)
  if (
    expectedProfile.id === BTCS_L2_LOCAL.id &&
    (expectedProfile.profileType !== BTCS_L2_LOCAL.profileType ||
      expectedProfile.chainId !== BTCS_L2_LOCAL.chainId ||
      expectedProfile.clientVersionPrefix !== BTCS_L2_LOCAL.clientVersionPrefix)
  ) {
    throw new TypeError('The BTCS L2 local profile identity is fixed and cannot be overridden')
  }
  const url = validateEndpoint(endpoint, expectedProfile)
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new RangeError('timeoutMs must be an integer from 1 through 120000')
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('A Fetch-compatible implementation is required')

  let nextId = 1
  let verificationPromise

  async function request(method, params = []) {
    const id = nextId
    nextId += 1
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      let response
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
          signal: controller.signal,
        })
      } catch (cause) {
        const reason = controller.signal.aborted
          ? `BTCS L2 RPC request timed out after ${timeoutMs} ms`
          : 'BTCS L2 RPC endpoint is unavailable'
        throw new RpcTransportError(reason, { cause })
      }

      if (!response.ok) {
        throw new RpcTransportError(`BTCS L2 RPC returned HTTP ${response.status}`, { status: response.status })
      }

      let envelope
      try {
        envelope = await response.json()
      } catch (cause) {
        if (controller.signal.aborted) {
          throw new RpcTransportError(`BTCS L2 RPC request timed out after ${timeoutMs} ms`, { cause })
        }
        throw new RpcProtocolError('BTCS L2 RPC returned invalid JSON', { cause })
      }
      const body = requireObject(envelope, 'JSON-RPC response')
      if (body.jsonrpc !== '2.0' || body.id !== id) {
        throw new RpcProtocolError('JSON-RPC response version or id does not match the request')
      }
      const hasResult = Object.hasOwn(body, 'result')
      const hasError = Object.hasOwn(body, 'error')
      if (hasResult === hasError) throw new RpcProtocolError('JSON-RPC response must contain exactly one of result or error')
      if (hasError) {
        const error = requireObject(body.error, 'JSON-RPC error')
        if (!Number.isInteger(error.code) || typeof error.message !== 'string') {
          throw new RpcProtocolError('JSON-RPC error object is malformed')
        }
        throw new JsonRpcError(error.code, error.message, error.data)
      }
      return body.result
    } finally {
      clearTimeout(timer)
    }
  }

  async function verifyExpectedNetwork() {
    const [clientVersionResult, chainIdResult] = await Promise.all([
      request('web3_clientVersion'),
      request('eth_chainId'),
    ])
    if (typeof clientVersionResult !== 'string') {
      throw new RpcProtocolError('Client version result is not a string')
    }
    const chainId = parseQuantity(chainIdResult, 'Chain id')
    return validateNetworkIdentity({
      schemaVersion: NETWORK_IDENTITY_SCHEMA_VERSION,
      profileType: expectedProfile.profileType,
      profileId: expectedProfile.id,
      chainId: chainId.toString(10),
      clientVersion: clientVersionResult,
    })
  }

  async function ensureNetworkVerified() {
    if (verificationPromise === undefined) {
      verificationPromise = verifyExpectedNetwork().catch((error) => {
        verificationPromise = undefined
        throw error
      })
    }
    return verificationPromise
  }

  return Object.freeze({
    endpoint: url,
    profile: expectedProfile,

    async getClientVersion() {
      const value = await request('web3_clientVersion')
      if (typeof value !== 'string') throw new RpcProtocolError('Client version result is not a string')
      return value
    },

    async getChainId() {
      return parseQuantity(await request('eth_chainId'), 'Chain id')
    },

    async getNetworkVersion() {
      await ensureNetworkVerified()
      const value = await request('net_version')
      if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
        throw new RpcProtocolError('Network version result is not a decimal chain id')
      }
      return value
    },

    async isListening() {
      await ensureNetworkVerified()
      const value = await request('net_listening')
      if (typeof value !== 'boolean') throw new RpcProtocolError('Listening result is not a boolean')
      return value
    },

    async verifyNetwork() {
      return ensureNetworkVerified()
    },

    async getBlockNumber() {
      await ensureNetworkVerified()
      return parseQuantity(await request('eth_blockNumber'), 'Block number')
    },

    async getBlock(reference = 'latest', fullTransactions = false) {
      if (typeof fullTransactions !== 'boolean') throw new TypeError('fullTransactions must be a boolean')
      const blockReference = validateBlockReference(reference)
      await ensureNetworkVerified()
      return validateBlock(await request('eth_getBlockByNumber', [
        blockReference,
        fullTransactions,
      ]))
    },

    async getTransaction(hash) {
      validateHash(hash, 'Transaction hash')
      await ensureNetworkVerified()
      return validateTransaction(await request('eth_getTransactionByHash', [hash]), hash)
    },

    async getTransactionReceipt(hash) {
      validateHash(hash, 'Transaction hash')
      await ensureNetworkVerified()
      return validateReceipt(await request('eth_getTransactionReceipt', [hash]), hash)
    },

    async getTransactionStatus(hash) {
      validateHash(hash, 'Transaction hash')
      await ensureNetworkVerified()
      const receipt = validateReceipt(await request('eth_getTransactionReceipt', [hash]), hash)
      if (receipt !== null) {
        return Object.freeze({
          status: receipt.status === '0x1' ? 'confirmed' : 'reverted',
          blockHash: receipt.blockHash,
          blockNumber: parseQuantity(receipt.blockNumber, 'Receipt block number'),
        })
      }
      const transaction = validateTransaction(await request('eth_getTransactionByHash', [hash]), hash)
      if (transaction === null) return Object.freeze({ status: 'missing' })
      if (transaction.blockHash === null && transaction.blockNumber === null) {
        return Object.freeze({ status: 'pending' })
      }
      throw new RpcProtocolError('Transaction is block-associated but has no canonical receipt')
    },

    async getBalance(address, reference = 'latest') {
      validateAddress(address)
      const blockReference = validateBlockReference(reference)
      await ensureNetworkVerified()
      return parseQuantity(await request('eth_getBalance', [
        address,
        blockReference,
      ]), 'Account balance')
    },

    async getTransactionCount(address, reference = 'latest') {
      validateAddress(address)
      const blockReference = validateBlockReference(reference)
      await ensureNetworkVerified()
      return parseQuantity(await request('eth_getTransactionCount', [
        address,
        blockReference,
      ]), 'Account nonce')
    },

    async getCode(address, reference = 'latest') {
      validateAddress(address)
      const blockReference = validateBlockReference(reference)
      await ensureNetworkVerified()
      const value = await request('eth_getCode', [
        address,
        blockReference,
      ])
      if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) {
        throw new RpcProtocolError('Account code result is not valid hexadecimal data')
      }
      return value.toLowerCase()
    },
  })
}
