import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

// Adjust this one value to change the homepage idle delay.
const IDLE_TIMEOUT_MS = 15_000

// Connect future destinations by replacing the empty href values.
const entrances = [
  { id: '01', name: 'AR POSTER', detail: 'SCAN', href: '/ar-poster', state: 'SCANNER PREVIEW' },
  { id: '02', name: 'NFC', detail: 'TAP IN', href: 'https://blue-night-one.vercel.app/', state: 'AVAILABLE' },
  { id: '03', name: 'TICKETS', detail: 'ENTRY', href: '', state: 'COMING SOON' },
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

function PosterRecognitionLayer() {
  // Future hook: connect poster image tracking here. No frames are analysed yet.
  return <div className="recognition-layer" aria-hidden="true" data-recognition="not-connected" />
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

function ArPosterPage() {
  const videoRef = useRef(null)
  const [scannerState, setScannerState] = useState('intro')
  const [stream, setStream] = useState(null)
  const [cameraMessage, setCameraMessage] = useState('')

  React.useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    videoRef.current.play().catch(() => {})
    return () => stream.getTracks().forEach(track => track.stop())
  }, [stream])

  const startScanning = async () => {
    if (scannerState === 'requesting') return
    setCameraMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera access is unavailable in this browser. Open this page over HTTPS and try again.')
      setScannerState('error')
      return
    }
    setScannerState('requesting')
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setStream(nextStream)
      setScannerState('camera')
    } catch (error) {
      const messages = {
        NotAllowedError: 'Camera access was not granted. Allow camera access in your browser settings, then try again.',
        NotFoundError: 'No camera was found on this device.',
        NotReadableError: 'The camera is busy in another app. Close it there and try again.',
      }
      setCameraMessage(messages[error?.name] || 'The camera could not be opened. Check its permissions and try again.')
      setScannerState('error')
    }
  }

  const stopScanning = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setScannerState('intro')
  }

  if (scannerState === 'camera' && stream) return <main className="camera-screen">
    <video ref={videoRef} className="camera-feed" autoPlay muted playsInline aria-label="Live rear camera view" />
    <PosterRecognitionLayer />
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
      <span>CAMERA READY</span><i /><span>POSTER TRACKING NOT CONNECTED</span>
    </footer>
  </main>

  return <main className="ar-page">
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
        <p className="ar-description">Point your camera at a<br className="desktop-break" /> Blue Night poster.</p>
        {scannerState === 'requesting'
          ? <button className="start-scan" disabled><span>OPENING CAMERA</span><i>···</i></button>
          : <button className="start-scan" onClick={startScanning}><span>START SCANNING</span><i>↗</i></button>}
        {scannerState === 'error' && <p className="camera-error" role="alert">{cameraMessage}</p>}
        <p className="ar-footnote">CAMERA ACCESS IS ONLY USED FOR THIS LIVE VIEW.</p>
      </div>
    </section>
    <footer className="ar-footer"><span>BLUE NIGHT / KAOHSIUNG</span><span>POSTER SCANNER — PREVIEW</span></footer>
  </main>
}

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/ar-poster') return <ArPosterPage />
  const [phase, setPhase] = useState(() => {
    const returningFromAr = window.sessionStorage.getItem('blue-night-return-to-portal') === '1'
    window.sessionStorage.removeItem('blue-night-return-to-portal')
    return returningFromAr ? 'portal' : 'opening'
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
    const video = standbyVideoRef.current
    if (!standby || !video) return undefined
    video.currentTime = 0
    video.play().catch(() => {})
    return () => {
      video.pause()
      video.currentTime = 0
    }
  }, [standby])

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

  return <div className={`experience ${phase === 'portal' ? 'is-portal' : 'is-opening'}`}>
    <PortalHome inactive={phase !== 'portal'} onManualStandby={enterStandbyManually} />
    {phase !== 'portal' && <button
      className={`opening-screen ${phase === 'transitioning' ? 'is-leaving' : ''}`}
      type="button"
      aria-label="Tap to enter Blue Night"
      onClick={enter}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === 'iris-close') setPhase('portal')
      }}
    >
      <video
        ref={videoRef}
        className="standby-video"
        src="/blue-night-standby.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
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
      <video ref={standbyVideoRef} className="standby-video" src="/blue-night-standby.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <span className="idle-prompt" aria-hidden="true"><i />TAP TO ENTER</span>
    </button>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
