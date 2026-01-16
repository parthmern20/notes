import mongoose from "mongoose"

// const MONGODB_URI = process.env.MONGODB_URI!

const MONGODB_URI = 'mongodb+srv://pocox5proplus:LLB6n5ppxMkJYoMW@notes.pdp7pgy.mongodb.net/?appName=notes'

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var myMongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.myMongoose || { conn: null, promise: null }

if (!global.myMongoose) {
  global.myMongoose = cached
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`Successfully connected to MongoDB: ${MONGODB_URI}`)
      return mongoose
    }).catch((err) => {
      console.error(`Error connecting to MongoDB: ${err.message}`)
      throw err
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
