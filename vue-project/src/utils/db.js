import { openDB } from 'idb'

const DB_NAME = 'mf-sip-tracker'
const DB_VERSION = 1
const STORE_FUNDS = 'funds'

let dbPromise

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_FUNDS)) {
          db.createObjectStore(STORE_FUNDS, { keyPath: 'schemeCode' })
        }
      },
    })
  }
  return dbPromise
}

export async function getCachedFund(schemeCode) {
  const db = await getDb()
  return db.get(STORE_FUNDS, schemeCode)
}

export async function setCachedFund(payload) {
  const db = await getDb()
  await db.put(STORE_FUNDS, payload)
}

export async function deleteCachedFund(schemeCode) {
  const db = await getDb()
  await db.delete(STORE_FUNDS, schemeCode)
}
