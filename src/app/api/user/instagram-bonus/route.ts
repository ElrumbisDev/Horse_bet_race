import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'

export async function POST() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const usersCollection = db.collection('users')

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ userId: user.id })
    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si l'utilisateur a déjà réclamé le bonus Instagram
    if (existingUser.instagramBonusClaimed) {
      return NextResponse.json({ 
        error: 'Bonus Instagram déjà réclamé',
        alreadyClaimed: true 
      }, { status: 400 })
    }

    // Ajouter 30 points bonus et marquer comme réclamé
    const bonusPoints = 30
    const result = await usersCollection.updateOne(
      { userId: user.id },
      { 
        $inc: { points: bonusPoints },
        $set: { instagramBonusClaimed: true }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Erreur lors de l\'ajout des points' }, { status: 500 })
    }

    // Récupérer les points mis à jour
    const updatedUser = await usersCollection.findOne({ userId: user.id })
    
    return NextResponse.json({
      success: true,
      bonusPoints,
      totalPoints: updatedUser?.points || 0,
      message: `+${bonusPoints} points !`
    })

  } catch (error) {
    console.error('Erreur API Instagram bonus:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}