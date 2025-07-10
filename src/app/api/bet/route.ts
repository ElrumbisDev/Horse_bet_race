import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'
import getClientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const includeFinished = url.searchParams.get('finished') === 'true'

    const client = await getClientPromise()
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

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')
    const betsCollection = db.collection('bets')
    const racesCollection = db.collection('courses')

    // Vérifier les points de l'utilisateur
    const user = await usersCollection.findOne({ userId })
    if (!user || user.points < amount) {
      return NextResponse.json({ error: 'Pas assez de points' }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà parié sur cette course
    const existingBet = await betsCollection.findOne({ userId, raceId })
    if (existingBet) {
      return NextResponse.json({ error: 'Vous ne pouvez parier que sur un seul cheval par course' }, { status: 400 })
    }

    // Récupérer la course pour calculer la cote actuelle
    const race = await racesCollection.findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    // Calculer la cote dynamique actuelle pour ce cheval
    const raceBets = await betsCollection.find({ raceId }).toArray()
    const horseBets = raceBets.filter(bet => bet.horseName === horseName)
    const totalBetsOnHorse = horseBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalRaceBets = raceBets.reduce((sum, bet) => sum + bet.amount, 0)
    
    const baseOdds = race.horses?.length || 1
    let currentCote = baseOdds
    
    if (totalRaceBets > 0 && totalBetsOnHorse > 0) {
      const betRatio = totalBetsOnHorse / totalRaceBets
      currentCote = Math.max(1.1, baseOdds * (1 - betRatio * 0.7))
      currentCote = Math.min(currentCote, baseOdds * 2)
    }
    
    currentCote = Math.round(currentCote * 10) / 10

    // Retirer les points et enregistrer le pari avec la cote actuelle
    await usersCollection.updateOne(
      { userId },
      { $inc: { points: -amount } }
    )

    await betsCollection.insertOne({
      userId,
      raceId,
      horseName,
      amount,
      cote: currentCote, // Sauvegarder la cote au moment du pari
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
