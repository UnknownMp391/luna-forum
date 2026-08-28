import { MongoClient, Db, ObjectId } from 'mongodb';


let client: MongoClient
let db: Db

export async function connect(uri: string, dbName: string): Promise<Db> {
    if (!uri || !dbName) {
        throw new Error('MongoDB URI and database name must be provided')
    }
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    return db
}

export function getDB(): Db {
    if (!db) throw new Error('Database not connected')
    return db
}

export async function nextUid(): Promise<number> {
    const database = getDB()
    const result = await database.collection('counters').findOneAndUpdate(
        { _id: 'uid' as unknown as ObjectId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    )
    return result?.seq ?? 0
}

export async function initUidCounter(): Promise<void> {
    const database = getDB()
    const maxUser = await database.collection('users').find().sort({ uid: -1 }).limit(1).toArray()
    const maxUid = maxUser.length > 0 ? maxUser[0].uid : 0
    await database.collection('counters').updateOne(
        { _id: 'uid' as unknown as ObjectId },
        { $setOnInsert: { seq: maxUid } },
        { upsert: true }
    )
}

export async function disconnect(): Promise<void> {
    if (client) await client.close()
}