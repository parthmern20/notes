import dns from "node:dns"
import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var __mnemoMongoose: MongooseCache | undefined
}

const cache: MongooseCache = (globalThis.__mnemoMongoose ??= { conn: null, promise: null })

export class DatabaseConfigError extends Error {}

function isSrvLookupFailure(err: unknown): boolean {
  const e = err as { code?: string; syscall?: string; message?: string } | null
  return Boolean(e && (e.syscall === "querySrv" || /querySrv|ENOTFOUND _mongodb/.test(e.message ?? "")))
}

async function open(uri: string): Promise<typeof mongoose> {
  const options: mongoose.ConnectOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 15_000,
    dbName: process.env.MONGODB_DB || undefined,
  }
  try {
    return await mongoose.connect(uri, options)
  } catch (err) {
    // Some Windows/Node setups refuse SRV lookups through the default resolver
    // (`querySrv ECONNREFUSED`). Retry once through public DNS before giving up.
    if (uri.startsWith("mongodb+srv://") && isSrvLookupFailure(err)) {
      dns.setServers(["1.1.1.1", "8.8.8.8"])
      return await mongoose.connect(uri, options)
    }
    throw err
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn
  const uri = process.env.MONGODB_URI
  if (!uri) throw new DatabaseConfigError("MONGODB_URI is not set. Add it to your .env file.")
  cache.promise ??= open(uri).catch((err) => {
    cache.promise = null
    throw err
  })
  cache.conn = await cache.promise
  return cache.conn
}
