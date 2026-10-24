import {
  BTCS_L2_LOCAL,
  NETWORK_IDENTITY_SCHEMA_VERSION,
  createBtcsL2Client,
  type BtcsL2Client,
  type NetworkIdentity,
  type TransactionStatus,
} from '../src/index.js'

const client: BtcsL2Client = createBtcsL2Client({
  endpoint: 'http://127.0.0.1:8545',
  profile: BTCS_L2_LOCAL,
})

const balance: Promise<bigint> = client.getBalance(
  '0x0000000000000000000000000000000000000000',
)
const transactionStatus: Promise<TransactionStatus> =
  client.getTransactionStatus(`0x${'00'.repeat(32)}`)
const identity: Promise<NetworkIdentity> = client.verifyNetwork()
const schemaVersion: 1 = NETWORK_IDENTITY_SCHEMA_VERSION

void balance
void transactionStatus
void identity
void schemaVersion
