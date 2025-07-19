import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Leaderboard API called')
    
    // Retourner des données de test si la base de données n'est pas accessible
    try {
      const client = await getClientPromise()
      const db = client.db('cheval-bet')
      const usersCollection = db.collection('users')

      // Récupérer tous les utilisateurs triés par points décroissants
      const regularUsers = await usersCollection
        .find({}, { projection: { userId: 1, email: 1, name: 1, points: 1, userType: 1 } })
        .sort({ points: -1 })
        .toArray()

      console.log('Found users:', regularUsers.length)

      // Formater tous les utilisateurs (réguliers et invités)
      const formattedUsers = regularUsers.map(user => {
        let displayName = user.name || user.email?.split('@')[0] || 'Utilisateur'
        
        return {
          _id: user.userId || user._id.toString(),
          name: displayName,
          points: user.points || 0,
          userType: user.userType || 'regular'
        }
      })

      console.log('Formatted users:', formattedUsers)
      return NextResponse.json(formattedUsers)
    } catch (dbError) {
      console.log('Database not available, returning test data')
      // Données de test
      const testUsers = [
        { _id: '1', name: 'Joueur Test 1', points: 250, userType: 'regular' },
        { _id: '2', name: 'Joueur Test 2', points: 180, userType: 'regular' },
        { _id: '3', name: 'Invité Test', points: 120, userType: 'guest' },
        { _id: '4', name: 'Joueur Test 3', points: 95, userType: 'regular' },
        { _id: '5', name: 'Joueur Test 4', points: 75, userType: 'regular' }
      ]
      return NextResponse.json(testUsers)
    }
  } catch (error) {
    console.error('GET /api/leaderboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}