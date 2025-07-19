import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    
    // Collections à réinitialiser
    const usersCollection = db.collection('users')
    const betsCollection = db.collection('bets')
    const coursesCollection = db.collection('courses')

    // Réinitialiser tous les points des utilisateurs à 100 et supprimer les bonus Instagram
    const resetUsersResult = await usersCollection.updateMany(
      {},
      { 
        $set: { 
          points: 100,
          instagramBonusClaimed: false
        },
        $unset: {
          viewedFinishedRaces: ""
        }
      }
    )

    // Supprimer tous les paris
    const deleteBetsResult = await betsCollection.deleteMany({})

    // Supprimer toutes les courses
    const deleteCoursesResult = await coursesCollection.deleteMany({})

    return NextResponse.json({
      success: true,
      message: 'Réinitialisation complète effectuée',
      details: {
        usersReset: resetUsersResult.modifiedCount,
        betsDeleted: deleteBetsResult.deletedCount,
        coursesDeleted: deleteCoursesResult.deletedCount
      }
    })

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}