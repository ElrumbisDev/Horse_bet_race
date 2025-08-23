'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function LotsPage() {
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎁 Tous les lots à gagner
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez tous les prix incroyables que vous pouvez remporter en jouant au PMU 61 Degrés
          </p>
        </div>

        {/* Lots principaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Parcours ressourçant aux thermes */}
          <div className="card bg-gradient-to-br from-blue-100 to-blue-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="font-bold text-2xl mb-3">Parcours ressourçant aux thermes</h3>
            <p className="text-gray-700 mb-4">
              Détendez-vous et ressourcez-vous avec un parcours complet aux thermes. Une expérience de bien-être inoubliable pour recharger vos batteries !
            </p>
            <div className="text-3xl font-bold text-blue-600 mb-4">Bien-être total</div>
            <div className="text-sm text-gray-600">
              Premier prix - Pour les champions du classement
            </div>
          </div>

          {/* Séance privative spa du roc au chien */}
          <div className="card bg-gradient-to-br from-purple-100 to-purple-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🧘‍♀️</div>
            <h3 className="font-bold text-2xl mb-3">Séance privative pour deux au Spa du Roc au Chien</h3>
            <p className="text-gray-700 mb-4">
              Une expérience exclusive en couple ou entre amis dans un cadre exceptionnel. Profitez d&apos;un moment de détente unique à deux !
            </p>
            <div className="text-3xl font-bold text-purple-600 mb-4">Séance duo</div>
            <div className="text-sm text-gray-600">
              Deuxième prix - Pour les meilleurs parieurs
            </div>
          </div>

          {/* Pass Trofest */}
          <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="font-bold text-2xl mb-3">Pass deux jours pour le Trofest</h3>
            <p className="text-gray-700 mb-4">
              Vivez l&apos;expérience complète du Trofest avec un pass de deux jours ! Musique, animations et ambiance festive garanties.
            </p>
            <div className="text-3xl font-bold text-yellow-600 mb-4">Pass 2 jours</div>
            <div className="text-sm text-gray-600">
              Troisième prix - Pour les participants assidus
            </div>
          </div>
        </div>

        {/* Section comment participer */}
        <div className="card bg-white p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            🏆 Comment participer ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-xl mb-2">Pariez</h3>
              <p className="text-gray-600">
                Placez des paris sur les chevaux et gagnez des points
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏇</div>
              <h3 className="font-bold text-xl mb-2">Inscrivez</h3>
              <p className="text-gray-600">
                Inscrivez vos propres chevaux et gagnez des points bonus si ils remportent la course
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🥇</div>
              <h3 className="font-bold text-xl mb-2">Gagnez</h3>
              <p className="text-gray-600">
                Montez dans le classement et remportez des lots
              </p>
            </div>
          </div>
        </div>


        {/* CTA */}
        <div className="text-center">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-4">
              🎯 Commencer à jouer
            </Link>
          ) : (
            <Link href="/sign-up" className="btn btn-primary text-lg px-8 py-4">
              🚀 S&apos;inscrire maintenant
            </Link>
          )}
          <div className="mt-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}