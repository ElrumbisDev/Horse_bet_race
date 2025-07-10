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
    const usersCollection = db.collection('users')

    // Récupérer tous les paris triés par date décroissante
    const allBets = await betsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // Enrichir les paris avec les informations des courses et utilisateurs
    const enrichedBets = await Promise.all(
      allBets.map(async (bet) => {
        // Récupérer les infos de la course
        const race = await racesCollection.findOne({ _id: bet.raceId })
        
        // Récupérer les infos utilisateur depuis la DB
        const user = await usersCollection.findOne({ userId: bet.userId })
        
        // Récupérer le vrai nom depuis Clerk
        let displayName = bet.userId
        let userEmail = user?.email || ''
        
        // Utiliser les données synchronisées depuis la base
        if (user?.name) {
          displayName = user.name
        } else if (user?.email) {
          displayName = user.email.split('@')[0]
        } else {
          // Fallback temporaire
          if (bet.userId.startsWith('user_')) {
            const shortId = bet.userId.replace('user_', '').substring(0, 8)
            displayName = `Utilisateur_${shortId}`
          }
        }
        
        if (user?.email) {
          userEmail = user.email
        }
        
        // Calculer la cote (nombre de chevaux inscrits)
        const cote = race?.horses?.length || 1
        
        return {
          ...bet,
          raceName: race?.name || `Course ${bet.raceId}`,
          raceFormat: race?.format || 'fun',
          userName: displayName,
          userEmail,
          cote,
          raceDate: race?.date,
          raceFinished: race?.finished || false
        }
      })
    )

    return NextResponse.json(enrichedBets)
  } catch (error) {
    console.error('GET /api/admin/bets error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}