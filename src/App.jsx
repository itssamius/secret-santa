import React, { useState } from 'react'
import './App.css'

// Function to generate random 16-character hex string
const generateHexId = () => {
  const hexChars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += hexChars[Math.floor(Math.random() * 16)]
  }
  return result
}

function App() {
  const [participants, setParticipants] = useState([
    { id: generateHexId(), name: '', assignedTo: null }
  ])
  const [groupName, setGroupName] = useState('')
  const [budget, setBudget] = useState('')
  const [pairings, setPairings] = useState([])
  const [isPairingGenerated, setIsPairingGenerated] = useState(false)
  const [revealedPairings, setRevealedPairings] = useState({})
  const [blockedPairings, setBlockedPairings] = useState([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedBlockGroup, setSelectedBlockGroup] = useState([])
  const [forcedMatches, setForcedMatches] = useState([])
  const [showForcedModal, setShowForcedModal] = useState(false)
  const [selectedForcedPair, setSelectedForcedPair] = useState({ giver: '', receiver: '' })

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { id: generateHexId(), name: '', assignedTo: null }
    ])
  }

  const removeParticipant = (id) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id))
    }
  }

  const updateParticipant = (id, name) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, name } : p
    ))
  }

  const storePairings = (newPairings) => {
    const pairingsData = {
      groupName,
      budget,
      pairings: newPairings
    }
    localStorage.setItem('secretSantaPairings', JSON.stringify(pairingsData))
    setPairings(newPairings)
  }

  const addBlockedPairing = () => {
    if (selectedBlockGroup.length >= 2) {
      setBlockedPairings([...blockedPairings, {
        group: [...selectedBlockGroup]
      }])
      setSelectedBlockGroup([])
      setShowBlockModal(false)
    }
  }

  const removeBlockedPairing = (index) => {
    setBlockedPairings(blockedPairings.filter((_, i) => i !== index))
  }

  const isPairingBlocked = (giver, receiver) => {
    return blockedPairings.some(group => {
      // If both giver and receiver are in the same blocked group, they can't be matched
      return group.group.includes(giver) && group.group.includes(receiver)
    })
  }

  const addForcedMatch = () => {
    setForcedMatches([...forcedMatches, { giver: '', receiver: '' }])
  }

  const updateForcedMatch = (index, field, value) => {
    const newForcedMatches = [...forcedMatches]
    newForcedMatches[index][field] = value
    setForcedMatches(newForcedMatches)
  }

  const removeForcedMatch = (index) => {
    setForcedMatches(forcedMatches.filter((_, i) => i !== index))
  }

  const generatePairings = () => {
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      attempts++
      
      // Start with forced matches
      let matches = []
      let availableGivers = [...participants]
      let availableReceivers = [...participants]
      let success = true

      // First handle forced matches
      for (const forcedMatch of forcedMatches) {
        const giver = participants.find(p => p.name === forcedMatch.giver)
        const receiver = participants.find(p => p.name === forcedMatch.receiver)
        
        if (!giver || !receiver) {
          success = false
          break
        }

        matches.push({
          giver: giver.name,
          giverId: giver.id,
          receiver: receiver.name,
          secretKey: generateHexId()
        })

        // Remove used participants from available pools
        availableGivers = availableGivers.filter(p => p.id !== giver.id)
        availableReceivers = availableReceivers.filter(p => p.id !== receiver.id)
      }

      if (!success) continue

      // Then handle remaining participants
      for (const giver of availableGivers) {
        // Get possible receivers (excluding already matched and blocked)
        const possibleReceivers = availableReceivers.filter(receiver => 
          receiver.id !== giver.id && 
          !isPairingBlocked(giver.name, receiver.name)
        )

        if (possibleReceivers.length === 0) {
          success = false
          break
        }

        // Randomly select a receiver
        const randomIndex = Math.floor(Math.random() * possibleReceivers.length)
        const receiver = possibleReceivers[randomIndex]

        matches.push({
          giver: giver.name,
          giverId: giver.id,
          receiver: receiver.name,
          secretKey: generateHexId()
        })

        // Remove selected receiver from available receivers
        availableReceivers = availableReceivers.filter(p => p.id !== receiver.id)
      }

      // If we successfully matched everyone, store the pairings and exit
      if (success) {
        storePairings(matches)
        setRevealedPairings({})
        setIsPairingGenerated(true)
        return
      }
    }

    alert('Failed to generate valid pairings. You may have too many blocked combinations.')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (participants.some(p => !p.name.trim())) {
      alert('Please fill in all participant names')
      return
    }
    generatePairings()
  }

  const revealPairing = (giverId) => {
    setRevealedPairings(prev => ({
      ...prev,
      [giverId]: true
    }))
  }

  const copyLinkToClipboard = async (participantId, secretKey) => {
    const baseUrl = window.location.origin
    const encodedGroupName = encodeURIComponent(groupName)
    const link = `${baseUrl}/reveal/${encodedGroupName}/${participantId}/${secretKey}`

    try {
      // Try using the modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link)
        alert('Link copied to clipboard!')
      } else {
        // Fallback method
        const textArea = document.createElement('textarea')
        textArea.value = link
        document.body.appendChild(textArea)
        textArea.select()
        
        try {
          document.execCommand('copy')
          alert('Link copied to clipboard!')
        } catch (err) {
          alert('Failed to copy link. Please copy this manually:\n\n' + link)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      // If all methods fail, show the link to manually copy
      alert('Failed to copy link. Please copy this manually:\n\n' + link)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-8">
          Secret Santa Organizer 🎅
        </h1>

        {!isPairingGenerated ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget (optional)
                </label>
                <input
                  type="number"
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="$"
                />
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Participants</h2>
              {participants.map((participant) => (
                <div key={participant.id} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={participant.name}
                    onChange={(e) => updateParticipant(participant.id, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addParticipant}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Participant
              </button>
            </div>

            {/* Blocked Pairings Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">Blocked Pairings</h2>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Add Blocked Pairing
                </button>
              </div>
              
              {blockedPairings.length > 0 ? (
                <div className="space-y-2">
                  {blockedPairings.map((group, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>
                        {group.group.join(' ↔️ ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBlockedPairing(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No blocked pairings added</p>
              )}
            </div>

            {/* Forced Matches Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">Forced Matches</h2>
                <button
                  type="button"
                  onClick={() => setShowForcedModal(true)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Forced Match
                </button>
              </div>
              
              {forcedMatches.length > 0 ? (
                <div className="space-y-2">
                  {forcedMatches.map((pair, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>
                        {pair.giver} ➡️ {pair.receiver}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeForcedMatch(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No forced matches added</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Generate Secret Santa Pairs
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-green-600">
                🎄 {groupName} 🎄
              </h2>
              <div className="space-y-2">
                <p className="text-xl text-gray-600">
                  Secret Santa Assignments
                </p>
                {budget && (
                  <p className="text-md text-gray-500">
                    Budget: ${budget}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Share these private links with each participant to reveal their match. 
                Each link will only show that person's assignment.
              </p>
            </div>

            <div className="grid gap-4">
              {pairings.map((pair) => (
                <div 
                  key={pair.giverId} 
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎅</span>
                        <span className="font-semibold text-lg text-gray-800">
                          {pair.giver}
                        </span>
                      </div>
                      
                      {!revealedPairings[pair.giverId] ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyLinkToClipboard(pair.giverId, pair.secretKey)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                          >
                            <span>Copy Link</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => revealPairing(pair.giverId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                          >
                            <span>Reveal</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <span>Gives a gift to:</span>
                          <span className="font-bold">{pair.receiver}</span>
                          <span className="text-2xl">🎁</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setIsPairingGenerated(false)
                  setRevealedPairings({})
                }}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Start Over</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blocked Pairing Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Blocked Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected People ({selectedBlockGroup.length})
                </label>
                {selectedBlockGroup.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedBlockGroup.map((person, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100"
                      >
                        {person}
                        <button
                          type="button"
                          onClick={() => setSelectedBlockGroup(prev => 
                            prev.filter(p => p !== person)
                          )}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <select
                  onChange={(e) => {
                    if (e.target.value && !selectedBlockGroup.includes(e.target.value)) {
                      setSelectedBlockGroup([...selectedBlockGroup, e.target.value])
                    }
                    e.target.value = '' // Reset select after adding
                  }}
                  className="w-full rounded-md border-gray-300"
                >
                  <option value="">Add person to group</option>
                  {participants
                    .filter(p => !selectedBlockGroup.includes(p.name))
                    .map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockModal(false)
                    setSelectedBlockGroup([])
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addBlockedPairing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={selectedBlockGroup.length < 2}
                >
                  Add Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Forced Match Modal */}
      {showForcedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Forced Match</h3>
            <div className="space-y-4">
              <select
                value={selectedForcedPair.giver}
                onChange={(e) => setSelectedForcedPair({
                  ...selectedForcedPair,
                  giver: e.target.value
                })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="">Select Giver</option>
                {participants.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <select
                value={selectedForcedPair.receiver}
                onChange={(e) => setSelectedForcedPair({
                  ...selectedForcedPair,
                  receiver: e.target.value
                })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="">Select Receiver</option>
                {participants.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForcedModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedForcedPair.giver && selectedForcedPair.receiver) {
                      setForcedMatches([...forcedMatches, selectedForcedPair]);
                      setSelectedForcedPair({ giver: '', receiver: '' });
                      setShowForcedModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!selectedForcedPair.giver || !selectedForcedPair.receiver || 
                           selectedForcedPair.giver === selectedForcedPair.receiver}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App 