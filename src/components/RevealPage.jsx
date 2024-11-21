import React, { useState, useEffect } from 'react'

function RevealPage() {
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [pairingData, setPairingData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get the URL parameters
    const pathParts = window.location.pathname.split('/')
    const groupName = decodeURIComponent(pathParts[2])
    const participantId = pathParts[3]
    const secretKey = pathParts[4]

    // Get the pairings from localStorage
    const storedData = localStorage.getItem('secretSantaPairings')
    if (!storedData) {
      setError('No Secret Santa data found')
      setLoading(false)
      return
    }

    const data = JSON.parse(storedData)
    if (data.groupName !== groupName) {
      setError('Group not found')
      setLoading(false)
      return
    }

    const pairing = data.pairings.find(
      p => p.giverId === participantId && p.secretKey === secretKey
    )

    if (!pairing) {
      setError('Invalid link or pairing not found')
      setLoading(false)
      return
    }

    setPairingData({
      groupName: data.groupName,
      budget: data.budget,
      giver: pairing.giver,
      receiver: pairing.receiver
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <span className="text-4xl mb-4 block">😕</span>
            <h1 className="text-xl font-bold text-red-600 mb-2">Oops!</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 p-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎄 Secret Santa 🎄
            </h1>
            <p className="text-red-100">{pairingData.groupName}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600">
                Hello <span className="font-bold text-gray-800">{pairingData.giver}</span>!
              </p>
              {!revealed && (
                <p className="text-sm text-gray-500 mt-2">
                  Ready to find out who you're getting a gift for?
                </p>
              )}
            </div>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-3 text-lg"
              >
                <span>Reveal My Match</span>
                <span className="text-2xl">🎁</span>
              </button>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-lg text-gray-600 mb-3">You are getting a gift for:</p>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {pairingData.receiver}
                  </p>
                  <div className="text-5xl mb-4">🎁</div>
                  {pairingData.budget && (
                    <p className="text-sm text-gray-500">
                      Budget: ${pairingData.budget}
                    </p>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Remember to keep it a secret! 🤫
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center">
            <p className="text-xs text-gray-500">
              🎅 Happy Holidays! 🎄
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RevealPage 