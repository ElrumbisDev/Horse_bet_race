import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST - Créer un pari pour un utilisateur invité
export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { guestUserId, raceId, horseName, amount } = body

    if (!guestUserId || !raceId || !horseName || !amount) {
      return NextResponse.json({ 
        error: 'Tous les champs sont requis (guestUserId, raceId, horseName, amount)' 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être positif' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que l'utilisateur invité existe et est actif
    const guestUser = await db.collection('users').findOne({ 
      userId: guestUserId, 
      userType: 'guest',
      isActive: true
    })

    if (!guestUser) {
      return NextResponse.json({ 
        error: 'Utilisateur invité non trouvé ou inactif' 
      }, { status: 404 })
    }

    // Vérifier que l'utilisateur a assez de points
    if (guestUser.points < amount) {
      return NextResponse.json({ 
        error: `Points insuffisants. L'utilisateur a ${guestUser.points} points` 
      }, { status: 400 })
    }

    // Vérifier que la course existe et n'est pas terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ error: 'Course déjà terminée' }, { status: 400 })
    }

    // Vérifier que le cheval existe dans la course
    const horse = race.horses?.find((h: { name: string }) => h.name === horseName)
    if (!horse) {
      return NextResponse.json({ 
        error: 'Cheval non trouvé dans cette course' 
      }, { status: 404 })
    }

    // Vérifier que l'utilisateur n'a pas déjà parié sur cette course
    const existingBet = await db.collection('bets').findOne({
      userId: guestUserId,
      raceId: new ObjectId(raceId)
    })

    if (existingBet) {
      return NextResponse.json({ 
        error: 'Cet utilisateur a déjà parié sur cette course' 
      }, { status: 400 })
    }

    // Calculer la cote (basée sur le nombre de chevaux dans la course)
    const cote = race.horses?.length || 2

    // Créer le pari
    const newBet = {
      userId: guestUserId,
      raceId: new ObjectId(raceId),
      raceName: race.name,
      horseName: horseName,
      amount: amount,
      cote: cote,
      createdAt: new Date(),
      finished: false,
      createdBy: user.id // Admin qui a créé le pari
    }

    await db.collection('bets').insertOne(newBet)

    // Déduire les points de l'utilisateur invité
    await db.collection('users').updateOne(
      { userId: guestUserId },
      { 
        $inc: { points: -amount },
        $set: { updatedAt: new Date() }
      }
    )

    // Récupérer l'utilisateur mis à jour
    const updatedGuestUser = await db.collection('users').findOne({ userId: guestUserId })

    return NextResponse.json({
      message: 'Pari créé avec succès',
      bet: newBet,
      remainingPoints: updatedGuestUser?.points
    })

  } catch (error) {
    console.error('Erreur création pari invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer tous les paris des utilisateurs invités
export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const guestUserId = searchParams.get('guestUserId')

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    const query: Record<string, unknown> = {}
    
    if (guestUserId) {
      // Paris pour un utilisateur invité spécifique
      query.userId = guestUserId
    } else {
      // Tous les paris des utilisateurs invités
      const guestUsers = await db.collection('users').find({ 
        userType: 'guest' 
      }).toArray()
      const guestUserIds = guestUsers.map(gu => gu.userId)
      query.userId = { $in: guestUserIds }
    }

    const bets = await db.collection('bets').find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Enrichir avec les noms des utilisateurs
    const betsWithUserNames = await Promise.all(
      bets.map(async (bet) => {
        const guestUser = await db.collection('users').findOne({ 
          userId: bet.userId, 
          userType: 'guest' 
        })
        return {
          ...bet,
          userName: guestUser?.name || `Invité ${bet.userId.split('_')[1]}`
        }
      })
    )

    return NextResponse.json(betsWithUserNames)

  } catch (error) {
    console.error('Erreur récupération paris invités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Annuler un pari d'un utilisateur invité
export async function DELETE(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { betId } = body

    if (!betId) {
      return NextResponse.json({ error: 'ID du pari requis' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Récupérer le pari
    const bet = await db.collection('bets').findOne({ _id: betId })
    if (!bet) {
      return NextResponse.json({ error: 'Pari non trouvé' }, { status: 404 })
    }

    // Vérifier que c'est un pari d'utilisateur invité
    const guestUser = await db.collection('users').findOne({ 
      userId: bet.userId, 
      userType: 'guest' 
    })
    if (!guestUser) {
      return NextResponse.json({ 
        error: 'Ce pari n\'appartient pas à un utilisateur invité' 
      }, { status: 400 })
    }

    // Vérifier que la course n'est pas terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(bet.raceId) })
    if (race?.finished) {
      return NextResponse.json({ 
        error: 'Impossible d\'annuler un pari sur une course terminée' 
      }, { status: 400 })
    }

    // Supprimer le pari et rembourser les points
    await db.collection('bets').deleteOne({ _id: betId })
    
    await db.collection('users').updateOne(
      { userId: bet.userId },
      { 
        $inc: { points: bet.amount },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      message: 'Pari annulé et points remboursés avec succès' 
    })

  } catch (error) {
    console.error('Erreur annulation pari invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}