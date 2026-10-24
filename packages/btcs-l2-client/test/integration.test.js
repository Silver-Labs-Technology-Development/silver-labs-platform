import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BTCS_L2_LOCAL, createBtcsL2Client } from '../src/index.js'

const endpoint = process.env.BTCS_L2_RPC_URL

test('reads identity, canonical block, and account from the actual local BTCS L2 RPC', {
  skip: !endpoint && 'Set BTCS_L2_RPC_URL to a running local BTCS L2 RPC',
}, async () => {
  const client = createBtcsL2Client({ endpoint, profile: BTCS_L2_LOCAL })
  const identity = await client.verifyNetwork()
  assert.equal(identity.schemaVersion, 1)
  assert.equal(identity.profileType, 'local-development')
  assert.equal(identity.chainId, BTCS_L2_LOCAL.chainId)
  assert.ok(identity.clientVersion.startsWith(BTCS_L2_LOCAL.clientVersionPrefix))
  assert.equal(await client.getNetworkVersion(), BTCS_L2_LOCAL.chainId)
  assert.equal(await client.isListening(), false)

  const height = await client.getBlockNumber()
  const genesis = await client.getBlock('earliest')
  assert.equal(genesis?.number, '0x0')
  assert.ok(genesis?.hash)
  assert.ok(height >= 0n)

  assert.ok(await client.getBalance(`0x${'00'.repeat(20)}`) >= 0n)
  assert.ok(await client.getTransactionCount(`0x${'00'.repeat(20)}`) >= 0n)
  assert.equal(await client.getCode(`0x${'00'.repeat(20)}`), '0x')

  const unknownHash = `0x${'ff'.repeat(32)}`
  assert.equal(await client.getTransaction(unknownHash), null)
  assert.equal(await client.getTransactionReceipt(unknownHash), null)
  assert.deepEqual(await client.getTransactionStatus(unknownHash), { status: 'missing' })
})
