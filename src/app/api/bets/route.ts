import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import getClientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raceId = searchParams.get('raceId')

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const betsCollection = db.collection('bets')
    const guestBetsCollection = db.collection('guest-bets')

    let query = {}
    if (raceId) {
      // Construire la requête avec l'ID de course
      query = { raceId: new ObjectId(raceId) }
    }

    // Récupérer les paris des utilisateurs réguliers
    const regularBets = await betsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Récupérer les paris des utilisateurs invités
    const guestBets = await guestBetsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Formater les paris réguliers
    const formattedRegularBets = regularBets.map(bet => ({
      _id: bet._id.toString(),
      horseName: bet.horseName,
      amount: bet.amount || 10, // Montant par défaut
      userId: bet.userId,
      raceId: bet.raceId.toString(),
      createdAt: bet.createdAt
    }))

    // Formater les paris invités
    const formattedGuestBets = guestBets.map(bet => ({
      _id: bet._id.toString(),
      horseName: bet.horseName,
      amount: bet.amount || 10, // Montant par défaut
      userId: bet.guestUserId,
      raceId: bet.raceId.toString(),
      createdAt: bet.createdAt
    }))

    // Combiner tous les paris
    const allBets = [...formattedRegularBets, ...formattedGuestBets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(allBets)
  } catch (error) {
    console.error('GET /api/bets error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}