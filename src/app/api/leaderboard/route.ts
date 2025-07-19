import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')
    const guestUsersCollection = db.collection('guest-users')

    // Récupérer tous les utilisateurs triés par points décroissants
    const regularUsers = await usersCollection
      .find({}, { projection: { userId: 1, email: 1, name: 1, points: 1 } })
      .sort({ points: -1 })
      .toArray()

    // Récupérer tous les utilisateurs invités triés par points décroissants  
    const guestUsers = await guestUsersCollection
      .find({}, { projection: { _id: 1, name: 1, points: 1 } })
      .sort({ points: -1 })
      .toArray()

    // Formater les utilisateurs réguliers
    const formattedRegularUsers = regularUsers.map(user => {
      let displayName = user.name || user.email?.split('@')[0] || 'Utilisateur'
      
      return {
        _id: user.userId,
        name: displayName,
        points: user.points || 0,
        userType: 'regular'
      }
    })

    // Formater les utilisateurs invités
    const formattedGuestUsers = guestUsers.map(user => ({
      _id: user._id.toString(),
      name: user.name || 'Invité',
      points: user.points || 0,
      userType: 'guest'
    }))

    // Combiner et trier tous les utilisateurs par points
    const allUsers = [...formattedRegularUsers, ...formattedGuestUsers]
      .sort((a, b) => b.points - a.points)

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('GET /api/leaderboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}