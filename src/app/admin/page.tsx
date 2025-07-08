'use client'

import { useEffect, useState } from 'react'

type Slot = { id: number; taken: boolean }
type Horse = { id: string; name: string; userName?: string }

type Course = {
  _id: string
  name: string
  date: string
  slots: number
}

type WinnerSelectionProps = {
  courseId: string
  horses: Horse[]
  onSelect: (courseId: string, winnerName: string) => void
  onCancel: () => void
}

function WinnerSelection({ courseId, horses, onSelect, onCancel }: WinnerSelectionProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Sélectionner le cheval gagnant</h3>
        <div className="space-y-2 mb-6">
          {horses.map((horse, index) => (
            <button
              key={index}
              onClick={() => onSelect(courseId, horse.name)}
              className="w-full p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-semibold">{horse.name}</div>
              <div className="text-sm text-gray-600">Propriétaire: {horse.userName}</div>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', slots: 0, _id: '' })
  const [showWinnerSelection, setShowWinnerSelection] = useState<{courseId: string, horses: Horse[]} | null>(null)

  // Charger les courses depuis l'API
  useEffect(() => {
    setLoading(true)
    fetch('/api/race?admin=true')
      .then(res => res.json())
      .then(data => setCourses(data))
      .finally(() => setLoading(false))
  }, [])

  // Gérer l'envoi du formulaire (ajout ou modification)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const method = form._id ? 'PUT' : 'POST'
    const url = '/api/race'

    const body = form._id
      ? { raceId: form._id, name: form.name, date: form.date, slots: form.slots }
      : { name: form.name, date: form.date, slots: form.slots }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      // Recharger la liste
      const updated = await fetch('/api/race?admin=true').then(r => r.json())
      setCourses(updated)
      setForm({ name: '', date: '', slots: 0, _id: '' })
    } else {
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Pré-remplir le formulaire pour modifier
  function handleEdit(course: Course) {
    setForm({
      _id: course._id,
      name: course.name,
      date: course.date,
      slots: course.slots,
    })
  }

  // Supprimer une course
  async function handleDelete(courseId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette course ?')) {
      return
    }

    const res = await fetch('/api/race', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId: courseId }),
    })

    if (res.ok) {
      // Recharger la liste
      const updated = await fetch('/api/race?admin=true').then(r => r.json())
      setCourses(updated)
      alert('Course supprimée avec succès')
    } else {
      alert('Erreur lors de la suppression')
    }
  }

  // Terminer une course avec un cheval gagnant
  function handleFinishRace(courseId: string, horses: Horse[]) {
    if (horses.length === 0) {
      alert('Aucun cheval inscrit dans cette course')
      return
    }
    setShowWinnerSelection({ courseId, horses })
  }

  // Confirmer le cheval gagnant
  async function confirmWinner(courseId: string, winnerHorseName: string) {
    setShowWinnerSelection(null)

    const res = await fetch('/api/race/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId: courseId, winnerHorseName }),
    })

    if (res.ok) {
      const result = await res.json()
      alert(`${result.message}\nParis gagnants: ${result.winningBets}\nGains distribués: ${result.totalWinnings} points`)
      // Recharger la liste
      const updated = await fetch('/api/race?admin=true').then(r => r.json())
      setCourses(updated)
    } else {
      const error = await res.json()
      alert(error.message || 'Erreur lors de la finalisation')
    }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Administration des Courses</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <ul className="mb-8">
            {courses.map(course => {
              const takenSlots = course.slotsArray ? course.slotsArray.filter((slot: Slot) => slot.taken).length : 0
              const isFull = takenSlots >= course.slots
              const horses = course.horses || []
              const isFinished = course.finished
              
              return (
                <li
                  key={course._id}
                  className={`border-b py-4 cursor-pointer ${
                    isFinished 
                      ? 'bg-gray-50 border-gray-200' 
                      : isFull 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                  }`}
                  onClick={() => !isFinished && handleEdit(course)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-purple-700">{course.name}</span>
                        <span className="text-sm text-gray-600">— {course.date}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          isFinished
                            ? 'bg-gray-100 text-gray-800'
                            : isFull 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {isFinished ? 'TERMINÉE' : `${takenSlots}/${course.slots} slots`}
                        </span>
                        {isFinished && course.winner && (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                            Gagnant: {course.winner}
                          </span>
                        )}
                      </div>
                      {horses.length > 0 && (
                        <div className="text-sm text-gray-700">
                          <strong>Chevaux inscrits:</strong> {horses.map((horse: Horse) => 
                            `${horse.name} (${horse.userName || 'Utilisateur'})`
                          ).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isFinished && horses.length > 0 && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleFinishRace(course._id, horses)
                          }}
                          className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                        >
                          Terminer
                        </button>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(course._id)
                        }}
                        className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
            <input
              type="text"
              placeholder="Nom de la course"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="datetime-local"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              min={1}
              value={form.slots}
              onChange={e => setForm({ ...form, slots: Number(e.target.value) })}
              required
              className="border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
            >
              {form._id ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </>
      )}
      
      {showWinnerSelection && (
        <WinnerSelection
          courseId={showWinnerSelection.courseId}
          horses={showWinnerSelection.horses}
          onSelect={confirmWinner}
          onCancel={() => setShowWinnerSelection(null)}
        />
      )}
    </main>
  )
}
