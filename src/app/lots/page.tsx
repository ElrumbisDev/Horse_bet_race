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
            Découvrez tous les prix incroyables que vous pouvez remporter en jouant au PMU d&apos;Artsonic
          </p>
        </div>

        {/* Lots principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Pass Art Sonic */}
          <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="font-bold text-2xl mb-3">Pass 2 jours Art Sonic 2026</h3>
            <p className="text-gray-700 mb-4">
              Vivez une expérience unique au festival Art Sonic 2026 avec un pass 2 jours pour profiter de la musique et de l&apos;ambiance exceptionnelle !
            </p>
            <div className="text-3xl font-bold text-yellow-600 mb-4">Pass 2 jours</div>
            <div className="text-sm text-gray-600">
              Tirage au sort mensuel parmi les meilleurs joueurs
            </div>
          </div>

          {/* Festival 61 Degrés */}
          <div className="card bg-gradient-to-br from-blue-100 to-blue-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="font-bold text-2xl mb-3">Festival 61 degrés</h3>
            <p className="text-gray-700 mb-4">
              Découvrez le festival 61 degrés avec des places exclusives pour vivre l&apos;événement de l&apos;intérieur !
            </p>
            <div className="text-3xl font-bold text-blue-600 mb-4">Places</div>
            <div className="text-sm text-gray-600">
              Réservé aux champions du classement
            </div>
          </div>

          {/* Bobs Art Sonic */}
          <div className="card bg-gradient-to-br from-green-100 to-green-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🧢</div>
            <h3 className="font-bold text-2xl mb-3">Bobs Art Sonic</h3>
            <p className="text-gray-700 mb-4">
              Pour crânes stratégiques ! Arborez fièrement votre bob Art Sonic et montrez votre appartenance à la communauté.
            </p>
            <div className="text-3xl font-bold text-green-600 mb-4">Bob exclusif</div>
            <div className="text-sm text-gray-600">
              Lots hebdomadaires pour les participants actifs
            </div>
          </div>

          {/* Camemberts Gillot BBQ */}
          <div className="card bg-gradient-to-br from-orange-100 to-orange-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🧀</div>
            <h3 className="font-bold text-2xl mb-3">Camemberts Gillot BBQ</h3>
            <p className="text-gray-700 mb-4">
              Chauds, coulants, divins ! Savourez ces délicieux camemberts BBQ parfaits pour vos soirées conviviales.
            </p>
            <div className="text-3xl font-bold text-orange-600 mb-4">Camemberts</div>
            <div className="text-sm text-gray-600">
              Lots gourmands pour les participants actifs
            </div>
          </div>

          {/* Tickets boisson */}
          <div className="card bg-gradient-to-br from-purple-100 to-purple-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🍻</div>
            <h3 className="font-bold text-2xl mb-3">Tickets boisson</h3>
            <p className="text-gray-700 mb-4">
              Pour trinquer à la victoire (ou à la loose) ! Des tickets boisson pour célébrer vos performances.
            </p>
            <div className="text-3xl font-bold text-purple-600 mb-4">Tickets</div>
            <div className="text-sm text-gray-600">
              Lots réguliers pour tous les participants
            </div>
          </div>

          {/* Stickers & tatouages */}
          <div className="card bg-gradient-to-br from-pink-100 to-pink-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="font-bold text-2xl mb-3">Stickers & tatouages éphémères</h3>
            <p className="text-gray-700 mb-4">
              Parce qu&apos;il faut marquer le coup ! Personnalisez votre style avec nos stickers et tatouages éphémères exclusifs.
            </p>
            <div className="text-3xl font-bold text-pink-600 mb-4">Goodies</div>
            <div className="text-sm text-gray-600">
              Lots de consolation pour tous
            </div>
          </div>

          {/* Photo dédiée */}
          <div className="card bg-gradient-to-br from-red-100 to-red-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="font-bold text-2xl mb-3">Photo dédiée sur les réseaux</h3>
            <p className="text-gray-700 mb-4">
              Le graal de l&apos;influence locale ! Votre photo sera mise en avant sur nos réseaux sociaux officiels.
            </p>
            <div className="text-3xl font-bold text-red-600 mb-4">Fame</div>
            <div className="text-sm text-gray-600">
              Récompense ultime pour les légendes
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
                Inscrivez vos propres chevaux dans les courses
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