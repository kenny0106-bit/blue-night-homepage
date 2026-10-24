export function updatePosterAudioMode(posters, trackedPosterIds, forceMuted = false) {
  const allPostersTracked = forceMuted || trackedPosterIds.size === posters.length
  posters.forEach(poster => {
    poster.targetVideo.muted = allPostersTracked || !trackedPosterIds.has(poster.id)
  })
}
