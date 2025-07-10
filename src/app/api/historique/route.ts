import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const betsCollection = db.collection('bets')
    const racesCollection = db.collection('courses')

    // Récupérer tous les paris de l'utilisateur triés par date décroissante
    const userBets = await betsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    // Enrichir les paris avec les informations des courses
    const enrichedBets = await Promise.all(
      userBets.map(async (bet) => {
        const race = await racesCollection.findOne({ _id: bet.raceId })
        
        // Calculer la cote (nombre de chevaux inscrits)
        const cote = race?.horses?.length || 1
        
        // Calculer les gains potentiels ou réels
        let gains = 0
        if (bet.finished && bet.won) {
          gains = bet.amount * cote
        }

        return {
          ...bet,
          raceName: race?.name || `Course ${bet.raceId}`,
          cote,
          gains,
          status: bet.finished ? (bet.won ? 'gagne' : 'perdu') : 'en_cours'
        }
      })
    )

    // Calculer les statistiques
    const stats = {
      total: enrichedBets.length,
      enCours: enrichedBets.filter(bet => !bet.finished).length,
      gagnes: enrichedBets.filter(bet => bet.finished && bet.won).length,
      perdus: enrichedBets.filter(bet => bet.finished && !bet.won).length,
      totalMise: enrichedBets.reduce((sum, bet) => sum + bet.amount, 0),
      totalGains: enrichedBets.reduce((sum, bet) => sum + (bet.gains || 0), 0)
    }

    return NextResponse.json({
      bets: enrichedBets,
      stats
    })
  } catch (error) {
    console.error('GET /api/historique error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}