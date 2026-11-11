import React, { useEffect, useState } from 'react'
import './ticket.css'

const ticketEditions = [
  { id: 'blue-rock', number: '01', title: 'BLUE ROCK', file: '/tickets/blue-rock.jpg', subtitle: 'HAMMOND / HEAVY SOUL', accent: '#d85128', front: [348, 444, 1188, 2544], back: [1324, 444, 2152, 2544] },
  { id: 'funk', number: '02', title: 'FUNK', file: '/tickets/funk.jpg', subtitle: 'POCKET / GROOVE', accent: '#e5bd3c', front: [168, 576, 1116, 2928], back: [1384, 576, 2308, 2928] },
  { id: 'fusion', number: '03', title: 'FUSION', file: '/tickets/fusion.jpg', subtitle: 'ODD TIME / OPEN FORM', accent: '#8992b6', front: [384, 552, 1200, 2604], back: [1384, 552, 2200, 2604] },
  { id: 'rnb', number: '04', title: 'R&B', file: '/tickets/rnb.jpg', subtitle: 'RHYTHM / BLUES', accent: '#d9d3c2', front: [204, 576, 1152, 2916], back: [1336, 576, 2272, 2916] },
]

const SOURCE_WIDTH = 2480
const SOURCE_HEIGHT = 3508
const STUB_WIDTH_CM = 8
const STUB_LENGTH_CM = 20
// The supplied print art is approximately 0.4 wide per unit of height.
// A 30 cm full ticket keeps that source ratio and leaves a 20 cm bottom stub.
const FULL_TICKET_LENGTH_CM = 30

function ticketCropStyle(edition) {
  const [left, top, right, bottom] = edition.front
  const cropHeight = bottom - top
  const heightFraction = cropHeight / SOURCE_HEIGHT
  const aspect = ((right - left) / cropHeight)
  const renderedWidth = (SOURCE_WIDTH / SOURCE_HEIGHT / heightFraction) / aspect
  const ticketWidthCm = aspect * FULL_TICKET_LENGTH_CM
  const stubWidthFraction = Math.min(1, STUB_WIDTH_CM / ticketWidthCm)
  const stubHeightFraction = STUB_LENGTH_CM / FULL_TICKET_LENGTH_CM

  return {
    '--ticket-ratio': aspect,
    '--ticket-sheet-height': `${100 / heightFraction}%`,
    '--ticket-source-y': `${(top / SOURCE_HEIGHT / (1 - heightFraction)) * 100}%`,
    '--front-x': `${((edition.front[0] / SOURCE_WIDTH * renderedWidth) / (renderedWidth - 1)) * 100}%`,
    '--back-x': `${((edition.back[0] / SOURCE_WIDTH * renderedWidth) / (renderedWidth - 1)) * 100}%`,
    '--ticket-main-height': `${(1 - stubHeightFraction) * 100}%`,
    '--ticket-stub-width': `${stubWidthFraction * 100}%`,
    '--ticket-stub-inset': `${((1 - stubWidthFraction) / 2) * 100}%`,
    '--ticket-stub-top': `${(1 - stubHeightFraction) * 100}%`,
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
    <TicketFace edition={edition} side="back" />
  </span>
}

export default function TicketPage() {
  const [editionId, setEditionId] = useState(ticketEditions[0].id)
  const [isBack, setIsBack] = useState(false)
  const [isTorn, setIsTorn] = useState(false)
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
  }
  const flipTicket = () => setIsBack(value => !value)

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
      <p className="ticket-intro-note">A printed signal<br />for the night of October 17.</p>
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
          className={`ticket-composition ${isBack ? 'is-back' : ''} ${isTorn ? 'is-torn' : ''}`}
          style={ticketCropStyle(edition)}
          type="button"
          onClick={flipTicket}
          aria-label={`${edition.title} ticket. Currently showing ${isBack ? 'back' : 'front'}. Flip to ${isBack ? 'front' : 'back'}.`}
          aria-pressed={isBack}
          key={edition.id}
        >
          <TicketFacePair edition={edition} className="ticket-full-flip" />
          <span className="ticket-torn-layer" aria-hidden="true">
            <span className="ticket-cut-piece ticket-cut-main">
              <TicketFacePair edition={edition} className="ticket-piece-flip" />
            </span>
            <span className="ticket-cut-piece ticket-cut-stub">
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
        <p className="ticket-sale-note"><i /> TICKET SALES / COMING SOON</p>
        <button
          className="ticket-tear-button"
          type="button"
          onClick={() => {
            if (isTorn) {
              setIsTorn(false)
              setIsBack(false)
            } else {
              setIsTorn(true)
            }
          }}
          aria-pressed={isTorn}
        >
          <span>{isTorn ? 'REASSEMBLE TICKET' : 'TEAR OFF TICKET'}</span>
          <i aria-hidden="true">{isTorn ? '↶' : '↗'}</i>
        </button>
        <button className="ticket-reserve" type="button" disabled aria-label="Ticket purchasing coming soon">
          RESERVE / COMING SOON
        </button>
        <p className="ticket-detail-foot">10.17.2026 <span>·</span> BLUE NIGHT UNDERGROUND SPACE</p>
      </aside>
    </section>

    <section className="ticket-concept" aria-labelledby="ticket-concept-title">
      <div className="ticket-concept-heading">
        <span>DESIGN NOTES / 01—04</span>
        <h2 id="ticket-concept-title">TICKET DESIGN CONCEPT</h2>
      </div>
      <div className="ticket-concept-copy">
        <p>Four visual frequencies.<br />One printed entrance to Blue Night.</p>
        <p>Concept text and genre notes<br />will be added here.</p>
      </div>
      <span className="ticket-concept-mark" aria-hidden="true">BN—004</span>
    </section>

    <footer className="ticket-footer"><span>BLUE NIGHT / KAOHSIUNG</span><span>PRINTED MUSIC CULTURE</span><a href="/#portal">← RETURN TO MAIN EXPERIENCE</a></footer>
  </main>
}
