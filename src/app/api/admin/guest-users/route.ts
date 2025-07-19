import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

// GET - Récupérer tous les utilisateurs invités
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    
    // Récupérer tous les utilisateurs invités avec leurs statistiques
    const guestUsers = await db.collection('users').find({ 
      userType: 'guest' 
    }).toArray()

    // Calculer les statistiques pour chaque utilisateur invité
    const guestUsersWithStats = await Promise.all(
      guestUsers.map(async (guestUser) => {
        const bets = await db.collection('bets').find({ 
          userId: guestUser.userId 
        }).toArray()

        const totalBets = bets.length
        const wonBets = bets.filter(bet => bet.won === true).length
        const lostBets = bets.filter(bet => bet.won === false).length
        const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0)
        const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0

        return {
          ...guestUser,
          totalBets,
          wonBets,
          lostBets,
          totalBetAmount,
          winRate,
          displayName: guestUser.name || `Invité ${guestUser.guestCode}`
        }
      })
    )

    return NextResponse.json(guestUsersWithStats)
  } catch (error) {
    console.error('Erreur récupération utilisateurs invités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouvel utilisateur invité
export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, initialPoints = 100 } = body
    const expiresAt = new Date('2100-01-01')
    const isActive = true

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Générer un code unique pour l'utilisateur invité
    const guestCode = uuidv4().substring(0, 8).toUpperCase()
    const guestUserId = `guest_${guestCode}`

    // Vérifier que le code n'existe pas déjà
    const existingGuest = await db.collection('users').findOne({ guestCode })
    if (existingGuest) {
      return NextResponse.json({ error: 'Code invité déjà existant, réessayez' }, { status: 400 })
    }

    const newGuestUser = {
      userId: guestUserId,
      userType: 'guest',
      name: name.trim(),
      points: initialPoints,
      guestCode,
      createdBy: user.id,
      isActive,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewedFinishedRaces: [],
      instagramBonusClaimed: false
    }

    await db.collection('users').insertOne(newGuestUser)

    return NextResponse.json({
      message: 'Utilisateur invité créé avec succès',
      guestUser: {
        ...newGuestUser,
        displayName: newGuestUser.name,
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        totalBetAmount: 0,
        winRate: 0
      }
    })
  } catch (error) {
    console.error('Erreur création utilisateur invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un utilisateur invité
export async function PUT(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { guestUserId, name, points, isActive, expiresAt } = body

    if (!guestUserId) {
      return NextResponse.json({ error: 'ID utilisateur invité requis' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (points !== undefined) updateData.points = points
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    const result = await db.collection('users').updateOne(
      { userId: guestUserId, userType: 'guest' },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Utilisateur invité non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Utilisateur invité mis à jour avec succès' })
  } catch (error) {
    console.error('Erreur mise à jour utilisateur invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un utilisateur invité
export async function DELETE(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { guestUserId } = body

    if (!guestUserId) {
      return NextResponse.json({ error: 'ID utilisateur invité requis' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Supprimer tous les paris de l'utilisateur invité
    await db.collection('bets').deleteMany({ userId: guestUserId })

    // Retirer l'utilisateur invité de toutes les courses
    await db.collection('courses').updateMany(
      { 'horses.userId': guestUserId },
      { 
        $pull: { horses: { userId: guestUserId } },
        $set: { 'slotsArray.$[elem].taken': false, 'slotsArray.$[elem].horseName': null }
      },
      { arrayFilters: [{ 'elem.horseName': { $exists: true } }] }
    )

    // Supprimer l'utilisateur invité
    const result = await db.collection('users').deleteOne({ 
      userId: guestUserId, 
      userType: 'guest' 
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Utilisateur invité non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Utilisateur invité supprimé avec succès' })
  } catch (error) {
    console.error('Erreur suppression utilisateur invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}