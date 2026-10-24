export function updatePosterLoopMode(posters, trackedPosterIds, newlyFoundPosterId = null) {
  const allPostersTracked = posters.length > 0
    && trackedPosterIds.size === posters.length
    && posters.every(poster => trackedPosterIds.has(poster.id))
  const endedPosterIds = new Set(
    allPostersTracked
      ? posters.filter(poster => poster.targetVideo.ended).map(poster => poster.id)
      : [],
  )

  posters.forEach(poster => {
    poster.targetVideo.loop = allPostersTracked
  })

  if (!allPostersTracked) return

  posters.forEach(poster => {
    if (!trackedPosterIds.has(poster.id) || poster.id === newlyFoundPosterId) return

    const video = poster.targetVideo
    const hadEnded = endedPosterIds.has(poster.id)
    if (hadEnded) video.currentTime = 0
    if (video.paused || hadEnded) {
      video.play().catch(error => {
        console.warn(`Could not continue looping ${poster.label} video.`, error)
      })
    }
  })
}
