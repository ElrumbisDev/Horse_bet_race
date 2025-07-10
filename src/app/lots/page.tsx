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
          {/* Festival 61 Degrés */}
          <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="font-bold text-2xl mb-3">Festival 61 Degrés</h3>
            <p className="text-gray-700 mb-4">
              Vivez une expérience unique au festival 61 Degrés avec 2 places offertes pour profiter de la musique et de l&apos;ambiance exceptionnelle !
            </p>
            <div className="text-3xl font-bold text-yellow-600 mb-4">2 places</div>
            <div className="text-sm text-gray-600">
              Tirage au sort mensuel parmi les meilleurs joueurs
            </div>
          </div>

          {/* Backstage Artsonic */}
          <div className="card bg-gradient-to-br from-blue-100 to-blue-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="font-bold text-2xl mb-3">Accès Backstage Artsonic</h3>
            <p className="text-gray-700 mb-4">
              Découvrez les coulisses d&apos;Artsonic avec un pass VIP backstage exclusif. Rencontrez les artistes et vivez l&apos;événement de l&apos;intérieur !
            </p>
            <div className="text-3xl font-bold text-blue-600 mb-4">VIP Pass</div>
            <div className="text-sm text-gray-600">
              Réservé aux champions du classement
            </div>
          </div>

          {/* Cidre Bgnoles de Pom */}
          <div className="card bg-gradient-to-br from-green-100 to-green-200 p-8 text-center hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🍾</div>
            <h3 className="font-bold text-2xl mb-3">Cidre Artisanal</h3>
            <p className="text-gray-700 mb-4">
              Savourez une bouteille de cidre artisanal Bgnoles de Pom, produit local de qualité premium pour célébrer vos victoires !
            </p>
            <div className="text-3xl font-bold text-green-600 mb-4">1 bouteille</div>
            <div className="text-sm text-gray-600">
              Lots hebdomadaires pour les participants actifs
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