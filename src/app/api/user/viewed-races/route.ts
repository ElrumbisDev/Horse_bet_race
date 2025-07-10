import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { raceId } = body

    if (!raceId) {
      return NextResponse.json({ error: 'raceId manquant' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    // Ajouter cette course à la liste des courses vues par l'utilisateur
    await usersCollection.updateOne(
      { userId },
      { 
        $addToSet: { viewedFinishedRaces: raceId } // $addToSet évite les doublons
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/user/viewed-races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ userId })
    const viewedRaces = user?.viewedFinishedRaces || []

    return NextResponse.json({ viewedRaces })
  } catch (error) {
    console.error('GET /api/user/viewed-races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}