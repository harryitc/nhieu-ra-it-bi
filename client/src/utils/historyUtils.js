/**
 * Computes updated player stats and creates a history entry for one round.
 * Pure function – no side effects.
 */
export function computeHistoryEntry(isTie, results, ultimateLoserId, roundNumber, roundType, prevStats) {
  const stats = structuredClone(prevStats)

  // Initialize/update stats for each non-spectator player
  results.forEach((res) => {
    if (res.isSpectator) return
    if (!stats[res.id]) {
      stats[res.id] = {
        id: res.id,
        name: res.name,
        color: res.color,
        roundsPlayed: 0,
        roundsSafe: 0,
        roundsLost: 0,
        tournamentsLost: 0
      }
    } else {
      stats[res.id].name = res.name
      stats[res.id].color = res.color
    }
  })

  // Accumulate round stats for active (non-spectator) players who made a choice
  results.forEach((res) => {
    if (res.isSpectator || res.choice == null) return
    const s = stats[res.id]
    if (!s) return
    s.roundsPlayed++
    if (!isTie) {
      if (res.status === 'safe') s.roundsSafe++
      else if (res.status === 'loser') s.roundsLost++
    }
  })

  // Accumulate tournament losses for the ultimate loser
  if (ultimateLoserId) {
    if (!stats[ultimateLoserId]) {
      const loser = results.find((r) => r.id === ultimateLoserId)
      stats[ultimateLoserId] = {
        id: ultimateLoserId,
        name: loser?.name ?? 'Người chơi',
        color: loser?.color ?? { value: '#ffffff' },
        roundsPlayed: 0,
        roundsSafe: 0,
        roundsLost: 0,
        tournamentsLost: 1
      }
    } else {
      stats[ultimateLoserId].tournamentsLost++
    }
  }

  // Build round entry
  const now = new Date()
  const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')

  const entry = {
    roundNumber,
    roundType,
    time: timeStr,
    isTie,
    ultimateLoserId,
    details: results.map((r) => ({
      id: r.id,
      name: r.name,
      choice: r.choice,
      status: r.status,
      color: r.color,
      isSpectator: r.isSpectator,
      isSafe: r.isSafe
    }))
  }

  return { entry, updatedStats: stats }
}
