'use client'

import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function ReglesPage() {
  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Connecte-toi pour voir les règles !
            </h1>
            <div className="card bg-white">
              <div className="text-center">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-600 mb-6">
                  Connecte-toi pour découvrir les règles du PMU Artsonic
                </p>
                <Link href="/sign-in" className="btn btn-primary text-lg px-8 py-4">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              📚 Règles du PMU Artsonic
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Découvrez les règles des trois types de courses palpitantes qui vous attendent !
            </p>
          </div>

          {/* Introduction */}
          <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 mb-12 text-center">
            <div className="text-4xl mb-4">🏇</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Bienvenue au PMU Artsonic !</h2>
            <p className="text-gray-700 text-lg mb-4">
              Participez aux courses les plus folles et pariez sur vos favoris !
            </p>
            <p className="text-gray-600">
              Chaque type de course a ses propres règles et défis. Prêt à relever le défi ?
            </p>
          </div>

          {/* Les 3 types de courses */}
          <div className="space-y-12">
            
            {/* Galop fou */}
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  🏇
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Le Galop fou</h2>
                  <p className="text-red-600 font-medium">Course sur bâton</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Principe</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Les participants courent avec un <strong>bâton entre les jambes</strong>
                </p>
                <p className="text-gray-700">
                  C'est la course la plus rapide et la plus folle ! Préparez-vous à galoper !
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-3">✅ Règles obligatoires</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Le bâton doit <strong>toujours rester entre les jambes</strong></span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Le <strong>plus rapide gagne</strong> !</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-800 mb-3">⚠️ Règles spéciales</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>Disqualification</strong> si le bâton sort d'entre les jambes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>Droit de pousser ? <em>(À définir selon l'ambiance)</em></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Trot monté */}
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  🐎
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Le Trot monté</h2>
                  <p className="text-yellow-600 font-medium">Course en binôme : cheval + jockey</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Principe</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Les participants forment des <strong>binômes</strong>. L'un joue le cheval (avec masque), l'autre le jockey sur son dos.
                </p>
                <p className="text-gray-700">
                  Travail d'équipe et endurance sont les clés de la victoire !
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-3">👥 Formation des équipes</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Binômes obligatoires</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Le "cheval" porte le <strong>masque</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Le "jockey" monte <strong>sur le dos</strong> du cheval</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-3">🏆 Victoire</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Le <strong>premier binôme</strong> qui passe la ligne gagne</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Les <strong>deux participants</strong> doivent franchir ensemble</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>Course d'<strong>endurance</strong> et de coordination</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Paris Longchamp */}
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  🏟️
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Le Paris Longchamp</h2>
                  <p className="text-green-600 font-medium">Course avec épreuve de précision</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Principe</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Course en binômes avec une <strong>épreuve de lancer</strong> ! Stratégie et précision sont essentielles.
                </p>
                <p className="text-gray-700">
                  Le coureur ne peut avancer que si le lanceur réussit son tir !
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-800 mb-3">🎯 Rôles dans l'équipe</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Le Lanceur :</strong> doit marquer des paniers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Le Coureur :</strong> avance selon les réussites</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Lancer une <strong>balle dans un seau</strong></span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-bold text-orange-800 mb-3">⚡ Règle d'avancement</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Tant que la balle n'est pas dans le seau</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Le coureur <strong>ne peut pas avancer</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Panier réussi = <strong>avancement autorisé</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h4 className="font-bold text-gray-800 mb-3">🎬 Inspiration vidéo</h4>
                <p className="text-gray-700 mb-3">
                  Pour mieux comprendre l'esprit de cette course, regardez cette vidéo :
                </p>
                <a 
                  href="https://www.youtube.com/watch?v=q2bCQQFIt-I" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  🎥 Voir la vidéo d'inspiration
                  <span>→</span>
                </a>
                <p className="text-gray-600 text-sm mt-2">
                  <em>Attention : ça risque de gueuler dans tous les sens ! 😄</em>
                </p>
              </div>
            </div>
          </div>

          {/* Comment parier */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 mt-12">
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Comment parier ?</h2>
              <p className="text-gray-700 text-lg mb-6">
                Maintenant que vous connaissez les règles, il est temps de parier !
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-blue-800 mb-2">1. Choisissez votre course</h3>
                  <p className="text-gray-600 text-sm">Galop fou, Trot monté ou Paris Longchamp ?</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-green-800 mb-2">2. Sélectionnez votre cheval</h3>
                  <p className="text-gray-600 text-sm">Analysez les participants et leurs stratégies</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-purple-800 mb-2">3. Placez vos points</h3>
                  <p className="text-gray-600 text-sm">Misez vos points et tentez de doubler la mise !</p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-4">
                  🎯 Commencer à parier !
                </Link>
              </div>
            </div>
          </div>

          {/* Retour */}
          <div className="text-center mt-12">
            <Link href="/" className="text-gray-600 hover:text-gray-800 font-medium">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </SignedIn>
    </div>
  )
}