import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ userId })
    
    if (!user) {
      // Create user with default points if doesn't exist
      await usersCollection.insertOne({
        userId,
        points: 100,
        createdAt: new Date(),
      })
      return NextResponse.json({ points: 100 })
    }

    return NextResponse.json({ points: user.points })
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId, email } = await request.json()

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    const existingUser = await usersCollection.findOne({ userId })

    if (!existingUser) {
      await usersCollection.insertOne({
        userId,
        email,
        points: 100,
        createdAt: new Date(),
      })
      return NextResponse.json({ message: 'User created with 100 points', points: 100 }, { status: 201 })
    } else {
      return NextResponse.json({ message: 'User exists', points: existingUser.points }, { status: 200 })
    }
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
