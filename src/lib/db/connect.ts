import mongoose from 'mongoose'

// Existing project MongoDB connection string
const EXISTING_MONGODB_URI =
  'mongodb://maheshkumarsaini8769_db_user:UM7pQFeHOIefQE5Y@ac-neqmat8-shard-00-00.4oygjqo.mongodb.net:27017,ac-neqmat8-shard-00-01.4oygjqo.mongodb.net:27017,ac-neqmat8-shard-00-02.4oygjqo.mongodb.net:27017/absolute_diagnostic?retryWrites=true&w=majority&appName=Cluster0&tls=true&authSource=admin'

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || EXISTING_MONGODB_URI
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable in .env')
  }
  return uri.trim().replace(/^["']|["']$/g, '')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1 && cached.conn) {
    return cached.conn
  }

  // If connection was closed or disconnected, reset cache
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 0,
      family: 4,
    }

    const uri = getMongoUri()
    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance
        return mongooseInstance
      })
      .catch((err) => {
        cached.promise = null
        cached.conn = null
        throw err
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    cached.conn = null
    throw e
  }

  return cached.conn
}

