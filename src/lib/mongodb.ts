import { MongoClient, ServerApiVersion } from 'mongodb'

let client: MongoClient
let clientPromise: Promise<MongoClient>

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local')
  }

  if (clientPromise) {
    return clientPromise
  }

  const options = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }

  if (process.env.NODE_ENV === 'development') {
    // Evite plusieurs connexions en dev (hot reload)
    if (!(global as unknown as { _mongoClientPromise?: Promise<MongoClient> })._mongoClientPromise) {
      client = new MongoClient(uri, options)
      ;(global as unknown as { _mongoClientPromise: Promise<MongoClient> })._mongoClientPromise = client.connect()
    }
    clientPromise = (global as unknown as { _mongoClientPromise: Promise<MongoClient> })._mongoClientPromise
  } else {
    // En prod, nouvelle connexion normale
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

export default getClientPromise
export { getClientPromise as connectToDatabase }
