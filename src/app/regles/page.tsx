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
            
            {/* Hobby Horse */}
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  🦄
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Le Hobby Horse</h2>
                  <p className="text-green-600 font-medium">Course sur bâton simple</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Principe</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Course individuelle sur <strong>bâton simple</strong> ! Simplicité et plaisir sont au rendez-vous.
                </p>
                <p className="text-gray-700">
                  Chaque participant court avec son bâton-cheval personnalisé !
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-800 mb-3">🦄 Équipement requis</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Bâton-cheval :</strong> fourni par l&apos;organisation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span><strong>Tenue :</strong> libre mais confortable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>Prévoir de <strong>l&apos;énergie</strong> et de la bonne humeur !</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-bold text-orange-800 mb-3">⚡ Règles de la course</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span><strong>Course simple</strong> : du point A au point B</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Courir en <strong>chevauchant le bâton</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Premier arrivé = <strong>gagnant</strong> !</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h4 className="font-bold text-gray-800 mb-3">🦄 Esprit Hobby Horse</h4>
                <p className="text-gray-700 mb-3">
                  Une course simple et amusante inspirée du hobby horse traditionnel !
                </p>
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 text-purple-600 font-medium">
                    🎠 Course accessible à tous les niveaux
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2 text-center">
                  <em>Simple, fun et spectaculaire ! 😄</em>
                </p>
              </div>
            </div>

            {/* Galop fou */}
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  🏇
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Le Galop fou</h2>
                  <p className="text-red-600 font-medium">Course simple avec masque</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Principe</h3>
                <p className="text-gray-700 text-lg mb-4">
                  Course simple avec un <strong>masque sur la tête</strong> qui limite la vision !
                </p>
                <p className="text-gray-700">
                  Le plus rapide et le plus chanceux gagne !
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-3">🎭 Équipement requis</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Masque :</strong> fourni par l&apos;organisation</span>
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
                      <span><strong>Interdiction</strong> d&apos;enlever le masque pendant la course</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>Attention aux <strong>obstacles</strong> sur le parcours !</span>
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
                  Les participants forment des <strong>binômes</strong>. L&apos;un joue le cheval (avec masque), l&apos;autre le jockey sur son dos.
                </p>
                <p className="text-gray-700">
                  Travail d&apos;équipe et endurance sont les clés de la victoire !
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
                      <span>Le &quot;cheval&quot; porte le <strong>masque</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Le &quot;jockey&quot; monte <strong>sur le dos</strong> du cheval</span>
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
                      <span>Course d&apos;<strong>endurance</strong> et de coordination</span>
                    </li>
                  </ul>
                </div>
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
                  <p className="text-gray-600 text-sm">Galop fou, Trot monté ou Hobby Horse ?</p>
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
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </SignedIn>
    </div>
  )
}