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
    const usersCollection = db.collection('users')
    const betsCollection = db.collection('bets')

    // Récupérer tous les utilisateurs triés par points décroissants
    const allUsers = await usersCollection
      .find({})
      .sort({ points: -1 })
      .toArray()

    // Enrichir avec les statistiques de paris et les informations Clerk
    const enrichedUsers = await Promise.all(
      allUsers.map(async (user) => {
        let displayName = user.userId // Fallback par défaut
        let userEmail = user.email || ''
        
        // Pour l'instant, utilisons les données disponibles
        // TODO: Synchroniser les noms depuis Clerk côté client
        if (user.email) {
          displayName = user.email.split('@')[0]
        } else if (user.name) {
          displayName = user.name
        } else {
          // Créer un nom temporaire en attendant la synchronisation
          if (user.userId.startsWith('user_')) {
            const shortId = user.userId.replace('user_', '').substring(0, 8)
            displayName = `Utilisateur_${shortId}`
          } else {
            displayName = user.userId
          }
        }

        // Compter les paris de chaque utilisateur
        const userBets = await betsCollection.countDocuments({ userId: user.userId })
        const wonBets = await betsCollection.countDocuments({ 
          userId: user.userId, 
          finished: true, 
          won: true 
        })
        const lostBets = await betsCollection.countDocuments({ 
          userId: user.userId, 
          finished: true, 
          won: false 
        })

        // Calculer le total misé
        const totalBetAmount = await betsCollection.aggregate([
          { $match: { userId: user.userId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).toArray()

        return {
          ...user,
          displayName,
          email: userEmail,
          totalBets: userBets,
          wonBets,
          lostBets,
          totalBetAmount: totalBetAmount[0]?.total || 0,
          winRate: userBets > 0 ? Math.round((wonBets / (wonBets + lostBets)) * 100) : 0
        }
      })
    )

    return NextResponse.json(enrichedUsers)
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}