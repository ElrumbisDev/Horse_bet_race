import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import getClientPromise from '@/lib/mongodb'

async function connect() {
  const client = await getClientPromise()
  return client.db('cheval-bet')
}

export async function POST(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { raceId, winnerHorseName } = body

    if (!raceId || !winnerHorseName) {
      return NextResponse.json({ message: 'Champs manquants : raceId ou winnerHorseName' }, { status: 400 })
    }

    // Récupérer la course
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ message: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ message: 'Cette course est déjà terminée' }, { status: 400 })
    }

    // Vérifier que le cheval gagnant existe dans la course
    const winnerExists = race.horses?.some((horse: { name: string; userName?: string }) => horse.name === winnerHorseName)
    if (!winnerExists) {
      return NextResponse.json({ message: 'Ce cheval n\'est pas inscrit dans cette course' }, { status: 400 })
    }

    // Récupérer tous les paris sur cette course
    const bets = await db.collection('bets').find({ raceId }).toArray()
    
    // Filtrer les paris gagnants
    const winningBets = bets.filter(bet => bet.horseName === winnerHorseName)

    // Calculer et distribuer les gains selon les cotes de chaque pari
    const usersCollection = db.collection('users')
    
    for (const bet of winningBets) {
      const winnings = bet.amount * (bet.cote || 2) // Utiliser la cote sauvegardée ou 2 par défaut
      await usersCollection.updateOne(
        { userId: bet.userId },
        { $inc: { points: winnings } }
      )
    }

    // Marquer la course comme terminée
    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $set: { 
          finished: true, 
          winner: winnerHorseName,
          finishedAt: new Date()
        }
      }
    )

    // Marquer tous les paris de cette course comme terminés
    await db.collection('bets').updateMany(
      { raceId },
      { 
        $set: { 
          finished: true,
          winner: winnerHorseName
        }
      }
    )

    // Marquer les paris gagnants avec les gains
    for (const bet of winningBets) {
      const winnings = bet.amount * (bet.cote || 2) // Utiliser la cote sauvegardée
      await db.collection('bets').updateOne(
        { _id: bet._id },
        { $set: { won: true, winnings: winnings } }
      )
    }

    // Marquer les paris perdants
    await db.collection('bets').updateMany(
      { raceId, horseName: { $ne: winnerHorseName } },
      { $set: { won: false, winnings: 0 } }
    )

    return NextResponse.json({ 
      message: `Course terminée ! Cheval gagnant: ${winnerHorseName}`,
      winningBets: winningBets.length,
      totalWinnings: winningBets.reduce((sum, bet) => sum + (bet.amount * (bet.cote || 2)), 0)
    })
  } catch (error) {
    console.error('POST /api/race/finish error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}