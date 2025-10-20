export interface SRSData {
  interval: number
  ease: number
  due: string
}

export function review(currentSrs: SRSData | undefined, grade: number): SRSData {
  const now = new Date()

  // Initialize if first review
  if (!currentSrs) {
    currentSrs = {
      interval: 1,
      ease: 2.5,
      due: now.toISOString(),
    }
  }

  let { interval, ease } = currentSrs

  // Update ease factor based on grade (0-5)
  ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))

  // Calculate new interval
  if (grade < 3) {
    // Failed - reset to 1 day
    interval = 1
  } else {
    // Passed - increase interval
    if (interval === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ease)
    }
  }

  // Calculate due date
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + interval)

  return {
    interval,
    ease,
    due: dueDate.toISOString(),
  }
}

export function isDue(srs: SRSData | undefined): boolean {
  if (!srs) return true
  return new Date(srs.due) <= new Date()
}
