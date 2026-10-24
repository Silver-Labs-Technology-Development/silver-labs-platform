import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import {
  BTCS_L2_LOCAL,
  createBtcsL2Client,
  JsonRpcError,
  NetworkMismatchError,
  NetworkIdentityValidationError,
  RpcProtocolError,
  RpcTransportError,
  UnsupportedNetworkIdentitySchemaError,
  UnsupportedNetworkProfileError,
  validateNetworkIdentity,
} from '../src/index.js'

const HASH = `0x${'12'.repeat(32)}`
const BLOCK_HASH = `0x${'34'.repeat(32)}`
const ADDRESS = `0x${'00'.repeat(20)}`

async function withRpc(handler, run) {
  const server = createServer(async (request, response) => {
    let raw = ''
    for await (const chunk of request) raw += chunk
    const call = JSON.parse(raw)
    await handler(call, response)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

function send(response, id, result) {
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ jsonrpc: '2.0', id, result }))
}

test('verifies local identity and reads supported canonical/account data', async () => {
  const observed = []
  await withRpc(async ({ method, params, id }, response) => {
    observed.push(method)
    const values = {
      web3_clientVersion: 'BTCSL2/v0.14-local/test',
      eth_chainId: '0x7a69',
      net_version: '31337',
      net_listening: false,
      eth_blockNumber: '0x2',
      eth_getBlockByNumber: {
        hash: BLOCK_HASH,
        parentHash: HASH,
        number: params[0] === 'earliest' ? '0x0' : '0x2',
        transactions: [],
      },
      eth_getBalance: '0x10',
      eth_getTransactionCount: '0x3',
      eth_getCode: '0x6000',
      eth_getTransactionByHash: null,
      eth_getTransactionReceipt: null,
    }
    send(response, id, values[method])
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    assert.deepEqual(await client.verifyNetwork(), {
      schemaVersion: 1,
      profileType: 'local-development',
      profileId: BTCS_L2_LOCAL.id,
      chainId: '31337',
      clientVersion: 'BTCSL2/v0.14-local/test',
    })
    assert.equal(await client.getBlockNumber(), 2n)
    assert.equal(await client.getNetworkVersion(), '31337')
    assert.equal(await client.isListening(), false)
    assert.equal((await client.getBlock('earliest'))?.number, '0x0')
    assert.equal(await client.getBalance(ADDRESS), 16n)
    assert.equal(await client.getTransactionCount(ADDRESS), 3n)
    assert.equal(await client.getCode(ADDRESS), '0x6000')
    assert.equal(await client.getTransaction(HASH), null)
    assert.equal(await client.getTransactionReceipt(HASH), null)
    assert.deepEqual(await client.getTransactionStatus(HASH), { status: 'missing' })
  })
  assert.deepEqual(observed.sort(), [
    'web3_clientVersion',
    'eth_chainId',
    'eth_blockNumber',
    'net_version',
    'net_listening',
    'eth_getBlockByNumber',
    'eth_getBalance',
    'eth_getTransactionCount',
    'eth_getCode',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_getTransactionReceipt',
    'eth_getTransactionByHash',
  ].sort())
})

test('rejects a wrong chain id or a missing BTCS L2 banner', async () => {
  await withRpc(async ({ method, id }, response) => {
    send(response, id, method === 'web3_clientVersion' ? 'EthereumJS/v1' : '0x7a69')
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.verifyNetwork(), NetworkMismatchError)
  })

  await withRpc(async ({ method, id }, response) => {
    send(response, id, method === 'web3_clientVersion' ? 'BTCSL2/local' : '0x1')
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.verifyNetwork(), NetworkMismatchError)
  })

  const methods = []
  await withRpc(async ({ method, id }, response) => {
    methods.push(method)
    send(response, id, method === 'web3_clientVersion' ? 'Geth/v1.15.0' : '0x7a69')
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.getBlockNumber(), NetworkMismatchError)
  })
  assert.deepEqual(new Set(methods), new Set(['web3_clientVersion', 'eth_chainId']))
})

test('surfaces JSON-RPC errors, malformed responses, HTTP failures, and timeouts', async () => {
  await withRpc(async ({ id }, response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }))
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.getBlockNumber(), (error) =>
      error instanceof JsonRpcError && error.code === -32601 && error.message.includes('Method not found'))
  })

  await withRpc(async ({ id }, response) => send(response, id + 1, '0x0'), async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.getBlockNumber(), RpcProtocolError)
  })

  await withRpc(async (_call, response) => {
    response.writeHead(503)
    response.end()
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    await assert.rejects(client.getBlockNumber(), (error) =>
      error instanceof RpcTransportError && error.status === 503)
  })

  await withRpc(async () => new Promise(() => {}), async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL, timeoutMs: 20 })
    await assert.rejects(client.getBlockNumber(), (error) =>
      error instanceof RpcTransportError && error.message.includes('timed out'))
  })

  await withRpc(async ({ id }, response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.write(`{"jsonrpc":"2.0","id":${id},"result":`)
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL, timeoutMs: 20 })
    await assert.rejects(client.getBlockNumber(), (error) =>
      error instanceof RpcTransportError && error.message.includes('timed out'))
  })
})

test('distinguishes pending, confirmed, and reverted transaction observations', async () => {
  const receipt = (status) => ({
    transactionHash: HASH,
    blockHash: BLOCK_HASH,
    blockNumber: '0x4',
    status,
  })
  await withRpc(async ({ method, id }, response) => {
    if (method === 'web3_clientVersion') return send(response, id, 'BTCSL2/v0.14-local/test')
    if (method === 'eth_chainId') return send(response, id, '0x7a69')
    if (method === 'eth_getTransactionReceipt') return send(response, id, null)
    send(response, id, {
      hash: HASH,
      blockHash: null,
      blockNumber: null,
    })
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    assert.deepEqual(await client.getTransactionStatus(HASH), { status: 'pending' })
  })

  for (const [rpcStatus, expected] of [['0x1', 'confirmed'], ['0x0', 'reverted']]) {
    await withRpc(async ({ method, id }, response) => {
      if (method === 'web3_clientVersion') return send(response, id, 'BTCSL2/v0.14-local/test')
      if (method === 'eth_chainId') return send(response, id, '0x7a69')
      send(response, id, receipt(rpcStatus))
    }, async (endpoint) => {
      const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
      assert.deepEqual(await client.getTransactionStatus(HASH), {
        status: expected,
        blockHash: BLOCK_HASH,
        blockNumber: 4n,
      })
    })
  }
})

test('validates explicit schema v1 identity and rejects unsupported or malformed identities', () => {
  const validIdentity = {
    schemaVersion: 1,
    profileType: 'local-development',
    profileId: 'btcs-l2-local',
    chainId: '31337',
    clientVersion: 'BTCSL2/v0.14-local/test',
  }
  assert.deepEqual(validateNetworkIdentity(validIdentity), validIdentity)
  assert.throws(
    () => validateNetworkIdentity({ ...validIdentity, schemaVersion: 2 }),
    UnsupportedNetworkIdentitySchemaError,
  )
  const { schemaVersion: _schemaVersion, ...legacyIdentity } = validIdentity
  assert.throws(
    () => validateNetworkIdentity(legacyIdentity),
    NetworkIdentityValidationError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validIdentity, chainId: '0x7a69' }),
    NetworkIdentityValidationError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validIdentity, profileId: 'btcs-l2-mainnet' }),
    UnsupportedNetworkProfileError,
  )
  assert.throws(
    () => validateNetworkIdentity({ ...validIdentity, unrecognized: true }),
    NetworkIdentityValidationError,
  )
})

test('ordinary reads verify network identity before issuing the requested RPC method', async () => {
  const methods = []
  await withRpc(async ({ method, id }, response) => {
    methods.push(method)
    const result = {
      web3_clientVersion: 'BTCSL2/v0.14-local/test',
      eth_chainId: '0x7a69',
      eth_blockNumber: '0x2',
    }[method]
    send(response, id, result)
  }, async (endpoint) => {
    const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
    assert.equal(await client.getBlockNumber(), 2n)
  })
  assert.ok(methods.indexOf('eth_blockNumber') > methods.indexOf('web3_clientVersion'))
  assert.ok(methods.indexOf('eth_blockNumber') > methods.indexOf('eth_chainId'))
})

test('requires explicit safe endpoint and network configuration', () => {
  assert.throws(() => createBtcsL2Client({ profile: BTCS_L2_LOCAL }), TypeError)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'http://user:password@127.0.0.1:8545',
    profile: BTCS_L2_LOCAL,
  }), TypeError)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'http://127.0.0.1:8545?token=secret',
    profile: BTCS_L2_LOCAL,
  }), TypeError)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'https://rpc.example.invalid',
    profile: BTCS_L2_LOCAL,
  }), /only permits loopback/)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'http://127.0.0.1:8545',
    profile: { id: 'unknown', chainId: '31337' },
  }), TypeError)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'http://127.0.0.1:8545',
    profile: {
      id: 'btcs-l2-mainnet',
      profileType: 'public-network',
      chainId: '1',
      clientVersionPrefix: 'BTCSL2/',
    },
  }), UnsupportedNetworkProfileError)
  assert.throws(() => createBtcsL2Client({
    endpoint: 'http://127.0.0.1:8545',
    profile: { ...BTCS_L2_LOCAL, clientVersionPrefix: 'Geth/' },
  }), /fixed and cannot be overridden/)
})

test('exposes no transaction submission capability', () => {
  const client = createBtcsL2Client({
    endpoint: 'http://127.0.0.1:8545',
    profile: BTCS_L2_LOCAL,
  })
  assert.equal('sendTransaction' in client, false)
  assert.equal('sendRawTransaction' in client, false)
  assert.equal('submitTransaction' in client, false)
})
