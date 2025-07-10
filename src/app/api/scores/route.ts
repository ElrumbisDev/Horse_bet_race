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

    // Récupérer tous les utilisateurs triés par points décroissants
    const allUsers = await usersCollection
      .find({}, { projection: { userId: 1, email: 1, name: 1, points: 1 } })
      .sort({ points: -1 })
      .toArray()

    // Formater les données avec les noms synchronisés
    const allPlayers = allUsers.map((user, index) => {
      let displayName = `Joueur ${index + 1}`
      
      // Utiliser les données synchronisées depuis la base
      if (user.name) {
        displayName = user.name
      } else if (user.email) {
        displayName = user.email.split('@')[0]
      }

      return {
        id: user.userId,
        name: displayName,
        points: user.points || 0,
        position: index + 1
      }
    })

    // Top 3 pour le podium
    const topPlayers = allPlayers.slice(0, 3)

    return NextResponse.json({
      topPlayers,
      allPlayers,
      totalPlayers: allPlayers.length,
      totalPoints: allPlayers.reduce((sum, player) => sum + player.points, 0)
    })
  } catch (error) {
    console.error('GET /api/scores error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}