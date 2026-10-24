import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { updatePosterAudioMode } from './poster-audio-mode.js'
import { updatePosterLoopMode } from './poster-video-mode.js'
import { hasCoincidentPosterPose } from './poster-pose.js'
import { hasAllSecretTrackPosters, shouldUnlockSecretTrack } from './secret-track-logic.js'
import './styles.css'

// Adjust this one value to change the homepage idle delay.
const IDLE_TIMEOUT_MS = 15_000

// Connect future destinations by replacing the empty href values.
const entrances = [
  { id: '01', name: 'AR POSTER', detail: 'SCAN', href: '/ar-poster', state: 'SCANNER PREVIEW' },
  { id: '02', name: 'THE SOUND', detail: 'TAP IN', href: 'https://blue-night-one.vercel.app/', state: 'AVAILABLE' },
  { id: '03', name: 'TICKET', detail: 'ENTRY', href: '', state: 'COMING SOON' },
]

function BrandMark() {
  return <a className="brand-mark" href="#top" aria-label="Blue Night main entrance"><img src="/blue-night-mark-white.png" alt="" /></a>
}

function Entrance({ item }) {
  const content = <>
    <span className="entrance-copy">
      <span className="entrance-index"><b>{item.id}</b><i>{item.detail}</i></span>
      <strong className="entrance-title">{item.name}</strong>
      <span className={`entrance-state ${item.href ? 'is-available' : ''}`}><i />{item.state}{item.href && <b aria-hidden="true">↗</b>}</span>
    </span>
  </>

  return item.href
    ? <a className={`entrance entrance-${item.id} is-live`} href={item.href} aria-label={item.id === '02' ? 'NFC, available now. Open the Blue Night NFC experience' : 'AR Poster, open the camera scanning preview'}>{content}</a>
    : <div className={`entrance entrance-${item.id} is-pending`} aria-label={`${item.name}, coming soon`}>{content}</div>
}

function PortalHome({ inactive, onManualStandby }) {
  return <main className="gateway" id="top" aria-hidden={inactive} inert={inactive}>
    <header className="masthead">
      <BrandMark />
      <span className="edition">BLUE NIGHT<br />DIGITAL / 2026</span>
      <span className="location">KAOHSIUNG, TAIWAN <i>·</i> 17 OCTOBER</span>
      <button className="staff-standby" type="button" onClick={onManualStandby} aria-label="Staff: enter Blue Night standby mode">STANDBY</button>
    </header>

    <section className="portal" aria-labelledby="portal-title">
      <div className="portal-heading">
        <span className="system-label"><i /> MAIN EXPERIENCE <b>00 — 01</b></span>
        <h1 id="portal-title"><span>BLUE</span><em>NIGHT</em></h1>
        <p>One night. Three ways in.</p>
      </div>

      <nav className="entrances" aria-label="Choose a Blue Night experience">
        {entrances.map(item => <Entrance item={item} key={item.id} />)}
      </nav>

      <div className="portal-instruction"><span>THREE DIGITAL EXPERIENCES</span><i aria-hidden="true">↓</i></div>
    </section>

    <footer className="footer">
      <span>UNDERGROUND SOUND / TAIWAN</span>
      <span className="footer-signal"><i /> SYSTEM ONLINE</span>
      <span>BN—001</span>
    </footer>
  </main>
}

// targetIndex follows the image order used to compile public/ar/blue-night-posters.mind.
const posterTargets = [
  { id: 'guitar', label: 'GUITAR', targetIndex: 0, videoSrc: '/ar/poster-videos/guitar.mp4', aspectRatio: 2187 / 1554 },
  { id: 'microphone', label: 'MICROPHONE', targetIndex: 1, videoSrc: '/ar/poster-videos/microphone.mp4', aspectRatio: 1987 / 1407 },
  { id: 'french-horn', label: 'FRENCH HORN', targetIndex: 2, videoSrc: '/ar/poster-videos/french-horn.mp4', aspectRatio: 1999 / 1413 },
]

function PosterRecognitionLayer({ active, onReady, onTargetsChange, onError, trackedPosterIds, forceVideoMute }) {
  const containerRef = useRef(null)
  const trackerRef = useRef(null)
  const callbacksRef = useRef({ onReady, onTargetsChange, onError, forceVideoMute })
  callbacksRef.current = { onReady, onTargetsChange, onError, forceVideoMute }

  useEffect(() => {
    if (!active) return undefined
    let cancelled = false

    const startTracking = async () => {
      try {
        if (!trackerRef.current) {
          const [{ MindARThree }, THREE] = await Promise.all([
            import('mind-ar/dist/mindar-image-three.prod.js'),
            import('three'),
          ])
          if (cancelled || !containerRef.current) return

          const mindar = new MindARThree({
            container: containerRef.current,
            imageTargetSrc: '/ar/blue-night-posters.mind',
            maxTrack: posterTargets.length,
            uiLoading: 'no',
            uiScanning: 'no',
            uiError: 'no',
          })
          const trackedPosterIds = new Set()
          const duplicateTargetIds = new Set()
          const publishTrackedTargets = () => {
            callbacksRef.current.onTargetsChange(
              posterTargets.filter(poster => trackedPosterIds.has(poster.id)).map(poster => poster.id),
            )
          }
          const posters = posterTargets.map(poster => {
            const targetVideo = document.createElement('video')
            targetVideo.src = poster.videoSrc
            targetVideo.preload = 'auto'
            targetVideo.playsInline = true
            targetVideo.loop = false
            targetVideo.muted = true
            targetVideo.setAttribute('playsinline', '')
            targetVideo.load()

            const videoTexture = new THREE.VideoTexture(targetVideo)
            videoTexture.colorSpace = THREE.SRGBColorSpace
            const videoMaterial = new THREE.MeshBasicMaterial({
              map: videoTexture,
              side: THREE.DoubleSide,
              toneMapped: false,
            })
            const videoPlane = new THREE.Mesh(
              new THREE.PlaneGeometry(1, poster.aspectRatio),
              videoMaterial,
            )
            videoPlane.visible = false
            videoPlane.position.z = 0.01

            const anchor = mindar.addAnchor(poster.targetIndex)
            anchor.group.add(videoPlane)
            anchor.onTargetFound = () => {
              const eventDetails = getTargetEventDetails(mindar, poster, anchor, [...trackedPosterIds])
              if (trackedPosterIds.has(poster.id)) {
                console.warn('[Blue Night AR] Ignored duplicate targetFound event.', eventDetails)
                return
              }
              if (duplicateTargetIds.has(poster.id)) {
                console.warn('[Blue Night AR] Ignored repeated targetFound for a suppressed target.', eventDetails)
                return
              }

              const overlappingPoster = posters.find(trackedPoster =>
                trackedPoster.id !== poster.id
                && trackedPosterIds.has(trackedPoster.id)
                && hasCoincidentPosterPose(anchor, trackedPoster.anchor),
              )
              if (overlappingPoster) {
                duplicateTargetIds.add(poster.id)
                videoPlane.visible = false
                targetVideo.pause()
                targetVideo.currentTime = 0
                console.warn('[Blue Night AR] Suppressed a coincident target pose.', {
                  ...eventDetails,
                  suppressedBy: { id: overlappingPoster.id, targetIndex: overlappingPoster.targetIndex },
                  poseCollisionGuard: true,
                })
                return
              }

              duplicateTargetIds.delete(poster.id)
              console.info('[Blue Night AR] Target found.', eventDetails)
              trackedPosterIds.add(poster.id)
              videoPlane.visible = true
              updatePosterAudioMode(posters, trackedPosterIds, callbacksRef.current.forceVideoMute)
              updatePosterLoopMode(posters, trackedPosterIds, poster.id)
              publishTrackedTargets()
              targetVideo.currentTime = 0
              targetVideo.play().catch(error => {
                // Never mute as a fallback: the audio mode is controlled only by tracked posters.
                console.warn(`Could not autoplay ${poster.label} video with its original audio.`, error)
              })
            }
            anchor.onTargetLost = () => {
              videoPlane.visible = false
              targetVideo.pause()
              targetVideo.currentTime = 0
              const eventDetails = getTargetEventDetails(mindar, poster, anchor, [...trackedPosterIds])
              if (duplicateTargetIds.delete(poster.id)) {
                console.info('[Blue Night AR] Suppressed target lost.', { ...eventDetails, suppressed: true })
                return
              }
              if (!trackedPosterIds.delete(poster.id)) {
                console.warn('[Blue Night AR] Ignored targetLost event for a target absent from tracked state.', eventDetails)
                return
              }
              console.info('[Blue Night AR] Target lost.', eventDetails)
              updatePosterAudioMode(posters, trackedPosterIds, callbacksRef.current.forceVideoMute)
              updatePosterLoopMode(posters, trackedPosterIds)
              publishTrackedTargets()
            }

            return { ...poster, anchor, targetVideo, videoTexture, videoMaterial, videoPlane }
          })

          trackerRef.current = { mindar, posters, trackedPosterIds }
        }

        const { mindar } = trackerRef.current
        await mindar.start()
        if (cancelled) {
          stopMindARCamera(mindar)
          return
        }
        mindar.renderer.setAnimationLoop(() => mindar.renderer.render(mindar.scene, mindar.camera))
        callbacksRef.current.onReady()
      } catch (error) {
        if (!cancelled) {
          const messages = {
            NotAllowedError: 'Camera access was not granted. Allow camera access in your browser settings, then try again.',
            NotFoundError: 'No camera was found on this device.',
            NotReadableError: 'The camera is busy in another app. Close it there and try again.',
          }
          callbacksRef.current.onError(messages[error?.name] || 'The camera or poster tracker could not start. Check permissions and try again.')
        }
      }
    }

    startTracking()
    return () => {
      cancelled = true
      const tracker = trackerRef.current
      if (tracker) {
        tracker.posters.forEach(poster => {
          poster.targetVideo.pause()
          poster.targetVideo.currentTime = 0
        })
        tracker.trackedPosterIds.clear()
        callbacksRef.current.onTargetsChange([])
        tracker.mindar.renderer.setAnimationLoop(null)
        stopMindARCamera(tracker.mindar)
      }
    }
  }, [active])

  useEffect(() => {
    const tracker = trackerRef.current
    if (!active || !tracker) return
    updatePosterAudioMode(tracker.posters, tracker.trackedPosterIds, forceVideoMute)
  }, [active, forceVideoMute, trackedPosterIds])

  useEffect(() => () => {
    const tracker = trackerRef.current
    if (!tracker) return
    tracker.posters.forEach(poster => {
      poster.targetVideo.pause()
      poster.targetVideo.removeAttribute('src')
      poster.targetVideo.load()
      poster.videoTexture.dispose()
      poster.videoMaterial.dispose()
      poster.videoPlane.geometry.dispose()
    })
    tracker.mindar.renderer.dispose()
    tracker.mindar.cssRenderer.domElement.remove()
    tracker.mindar.renderer.domElement.remove()
    stopMindARCamera(tracker.mindar)
  }, [])

  return <div ref={containerRef} className="recognition-layer" aria-hidden="true" data-recognition="three-blue-night-poster-targets" />
}

function getTargetEventDetails(mindar, poster, anchor, trackedPosterIds) {
  const states = mindar.controller?.trackingStates ?? []
  const state = states[poster.targetIndex]
  const elements = anchor.group.matrix.elements
  const poseIsVisible = Boolean(state?.showing)

  return {
    timestamp: new Date().toISOString(),
    posterId: poster.id,
    label: poster.label,
    targetIndex: poster.targetIndex,
    trackedPosterIds,
    trackingState: state ? {
      isTracking: state.isTracking,
      showing: state.showing,
      trackCount: state.trackCount,
      trackMiss: state.trackMiss,
    } : null,
    mindarTracking: states.map((targetState, targetIndex) => ({
      targetIndex,
      isTracking: targetState.isTracking,
      showing: targetState.showing,
      trackCount: targetState.trackCount,
      trackMiss: targetState.trackMiss,
    })),
    pose: poseIsVisible ? {
      x: Number(elements[12].toFixed(4)),
      y: Number(elements[13].toFixed(4)),
      z: Number(elements[14].toFixed(4)),
      targetScale: Number(Math.hypot(elements[0], elements[1], elements[2]).toFixed(4)),
    } : null,
  }
}

function stopMindARCamera(mindar) {
  mindar?.renderer?.setAnimationLoop(null)
  if (mindar?.controller && mindar.video?.srcObject) {
    mindar.stop()
    mindar.video.srcObject = null
  }
}

function IllustratedPosterScan() {
  return <svg className="poster-scan-illustration" viewBox="0 0 500 500" role="img" aria-label="Illustration of a smartphone and Blue Night poster with a subtle scan effect">
    <defs>
      <linearGradient id="poster-scan-beam" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#e5bd3c" stopOpacity="0" />
        <stop offset=".5" stopColor="#e5bd3c" stopOpacity=".23" />
        <stop offset="1" stopColor="#e5bd3c" stopOpacity="0" />
      </linearGradient>
      <clipPath id="poster-scan-clip"><path d="M83 78h208v310H83z" /></clipPath>
    </defs>

    <g className="poster-registration" fill="none" stroke="#f1efdf">
      <path d="M47 62h20M57 52v20M302 62h20M312 52v20M47 403h20M57 393v20M302 403h20M312 393v20" strokeOpacity=".3" />
      <path d="M35 233h16m274 0h16M192 42v17m0 355v17" strokeOpacity=".16" />
      <circle cx="192" cy="233" r="166" stroke="#e5bd3c" strokeDasharray="2 8" strokeOpacity=".4" />
      <circle cx="192" cy="233" r="140" stroke="#d85128" strokeDasharray="1 7" strokeOpacity=".4" />
    </g>

    <g className="scan-poster" transform="rotate(-3 187 233)">
      <path d="M89 83h205v306H89z" fill="#d85128" fillOpacity=".25" transform="translate(6 5)" />
      <path d="M83 78h208v310H83z" fill="#151619" stroke="#f1efdf" strokeOpacity=".52" />
      <path d="M83 78h208v8H83z" fill="#e5bd3c" />
      <path d="M98 104h178v1H98z" fill="#f1efdf" fillOpacity=".32" />
      <text x="100" y="153" fill="#f1efdf" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1">BLUE</text>
      <text x="100" y="190" fill="#e5bd3c" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="38" fontWeight="900" letterSpacing="-1">NIGHT</text>
      <path d="M100 202h159v1H100z" fill="#f1efdf" fillOpacity=".36" />
      <circle cx="187" cy="274" r="50" fill="#d85128" fillOpacity=".17" stroke="#e5bd3c" strokeOpacity=".8" />
      <circle cx="187" cy="274" r="35" fill="none" stroke="#f1efdf" strokeOpacity=".54" />
      <circle cx="187" cy="274" r="10" fill="#d85128" fillOpacity=".8" />
      <path d="M137 274h100M187 224v100" stroke="#f1efdf" strokeOpacity=".25" />
      <path d="M103 343h110M103 350h76" stroke="#f1efdf" strokeOpacity=".55" strokeWidth="2" />
      <text x="252" y="355" fill="#e5bd3c" fontFamily="monospace" fontSize="11" textAnchor="end">10.17</text>
      <g clipPath="url(#poster-scan-clip)" className="poster-scan-sweep">
        <rect x="77" y="76" width="220" height="56" fill="url(#poster-scan-beam)" />
        <path d="M82 105h211" stroke="#e5bd3c" strokeOpacity=".68" />
      </g>
    </g>

    <path className="scan-signal" d="M284 224 317 232" fill="none" stroke="#e5bd3c" strokeOpacity=".5" strokeDasharray="2 6" />

    <g className="scan-device-motion">
      <g className="scan-device" transform="rotate(-7 360 258)">
        <rect x="311" y="149" width="101" height="205" rx="15" fill="#090a0d" stroke="#f1efdf" strokeOpacity=".78" strokeWidth="2" />
        <rect x="318" y="165" width="87" height="173" rx="7" fill="#191a1d" stroke="#e5bd3c" strokeOpacity=".54" />
        <path d="M339 157h30" stroke="#aaa798" strokeWidth="2" strokeLinecap="round" />
        <circle cx="377" cy="157" r="2" fill="#d85128" />
        <g className="phone-preview">
          <path d="M329 187h66v123h-66z" fill="#101113" />
          <path d="M335 196h54v3h-54z" fill="#e5bd3c" />
          <text x="335" y="220" fill="#f1efdf" fontFamily="Impact, sans-serif" fontSize="18" fontWeight="900">BLUE</text>
          <text x="335" y="238" fill="#e5bd3c" fontFamily="Impact, sans-serif" fontSize="18" fontWeight="900">NIGHT</text>
          <circle cx="362" cy="270" r="17" fill="#d85128" fillOpacity=".35" stroke="#f1efdf" strokeOpacity=".6" />
          <path d="M345 270h34m-17-17v34" stroke="#f1efdf" strokeOpacity=".35" />
          <path d="M335 294h43m-43 5h27" stroke="#aaa798" strokeOpacity=".65" />
        </g>
        <path d="M337 321h48" stroke="#f1efdf" strokeOpacity=".22" />
      </g>
    </g>
  </svg>
}

function SecretTrackExperience({ active, trackedPosterIds, onForcePosterMuteChange }) {
  const [phase, setPhase] = useState('idle')
  const [blackFlash, setBlackFlash] = useState(false)
  const [songInfoVisible, setSongInfoVisible] = useState(false)
  const [playback, setPlayback] = useState('idle')
  const playbackRef = useRef(playback)
  const audioRef = useRef(null)
  const activeRef = useRef(active)
  const playRequestRef = useRef(false)
  const trackedIdsRef = useRef(trackedPosterIds)
  const timersRef = useRef({ stable: null, sequence: null, grace: null, blackFlash: null })
  const lossSettledRef = useRef(false)
  const cycleTriggeredRef = useRef(false)
  const sequenceCompleteRef = useRef(false)
  const audioHasPlayedRef = useRef(false)
  const playbackAttemptedRef = useRef(false)
  const userPausedRef = useRef(false)

  trackedIdsRef.current = trackedPosterIds
  playbackRef.current = playback

  const clearTimer = key => {
    const timer = timersRef.current[key]
    if (timer !== null) window.clearTimeout(timer)
    timersRef.current[key] = null
  }

  const clearAllTimers = () => {
    Object.keys(timersRef.current).forEach(key => clearTimer(key))
  }

  const startAudio = (fromUserGesture = false) => {
    const audio = audioRef.current
    if (!audio || playRequestRef.current || (!fromUserGesture && playbackAttemptedRef.current && !audioHasPlayedRef.current && playbackRef.current === 'blocked')) return
    playbackAttemptedRef.current = true
    playRequestRef.current = true
    setPlayback('loading')
    audio.play().catch(error => {
      playRequestRef.current = false
      if (!activeRef.current || error?.name === 'AbortError') return
      const nextState = error?.name === 'NotAllowedError' ? 'blocked' : 'error'
      console.info(`[Blue Night AR] Little Jazz playback could not start (${nextState}).`, error)
      setPlayback(nextState)
    })
  }

  const revealSongInfoThenStart = () => {
    setSongInfoVisible(true)
    if (playbackRef.current === 'blocked' || playbackRef.current === 'error') {
      setPhase('spotlight')
      return
    }
    setPhase('information')
    if (timersRef.current.sequence !== null) return
    timersRef.current.sequence = window.setTimeout(() => {
      timersRef.current.sequence = null
      if (!hasAllSecretTrackPosters(trackedIdsRef.current)) {
        setPhase('idle')
        return
      }
      setPhase('spotlight')
      startAudio()
    }, 180)
  }

  useEffect(() => {
    if (!active) return undefined

    clearAllTimers()
    activeRef.current = true
    playRequestRef.current = false
    cycleTriggeredRef.current = false
    sequenceCompleteRef.current = false
    audioHasPlayedRef.current = false
    playbackAttemptedRef.current = false
    userPausedRef.current = false
    lossSettledRef.current = false
    onForcePosterMuteChange(false)
    setPhase('idle')
    setBlackFlash(false)
    setSongInfoVisible(false)
    setPlayback('idle')

    const audio = new Audio()
    audio.preload = 'none'
    audio.src = '/audio/little-jazz-ella-fitzgerald.mp3'
    audio.loop = false
    audioRef.current = audio

    const onPlaying = () => {
      playRequestRef.current = false
      audioHasPlayedRef.current = true
      setPlayback('playing')
    }
    const onEnded = () => {
      playRequestRef.current = false
      setPlayback('ended')
      setPhase('idle')
    }
    const onError = () => setPlayback('error')

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      clearAllTimers()
      activeRef.current = false
      playRequestRef.current = false
      audio.pause()
      audio.currentTime = 0
      audio.removeAttribute('src')
      audio.load()
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      if (audioRef.current === audio) audioRef.current = null
      cycleTriggeredRef.current = false
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    const allThreeTracked = hasAllSecretTrackPosters(trackedPosterIds)
    if (allThreeTracked) {
      clearTimer('grace')
      lossSettledRef.current = false

      if (!cycleTriggeredRef.current) {
        if (timersRef.current.stable !== null) return
        timersRef.current.stable = window.setTimeout(() => {
          timersRef.current.stable = null
          if (!shouldUnlockSecretTrack(trackedIdsRef.current, cycleTriggeredRef.current)) return
          cycleTriggeredRef.current = true
          onForcePosterMuteChange(true)
          setBlackFlash(true)
          timersRef.current.blackFlash = window.setTimeout(() => {
            timersRef.current.blackFlash = null
            setBlackFlash(false)
          }, 1300)
          console.info('[Blue Night AR] Secret Track unlocked for all three distinct targets.', {
            timestamp: new Date().toISOString(),
            targetIds: [...trackedIdsRef.current],
          })
          setPhase('unlock')
          timersRef.current.sequence = window.setTimeout(() => {
            timersRef.current.sequence = null
            sequenceCompleteRef.current = true
            if (hasAllSecretTrackPosters(trackedIdsRef.current)) revealSongInfoThenStart()
            else setPhase('idle')
          }, 1300)
        }, 800)
        return
      }

      if (sequenceCompleteRef.current && !audioHasPlayedRef.current) {
        if (playbackAttemptedRef.current) setPhase('spotlight')
        else revealSongInfoThenStart()
      } else if (audioHasPlayedRef.current && audioRef.current?.paused && !userPausedRef.current && playback !== 'ended') {
        setPhase('spotlight')
        startAudio()
      }
      return
    }

    clearTimer('stable')
    if (!cycleTriggeredRef.current || timersRef.current.grace !== null || (lossSettledRef.current && trackedPosterIds.length > 0)) return

    timersRef.current.grace = window.setTimeout(() => {
      timersRef.current.grace = null
      if (hasAllSecretTrackPosters(trackedIdsRef.current)) return

      lossSettledRef.current = true
      audioRef.current?.pause()
      onForcePosterMuteChange(false)
      setPhase('idle')

      if (trackedIdsRef.current.length === 0) {
        clearTimer('sequence')
        cycleTriggeredRef.current = false
        sequenceCompleteRef.current = false
        lossSettledRef.current = false
        audioHasPlayedRef.current = false
        playbackAttemptedRef.current = false
        userPausedRef.current = false
        if (audioRef.current) audioRef.current.currentTime = 0
        setBlackFlash(false)
        setSongInfoVisible(false)
        setPlayback('idle')
      } else if (audioHasPlayedRef.current) {
        setPlayback('paused')
      }
    }, 1600)
  }, [active, trackedPosterIds, playback])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playRequestRef.current || playbackRef.current === 'ended') return
    if (!audio.paused) {
      userPausedRef.current = true
      audio.pause()
      setPlayback('paused')
      return
    }
    userPausedRef.current = false
    startAudio(true)
  }

  return <>
    {blackFlash && <div className="secret-track-black-flash" aria-hidden="true" />}
    {phase === 'unlock' && <div className="secret-track-unlock" role="status">SECRET TRACK UNLOCKED.</div>}
    {songInfoVisible && <aside className="secret-track-now-playing" aria-label="Now playing: Ella Fitzgerald, Little Jazz">
      <strong>Ella Fitzgerald</strong>
      <em>Little Jazz</em>
    </aside>}
    {phase === 'spotlight' && <aside className="secret-track-spotlight" aria-label="Ella Fitzgerald artist introduction">
      <div className="secret-track-heading">
        <div>
          <span className="secret-track-kicker"><i /> SECRET TRACK</span>
          <h2>ELLA FITZGERALD</h2>
        </div>
        <button className="secret-track-control" type="button" onClick={togglePlayback} disabled={playback === 'loading' || playback === 'ended'}>
          {playback === 'playing' ? 'PAUSE' : playback === 'loading' ? 'LOADING' : playback === 'blocked' ? 'TAP TO PLAY' : playback === 'error' ? 'RETRY AUDIO' : playback === 'ended' ? 'TRACK ENDED' : 'PLAY LITTLE JAZZ'}
        </button>
      </div>
      <p className="secret-track-subtitle">爵士樂壇的「歌壇第一夫人」</p>
      <div className="secret-track-marquee" aria-label="Ella Fitzgerald 是二十世紀最具影響力的爵士歌手之一。她以清澈而富有表現力的嗓音、靈活的節奏感，以及精湛的擬聲即興演唱聞名。她將人聲化為如樂器般自由的表現媒介，拓展了爵士演唱的可能性，並在爵士樂史上留下深遠的影響。">
        <div className="secret-track-marquee-track" aria-hidden="true">
          <span>「Ella Fitzgerald 是二十世紀最具影響力的爵士歌手之一。她以清澈而富有表現力的嗓音、靈活的節奏感，以及精湛的擬聲即興演唱聞名。她將人聲化為如樂器般自由的表現媒介，拓展了爵士演唱的可能性，並在爵士樂史上留下深遠的影響。」</span>
          <span>「Ella Fitzgerald 是二十世紀最具影響力的爵士歌手之一。她以清澈而富有表現力的嗓音、靈活的節奏感，以及精湛的擬聲即興演唱聞名。她將人聲化為如樂器般自由的表現媒介，拓展了爵士演唱的可能性，並在爵士樂史上留下深遠的影響。」</span>
        </div>
      </div>
    </aside>}
  </>
}

function ArPosterPage() {
  const [scannerState, setScannerState] = useState('intro')
  const [cameraMessage, setCameraMessage] = useState('')
  const [trackedPosterIds, setTrackedPosterIds] = useState([])
  const [forceVideoMute, setForceVideoMute] = useState(false)

  const startScanning = () => {
    if (scannerState === 'requesting') return
    setCameraMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera access is unavailable in this browser. Open this page over HTTPS and try again.')
      setScannerState('error')
      return
    }
    setScannerState('requesting')
  }

  const stopScanning = () => {
    setTrackedPosterIds([])
    setForceVideoMute(false)
    setScannerState('intro')
  }

  const isTracking = scannerState === 'requesting' || scannerState === 'camera'
  const handleTrackedTargetsChange = ids => setTrackedPosterIds([...new Set(ids)])
  const trackedPosterNames = posterTargets
    .filter(poster => trackedPosterIds.includes(poster.id))
    .map(poster => poster.label)
    .join(' · ')

  return <>
  {isTracking && <main className="camera-screen">
    <PosterRecognitionLayer
      active={isTracking}
      onReady={() => setScannerState('camera')}
        onTargetsChange={handleTrackedTargetsChange}
        onError={message => { setCameraMessage(message); setForceVideoMute(false); setScannerState('error') }}
        trackedPosterIds={trackedPosterIds}
        forceVideoMute={forceVideoMute}
    />
      <SecretTrackExperience
        active={isTracking}
        trackedPosterIds={trackedPosterIds}
        onForcePosterMuteChange={setForceVideoMute}
      />
    <header className="camera-topline">
      <a className="camera-exit" href="/ar-poster" onClick={event => { event.preventDefault(); stopScanning() }}>← BACK</a>
      <span>AR POSTER <i>·</i> LIVE CAMERA</span>
      <span className="camera-live"><i /> LIVE</span>
    </header>
    <div className="camera-instruction">Point your camera at a Blue Night poster.</div>
    <div className="scan-area" aria-hidden="true">
      <span className="scan-corner corner-tl" /><span className="scan-corner corner-tr" />
      <span className="scan-corner corner-bl" /><span className="scan-corner corner-br" />
      <i className="scan-sweep" />
      <span className="scan-center"><i /></span>
    </div>
    <footer className="camera-bottomline">
      <span>{trackedPosterNames || 'SCANNING / 03 TARGETS'}</span><i />
      <span>{trackedPosterIds.length === posterTargets.length ? 'ALL VIDEOS / MUTED' : trackedPosterIds.length ? 'ORIGINAL AUDIO / ON' : 'IMAGE TARGETS / 01—03'}</span>
    </footer>
  </main>}

  {scannerState !== 'requesting' && scannerState !== 'camera' && <main className="ar-page">
    <header className="ar-header">
      <a className="ar-return" href="/" onClick={() => window.sessionStorage.setItem('blue-night-return-to-portal', '1')}>← BLUE NIGHT</a>
      <span className="ar-edition">AR POSTER <i>·</i> CAMERA STUDY</span>
      <span className="ar-count">01—03</span>
    </header>
    <section className="ar-landing" aria-labelledby="ar-title">
      <div className="ar-art" aria-hidden="true">
        <IllustratedPosterScan />
        <span className="ar-art-label">IMAGE / 01</span>
      </div>
      <div className="ar-copy">
        <p className="ar-kicker"><i /> BLUE NIGHT / EXTENDED SPACE</p>
        <h1 id="ar-title">AR<br /><em>POSTER</em></h1>
        <p className="ar-lead">BRING THE POSTERS<br />TO LIFE.</p>
        <p className="ar-description">對準海報，讓音樂甦醒</p>
        {scannerState === 'requesting'
          ? <button className="start-scan" disabled><span>OPENING CAMERA</span><i>···</i></button>
          : <button className="start-scan" onClick={startScanning}><span>START SCANNING</span><i>↗</i></button>}
        {scannerState === 'error' && <p className="camera-error" role="alert">{cameraMessage}</p>}
        <p className="ar-footnote">CAMERA ACCESS IS ONLY USED FOR THIS LIVE VIEW.</p>
      </div>
    </section>
    <footer className="ar-footer"><span>BLUE NIGHT / KAOHSIUNG</span><span>POSTER SCANNER — PREVIEW</span></footer>
  </main>}
  </>
}

const ResilientStandbyVideo = React.forwardRef(function ResilientStandbyVideo({ onLoadedMetadata, onTimeUpdate }, forwardedRef) {
  const localVideoRef = useRef(null)
  const [hasDecodedFrame, setHasDecodedFrame] = useState(false)

  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return undefined

    let disposed = false
    let retryCount = 0
    let retryTimer = 0
    let playPending = false
    let lastPlayFailed = false
    const maxRetries = 2

    const markFrameReady = () => {
      if (!disposed && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setHasDecodedFrame(true)
    }

    const attemptPlay = () => {
      if (disposed || document.hidden || (lastPlayFailed && retryCount >= maxRetries) || playPending) return
      video.muted = true
      video.defaultMuted = true
      video.playsInline = true

      try {
        const playPromise = video.play()
        if (!playPromise || typeof playPromise.then !== 'function') return
        playPending = true
        playPromise.then(() => {
          playPending = false
          lastPlayFailed = false
          markFrameReady()
        }).catch(() => {
          playPending = false
          lastPlayFailed = true
          scheduleRetry()
        })
      } catch {
        lastPlayFailed = true
        scheduleRetry()
      }
    }

    const scheduleRetry = () => {
      if (disposed || retryTimer || retryCount >= maxRetries) return
      const delay = retryCount === 0 ? 400 : 1200
      retryTimer = window.setTimeout(() => {
        retryTimer = 0
        if (disposed) return
        if (document.hidden) return
        retryCount += 1
        lastPlayFailed = false
        try {
          video.load()
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) attemptPlay()
        } catch {
          lastPlayFailed = true
          scheduleRetry()
        }
      }, delay)
    }

    const handleError = () => {
      if (disposed) return
      setHasDecodedFrame(false)
      lastPlayFailed = true
      scheduleRetry()
    }
    const handleCanPlay = () => {
      markFrameReady()
      attemptPlay()
    }
    const handlePlaying = () => {
      playPending = false
      markFrameReady()
    }
    const handleVisibility = () => {
      if (!document.hidden && video.paused) attemptPlay()
    }

    video.addEventListener('loadeddata', markFrameReady)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)
    document.addEventListener('visibilitychange', handleVisibility)
    markFrameReady()
    attemptPlay()

    return () => {
      disposed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      video.removeEventListener('loadeddata', markFrameReady)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
      document.removeEventListener('visibilitychange', handleVisibility)
      video.pause()
    }
  }, [])

  const assignRef = video => {
    localVideoRef.current = video
    if (typeof forwardedRef === 'function') forwardedRef(video)
    else if (forwardedRef) forwardedRef.current = video
  }

  return <video
    ref={assignRef}
    className="standby-video"
    src="/blue-night-standby.mp4"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    aria-hidden="true"
    style={{ opacity: hasDecodedFrame ? 1 : 0, transition: 'opacity .25s ease' }}
    onLoadedMetadata={onLoadedMetadata}
    onTimeUpdate={onTimeUpdate}
  />
})

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/ar-poster') return <ArPosterPage />
  const [phase, setPhase] = useState(() => {
    const returningFromAr = window.sessionStorage.getItem('blue-night-return-to-portal') === '1'
    window.sessionStorage.removeItem('blue-night-return-to-portal')
    return returningFromAr || window.location.hash === '#portal' ? 'portal' : 'opening'
  })
  const [promptVisible, setPromptVisible] = useState(false)
  const [standby, setStandby] = useState(false)
  const [standbyLeaving, setStandbyLeaving] = useState(false)
  const videoRef = useRef(null)
  const idleTimerRef = useRef(null)
  const standbyVideoRef = useRef(null)
  const standbyActiveRef = useRef(false)
  const standbyLeavingRef = useRef(false)
  const restartIdleTimerRef = useRef(null)
  const leaveStandbyRef = useRef(null)

  const enterStandby = () => {
    if (standbyActiveRef.current) return
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = null
    standbyActiveRef.current = true
    standbyLeavingRef.current = false
    setStandbyLeaving(false)
    setStandby(true)
  }

  const enterStandbyManually = () => {
    // Count the staff tap as normal touch activity before entering the shared standby state.
    restartIdleTimerRef.current?.()
    enterStandby()
  }

  useEffect(() => {
    if (phase !== 'portal') return undefined

    const resetIdleTimer = () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
      if (standbyActiveRef.current) {
        idleTimerRef.current = null
        return
      }
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null
        enterStandby()
      }, IDLE_TIMEOUT_MS)
    }
    restartIdleTimerRef.current = resetIdleTimer
    const handleActivity = event => {
      if (standbyActiveRef.current) {
        if (['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'touchcancel', 'click', 'keydown', 'keyup'].includes(event.type)) {
          leaveStandbyRef.current?.()
        }
        return
      }
      resetIdleTimer()
    }
    // Capture input at the window so activity anywhere, including blank space
    // and controls that stop propagation, restarts this one idle countdown.
    const activityEvents = [
      'pointerdown', 'pointerup', 'pointermove',
      'mousedown', 'mouseup', 'mousemove',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'wheel', 'scroll', 'keydown', 'keyup', 'input', 'click',
    ]

    resetIdleTimer()
    activityEvents.forEach(eventName => window.addEventListener(eventName, handleActivity, { passive: true, capture: true }))
    return () => {
      activityEvents.forEach(eventName => window.removeEventListener(eventName, handleActivity, true))
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
      restartIdleTimerRef.current = null
    }
  }, [phase])

  useEffect(() => {
    if (!standby) return undefined
    const rootOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = rootOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [standby])

  const updatePrompt = () => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const revealAt = Math.min(5, video.duration * 0.12)
    setPromptVisible(video.duration - video.currentTime <= revealAt)
  }

  const enter = () => {
    if (phase !== 'opening') return
    setPhase('transitioning')
    videoRef.current?.pause()
  }

  const leaveStandby = () => {
    if (!standbyActiveRef.current || standbyLeavingRef.current) return
    standbyLeavingRef.current = true
    standbyVideoRef.current?.pause()
    setStandbyLeaving(true)
  }
  leaveStandbyRef.current = leaveStandby

  return <div className={`experience ${phase === 'portal' ? 'is-portal' : 'is-opening'}${standby ? ' is-standby' : ''}`}>
    <PortalHome inactive={phase !== 'portal' || standby} onManualStandby={enterStandbyManually} />
    {phase !== 'portal' && <button
      className={`opening-screen ${phase === 'transitioning' ? 'is-leaving' : ''}`}
      type="button"
      aria-label="Tap to enter Blue Night"
      onClick={enter}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === 'iris-close') setPhase('portal')
      }}
    >
      <ResilientStandbyVideo
        ref={videoRef}
        onLoadedMetadata={updatePrompt}
        onTimeUpdate={updatePrompt}
      />
      <span className={`tap-prompt ${promptVisible ? 'is-visible' : ''}`} aria-hidden="true"><i />TAP TO ENTER</span>
    </button>}
    {standby && <button
      className={`idle-screen ${standbyLeaving ? 'is-leaving' : ''}`}
      type="button"
      aria-label="Exit Blue Night standby mode"
      onClick={leaveStandby}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === 'standby-release') {
          standbyActiveRef.current = false
          standbyLeavingRef.current = false
          setStandby(false)
          setStandbyLeaving(false)
          restartIdleTimerRef.current?.()
        }
      }}
    >
      <ResilientStandbyVideo ref={standbyVideoRef} />
      <span className="idle-prompt" aria-hidden="true"><i />TAP TO ENTER</span>
    </button>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
