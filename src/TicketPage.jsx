import React, { useEffect, useRef, useState } from 'react'
import './ticket.css'

const ticketEditions = [
  { id: 'blue-rock', number: '01', title: 'BLUE ROCK', file: '/tickets/transparent/blue-rock.png', subtitle: 'HAMMOND / HEAVY SOUL', accent: '#d85128', front: [348, 444, 1188, 2544], back: [1324, 444, 2152, 2544] },
  { id: 'funk', number: '02', title: 'FUNK', file: '/tickets/transparent/funk.png', subtitle: 'POCKET / GROOVE', accent: '#e5bd3c', front: [168, 576, 1116, 2928], back: [1384, 576, 2308, 2928] },
  { id: 'fusion', number: '03', title: 'FUSION', file: '/tickets/transparent/fusion.png', subtitle: 'ODD TIME / OPEN FORM', accent: '#8992b6', front: [384, 552, 1200, 2604], back: [1384, 552, 2200, 2604] },
  { id: 'rnb', number: '04', title: 'R&B', file: '/tickets/transparent/rnb.png', subtitle: 'RHYTHM / BLUES', accent: '#d9d3c2', front: [204, 576, 1152, 2916], back: [1336, 576, 2272, 2916] },
]

const SOURCE_WIDTH = 2480
const SOURCE_HEIGHT = 3508
// Preserve the supplied ticket-stub proportions while sourcing its pixels
// from each full-resolution ticket image below.
const STUB_ART_ASPECT = 945 / 602
function ticketCropStyle(edition) {
  const [left, top, right, bottom] = edition.front
  const cropHeight = bottom - top
  const heightFraction = cropHeight / SOURCE_HEIGHT
  const aspect = ((right - left) / cropHeight)
  const renderedWidth = (SOURCE_WIDTH / SOURCE_HEIGHT / heightFraction) / aspect
  const backAspect = (edition.back[2] - edition.back[0]) / cropHeight
  const frontStubFraction = aspect / STUB_ART_ASPECT
  const backStubFraction = backAspect / STUB_ART_ASPECT
  const frontSeam = 1 - frontStubFraction
  const backSeam = 1 - backStubFraction

  return {
    '--ticket-ratio': aspect,
    '--ticket-sheet-height': `${100 / heightFraction}%`,
    '--ticket-source-y': `${(top / SOURCE_HEIGHT / (1 - heightFraction)) * 100}%`,
    '--front-x': `${((edition.front[0] / SOURCE_WIDTH * renderedWidth) / (renderedWidth - 1)) * 100}%`,
    '--back-x': `${((edition.back[0] / SOURCE_WIDTH * renderedWidth) / (renderedWidth - 1)) * 100}%`,
    '--ticket-main-height': `${frontSeam * 100}%`,
    '--ticket-front-seam-y': `${frontSeam * 100}%`,
    '--ticket-back-seam-y': `${backSeam * 100}%`,
    '--ticket-stub-top': `${frontSeam * 100}%`,
  }
}

function TicketFace({ edition, side }) {
  return <span
    className={`ticket-print ticket-print-${side}`}
    style={{ backgroundImage: `url("${edition.file}")` }}
    aria-hidden="true"
  />
}

function TicketFacePair({ edition, className }) {
  return <span className={className}>
    <TicketFace edition={edition} side="front" />
    <TicketFace edition={edition} side="front-stub" />
    <TicketFace edition={edition} side="back" />
  </span>
}

const STITCH_REFERENCE_WIDTH = 1892
const STITCH_STUB_ASPECT = 945 / 602
const stitchPieces = [
  { id: 'fusion', title: 'FUSION', src: '/tickets/stubs/transparent/fusion.png', x: 241, y: 251, width: 712, height: 461, rotation: 0, delay: 0 },
  { id: 'rnb', title: 'R&B', src: '/tickets/stubs/transparent/rnb.png', x: 952, y: 0, width: 462, height: 711, rotation: 90, delay: 120 },
  { id: 'blue-rock', title: 'BLUE ROCK', src: '/tickets/stubs/transparent/blue-rock.png', x: 492, y: 711, width: 462, height: 705, rotation: 90, delay: 240 },
  { id: 'funk', title: 'FUNK', src: '/tickets/stubs/transparent/funk.png', x: 952, y: 711, width: 699, height: 462, rotation: 0, delay: 360 },
]

function TicketStitchExperience({ origin, onClose }) {
  const canvasRef = useRef(null)
  const loadedAssets = useRef(new Set())
  const isMounted = useRef(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [canvas, setCanvas] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const [isAssembled, setIsAssembled] = useState(false)

  const assetReady = key => {
    if (!isMounted.current || loadedAssets.current.has(key)) return
    loadedAssets.current.add(key)
    setLoadedCount(loadedAssets.current.size)
  }

  useEffect(() => {
    if (loadedCount < stitchPieces.length + 1 || !canvasRef.current) return undefined
    let frameTwo

    const updateCanvas = () => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) setCanvas({ left: rect.left, top: rect.top, width: rect.width })
    }
    updateCanvas()
    window.addEventListener('resize', updateCanvas)
    const frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => setIsMoving(true))
    })
    const settleTimer = window.setTimeout(() => setIsAssembled(true), 2200)
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updateCanvas)
      window.removeEventListener('keydown', onKeyDown)
      window.cancelAnimationFrame(frameOne)
      if (frameTwo) window.cancelAnimationFrame(frameTwo)
      window.clearTimeout(settleTimer)
    }
  }, [loadedCount, onClose])

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const getPieceStyle = piece => {
    if (!canvas) return undefined
    const scale = canvas.width / STITCH_REFERENCE_WIDTH
    const startWidth = origin.width
    const startHeight = startWidth / STITCH_STUB_ASPECT
    const startX = origin.left - canvas.left
    const startY = origin.top - canvas.top
    const targetWidth = (piece.rotation ? piece.height : piece.width) * scale
    const targetHeight = targetWidth / STITCH_STUB_ASPECT
    const visualCenterX = (piece.x + piece.width / 2) * scale
    const visualCenterY = (piece.y + piece.height / 2) * scale
    const targetX = visualCenterX - targetWidth / 2
    const targetY = visualCenterY - targetHeight / 2
    const zoom = targetWidth / startWidth

    return {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${startWidth}px`,
      height: `${startHeight}px`,
      '--piece-transform': `translate3d(${targetX - startX}px,${targetY - startY}px,0) scale(${zoom}) rotate(${piece.rotation}deg)`,
      '--piece-delay': `${piece.delay}ms`,
    }
  }

  const finishAssembly = event => {
    if (event.target === event.currentTarget && event.propertyName === 'transform') setIsAssembled(true)
  }

  return <div
    className="ticket-stitch-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Four Blue Night ticket stubs assembled artwork"
    onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
  >
    <div className="ticket-stitch-canvas" ref={canvasRef}>
      {stitchPieces.map(piece => <div
        className={`ticket-stitch-piece ${isMoving ? 'is-moving' : ''} ${isAssembled ? 'is-hidden' : ''}`}
        key={piece.id}
        style={getPieceStyle(piece)}
        onTransitionEnd={piece.id === 'funk' ? finishAssembly : undefined}
        aria-hidden="true"
      >
        <img src={piece.src} alt="" draggable="false" onLoad={() => assetReady(piece.id)} onError={() => assetReady(piece.id)} />
      </div>)}
      <img
        className={`ticket-stitch-reference ${isAssembled ? 'is-visible' : ''}`}
        src="/tickets/stitch-reference.png"
        alt="Four Blue Night ticket stubs assembled around a vinyl record"
        onLoad={() => assetReady('reference')}
        onError={() => assetReady('reference')}
      />
    </div>
    <button className="ticket-stitch-close" type="button" onClick={onClose}>CLOSE <span aria-hidden="true">×</span></button>
    {!isMoving && <span className="ticket-stitch-loading" aria-live="polite">PREPARING THE FOUR FREQUENCIES</span>}
  </div>
}

export default function TicketPage() {
  const [editionId, setEditionId] = useState(ticketEditions[0].id)
  const [isBack, setIsBack] = useState(false)
  const [isTorn, setIsTorn] = useState(false)
  const [isTearing, setIsTearing] = useState(false)
  const [zoomActive, setZoomActive] = useState(false)
  const [zoomPoint, setZoomPoint] = useState(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [stitchOrigin, setStitchOrigin] = useState(null)
  const edition = ticketEditions.find(item => item.id === editionId) || ticketEditions[0]

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'TICKET — BLUE NIGHT'
    window.scrollTo(0, 0)
    return () => { document.title = previousTitle }
  }, [])

  const chooseEdition = id => {
    if (id === editionId) return
    setEditionId(id)
    setIsBack(false)
    setIsTorn(false)
    setIsTearing(false)
    setIsFlipping(false)
    setZoomActive(false)
    setZoomPoint(null)
  }
  const flipTicket = () => {
    if (isTearing || isFlipping) return
    setZoomActive(false)
    setZoomPoint(null)
    setIsFlipping(true)
    setIsBack(value => !value)
  }
  const trackZoom = event => {
    if (event.pointerType !== 'mouse' || !zoomActive || isTorn || isFlipping) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const screenX = (event.clientX - bounds.left) / bounds.width
    const screenY = (event.clientY - bounds.top) / bounds.height
    const width = event.currentTarget.offsetWidth
    const height = event.currentTarget.offsetHeight
    // The back ticket is rotated -90deg around its center. Convert the
    // pointer from the rotated bounding box back into the ticket's local
    // coordinates: local X is reversed screen Y, and local Y is screen X.
    const localX = isBack ? 1 - screenY : screenX
    const localY = isBack ? screenX : screenY
    const x = Math.max(0, Math.min(1, localX))
    const y = Math.max(0, Math.min(1, localY))
    setZoomPoint({ x, y, width, height })
  }
  const handleTicketTransitionEnd = event => {
    if (event.target === event.currentTarget && event.propertyName === 'transform') {
      setIsFlipping(false)
    }
  }
  const handleTicketClick = event => {
    if (!isBack && !isTorn && !isTearing && !isFlipping) {
      const bounds = event.currentTarget.getBoundingClientRect()
      const frontSeam = 1 - (((edition.front[2] - edition.front[0]) / (edition.front[3] - edition.front[1])) / STUB_ART_ASPECT)
      const pointerY = (event.clientY - bounds.top) / bounds.height
      if (pointerY >= frontSeam) {
        setZoomActive(false)
        setZoomPoint(null)
        setStitchOrigin({
          left: bounds.left,
          top: bounds.top + frontSeam * bounds.height,
          width: bounds.width,
          height: bounds.height * (1 - frontSeam),
        })
        return
      }
    }
    flipTicket()
  }

  return <main className="ticket-page" style={{ '--ticket-accent': edition.accent }}>
    <header className="ticket-masthead">
      <a className="ticket-return" href="/#portal">← BLUE NIGHT</a>
      <span className="ticket-masthead-title">TICKET <i>·</i> OBJECT STUDY</span>
      <span className="ticket-masthead-location">KAOHSIUNG / 2026</span>
    </header>

    <section className="ticket-intro" aria-labelledby="ticket-title">
      <div>
        <p className="ticket-eyebrow"><i /> FOUR FREQUENCIES / ONE NIGHT</p>
        <h1 id="ticket-title">TICKET <span>ARCHIVE</span></h1>
      </div>
    </section>

    <nav className="ticket-editions" aria-label="Choose a ticket design">
      {ticketEditions.map(item => <button
        className={`ticket-edition ${item.id === edition.id ? 'is-selected' : ''}`}
        key={item.id}
        type="button"
        aria-pressed={item.id === edition.id}
        onClick={() => chooseEdition(item.id)}
        style={{ '--edition-accent': item.accent }}
      >
        <span>{item.number}</span><strong>{item.title}</strong><i aria-hidden="true" />
      </button>)}
    </nav>

    <section className={`ticket-showcase ${isTorn ? 'is-torn' : ''}`} aria-label={`${edition.title} ticket artwork`}>
      <div className="ticket-stage">
        <div className="ticket-stage-index"><span>{edition.number} / FOUR</span><span>FRONT ↔ BACK</span></div>
        <div className="ticket-installation-record" aria-hidden="true"><i /></div>
        <button
          className={`ticket-zoom-toggle ${zoomActive ? 'is-active' : ''}`}
          type="button"
          aria-label={zoomActive ? 'Turn off ticket detail magnifier' : 'Turn on ticket detail magnifier'}
          aria-pressed={zoomActive}
          disabled={isFlipping || isTearing || isTorn}
          onClick={() => {
            setZoomActive(value => !value)
            setZoomPoint(null)
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4" /><path d="m15.5 15.5 5 5" /></svg>
          <span>{zoomActive ? 'ZOOM ON' : 'DETAIL ZOOM'}</span>
        </button>
        <button
          className={`ticket-composition ${isBack ? 'is-back' : ''} ${isTorn ? 'is-torn' : ''} ${isFlipping ? 'is-flipping' : ''}`}
          style={{ ...ticketCropStyle(edition), cursor: zoomActive && !isFlipping && !isTorn ? 'zoom-in' : undefined }}
          type="button"
          onClick={handleTicketClick}
          onPointerMove={trackZoom}
          onPointerLeave={() => setZoomPoint(null)}
          onTransitionEnd={handleTicketTransitionEnd}
          aria-label={`${edition.title} ticket. Currently showing ${isBack ? 'back' : 'front'}. Flip to ${isBack ? 'front' : 'back'}.`}
          aria-pressed={isBack}
          key={edition.id}
        >
          <TicketFacePair edition={edition} className="ticket-full-flip" />
          <span
            className={`ticket-zoom-layer ${zoomActive && zoomPoint && !isTorn && !isFlipping ? 'is-active' : ''} ${isBack ? 'is-back' : ''}`}
            style={zoomPoint ? {
              '--zoom-x': `${zoomPoint.x * 100}%`,
              '--zoom-y': `${zoomPoint.y * 100}%`,
              '--zoom-left': `${zoomPoint.x * 100}%`,
              '--zoom-top': `${zoomPoint.y * 100}%`,
              '--zoom-x-px': `${zoomPoint.x * zoomPoint.width}px`,
              '--zoom-y-px': `${zoomPoint.y * zoomPoint.height}px`,
              '--ticket-card-width': `${zoomPoint.width}px`,
              '--ticket-card-height': `${zoomPoint.height}px`,
            } : undefined}
            aria-hidden="true"
          >
            <span className="ticket-zoom-window">
              <TicketFacePair edition={edition} className={`ticket-zoom-content ${isBack ? 'is-back' : ''}`} />
            </span>
          </span>
          <span className="ticket-torn-layer" aria-hidden="true">
            <span className="ticket-cut-piece ticket-cut-main">
              <TicketFacePair edition={edition} className="ticket-piece-flip" />
            </span>
            <span
              className="ticket-cut-piece ticket-cut-stub"
              onAnimationEnd={event => {
                if (event.target === event.currentTarget) setIsTearing(false)
              }}
            >
              <TicketFacePair edition={edition} className="ticket-piece-flip" />
            </span>
          </span>
        </button>
        <div className="ticket-stage-footer">
          <button
            className="ticket-flip-hint"
            type="button"
            onClick={event => {
              event.stopPropagation()
              flipTicket()
            }}
            aria-label={`Flip ${edition.title} ticket to the ${isBack ? 'front' : 'back'}`}
          >
            {isTorn ? 'DETACHED / ORIGINAL STOCK' : 'CLICK TO FLIP'}
          </button>
          <span>{isBack ? 'BACK / B' : 'FRONT / A'}</span>
        </div>
      </div>

      <aside className="ticket-details" aria-label="Ticket information and controls">
        <span className="ticket-detail-index">{edition.number} / EDITION</span>
        <h2>{edition.title}</h2>
        <p className="ticket-detail-subtitle">{edition.subtitle}</p>
        <div className="ticket-detail-rule" />
        <div className="ticket-price-row"><span>PRICE / ENTRY</span><strong>NT$ <i>—</i></strong></div>
        <p className="ticket-sale-note is-sold-out"><i /> TICKET SALES / SOLD OUT</p>
        <button
          className="ticket-tear-button"
          type="button"
          onClick={() => {
            if (isTorn) {
              setIsTorn(false)
              setIsBack(false)
              setIsTearing(false)
            } else {
              setZoomActive(false)
              setZoomPoint(null)
              setIsBack(false)
              setIsTearing(true)
              setIsTorn(true)
            }
          }}
          aria-pressed={isTorn}
        >
          <span>{isTorn ? 'REASSEMBLE TICKET' : '探索票券'}</span>
          <i aria-hidden="true">{isTorn ? '↶' : '↗'}</i>
        </button>
        <button className="ticket-reserve is-sold-out" type="button" disabled aria-label="Tickets sold out">
          SOLD OUT
        </button>
        <p className="ticket-detail-foot">10.17.2026 <span>·</span> BLUE NIGHT UNDERGROUND SPACE</p>
      </aside>
    </section>

    <section className="ticket-concept" aria-labelledby="ticket-concept-title">
      <div className="ticket-concept-heading">
        <h2 id="ticket-concept-title">TICKET DESIGN CONCEPT</h2>
      </div>
      <span className="ticket-concept-mark" aria-hidden="true">BN—004</span>
    </section>

    <footer className="ticket-footer"><span>BLUE NIGHT / KAOHSIUNG</span><span>PRINTED MUSIC CULTURE</span><a href="/#portal">← RETURN TO MAIN EXPERIENCE</a></footer>
    {stitchOrigin && <TicketStitchExperience origin={stitchOrigin} onClose={() => setStitchOrigin(null)} />}
  </main>
}
