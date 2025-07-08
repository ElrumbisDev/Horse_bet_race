import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const includeFinished = url.searchParams.get('finished') === 'true'

    const client = await clientPromise
    const db = client.db('cheval-bet')
    const betsCollection = db.collection('bets')

    const query: { userId: string; finished?: { $ne: boolean } } = { userId }
    
    if (!includeFinished) {
      // Par défaut, ne retourner que les paris en cours (non terminés)
      query.finished = { $ne: true }
    }

    const bets = await betsCollection.find(query).toArray()
    
    return NextResponse.json(bets)
  } catch (error) {
    console.error('GET /api/bet error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { horseName, amount, raceId } = body

    if (!horseName || typeof amount !== 'number' || !raceId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')
    const betsCollection = db.collection('bets')

    // Vérifier les points de l'utilisateur
    const user = await usersCollection.findOne({ userId })
    if (!user || user.points < amount) {
      return NextResponse.json({ error: 'Pas assez de points' }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà parié sur cette course
    const existingBet = await betsCollection.findOne({ userId, raceId })
    if (existingBet) {
      return NextResponse.json({ error: 'Vous avez déjà parié sur cette course' }, { status: 400 })
    }

    // Retirer les points et enregistrer le pari
    await usersCollection.updateOne(
      { userId },
      { $inc: { points: -amount } }
    )

    await betsCollection.insertOne({
      userId,
      raceId,
      horseName,
      amount,
      createdAt: new Date()
    })

    const updatedUser = await usersCollection.findOne({ userId })
    
    return NextResponse.json({ 
      success: true, 
      points: updatedUser?.points || 0,
      message: `Pari de ${amount} points sur ${horseName} enregistré !`
    })
  } catch (error) {
    console.error('POST /api/bet error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
