const SECRET_POSTER_IDS = ['guitar', 'microphone', 'french-horn']

export function hasAllSecretTrackPosters(trackedPosterIds) {
  const tracked = new Set(trackedPosterIds)
  return tracked.size === SECRET_POSTER_IDS.length
    && SECRET_POSTER_IDS.every(posterId => tracked.has(posterId))
}

export function shouldUnlockSecretTrack(trackedPosterIds, alreadyUnlocked) {
  return !alreadyUnlocked && hasAllSecretTrackPosters(trackedPosterIds)
}
