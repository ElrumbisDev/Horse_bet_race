import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/mongodb'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClientPromise()
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
  const { userId, email, name, firstName, username } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {
    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    const existingUser = await usersCollection.findOne({ userId })

    // Créer le displayName selon la même logique que le dashboard
    const displayName = firstName || username || email?.split('@')[0] || 'Utilisateur'

    if (!existingUser) {
      await usersCollection.insertOne({
        userId,
        email,
        name: displayName,
        firstName,
        username,
        points: 100,
        createdAt: new Date(),
      })
      return NextResponse.json({ message: 'User created with 100 points', points: 100 }, { status: 201 })
    } else {
      // Mettre à jour les informations utilisateur
      await usersCollection.updateOne(
        { userId },
        { 
          $set: { 
            email: email || existingUser.email,
            name: displayName,
            firstName,
            username,
            updatedAt: new Date()
          } 
        }
      )
      return NextResponse.json({ message: 'User updated', points: existingUser.points }, { status: 200 })
    }
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
