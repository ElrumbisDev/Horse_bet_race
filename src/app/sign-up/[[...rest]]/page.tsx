'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Inscription</h1>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </main>
  )
}