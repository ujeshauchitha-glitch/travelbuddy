import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Handshake, Lock, MessageCircle, Plus, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'
import { Reveal, WordReveal } from '../lib/motion'
import { SiteFooter, SiteNav } from '../components/SiteChrome'
import ModeStamp from '../components/art/ModeStamp'
import { RoadDivider, SketchBackpack, SketchCompass, SketchPlane, SketchTicket, SketchTrain } from '../components/art/Sketches'
import type { TravelMode } from '../lib/types'
import { DoodleArrow, DoodleSpark, DoodleSquiggle, DoodleStar } from '../components/art/Doodles'

const STEPS = [
  { n: '01', title: 'Post or find a trip',
    text: 'Going to the airport, the station, home for the holidays, or somewhere new? Post where and when, or browse trips already planned. Any place works.' },
  { n: '02', title: 'Ask, then request to join',
    text: 'Message the host privately to check the plan. When you are ready, send a join request. The host decides who comes along.' },
  { n: '03', title: 'Share details, then go',
    text: 'Once you are accepted, the contact details each person chose to share with travel mates unlock. Everything else stays hidden.' },
]

const SAFETY = [
  { icon: ShieldCheck, title: 'Only verified VIT students',
    text: `Sign-in needs a Google account ending in @${CAMPUS_DOMAIN}. The server checks this, not just the page.` },
  { icon: Lock, title: 'You control each detail',
    text: 'Phone, email, Instagram and gender each have their own setting: everyone on campus, only travel mates, or only you.' },
  { icon: Users, title: 'Women-only and men-only trips',
    text: 'Hosts can restrict a trip, and the server rejects other join requests. Gender is self-declared, so treat it as a strong filter, not proof.' },
  { icon: MessageCircle, title: 'Block and report, always',
    text: 'Chats start only from a trip. You can block anyone, and report a person or trip to the project owner in two taps.' },
]

const FAQ = [
  { q: 'Is this an official VIT service?',
    a: 'No. Travel Tinder is a student-built project and is not affiliated with or endorsed by VIT. That is why it only asks for a Google sign-in, nothing else.' },
  { q: 'What does it cost?',
    a: 'Nothing. Travel Tinder never handles money. Fares are split between travellers directly, the way you agree in the trip.' },
  { q: 'Who can see my phone number?',
    a: 'Only who you choose. The default is travel mates only: people whose trip you hosted or joined. You can change it, per detail, any time.' },
  { q: 'Do I have to share my Instagram?',
    a: 'No. Phone and gender are required, because they power contact and the safety filters. Instagram is optional and starts hidden from strangers.' },
  { q: 'What if something feels wrong?',
    a: 'Block the person, report them from the chat or the trip, and call 112 in an emergency. Reports are visible only to you and the project owner.' },
]

// Places people commonly plan trips from campus. These are search shortcuts, not live listings.
const ROUTES: { title: string; code: string; mode: TravelMode; q: string; note: string }[] = [
  { title: 'Chennai Airport', code: 'MAA', mode: 'flight', q: 'Chennai', note: 'Flights' },
  { title: 'Bengaluru Airport', code: 'BLR', mode: 'flight', q: 'Bengaluru', note: 'Flights' },
  { title: 'Katpadi Junction', code: 'KPD', mode: 'train', q: 'Katpadi', note: 'Trains' },
  { title: 'Chennai Central', code: 'MAS', mode: 'train', q: 'Chennai Central', note: 'Trains' },
]

export default function Landing() {
  const { signIn, error, user, profile, loading } = useAuth()
  const nav = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // After a fresh sign-in on this page, continue into the app. A returning
  // visitor with a saved session stays on the home page.
  const wasSignedOut = useRef<boolean | null>(null)
  useEffect(() => {
    if (loading) return
    if (wasSignedOut.current === true && user) nav('/app')
    wasSignedOut.current = !user
  }, [user, loading, nav])
  const first = (profile?.displayName ?? user?.displayName ?? '').split(' ')[0]

  const go = (q: string) => {
    if (user) nav(q ? `/app?q=${encodeURIComponent(q)}` : '/app')
    else signIn()
  }
  const onFind = (e: FormEvent) => { e.preventDefault(); go(`${from} ${to}`.trim()) }

  return (
    <div className="site" ref={root} data-auth={loading ? 'pending' : 'ready'}>
      <SiteNav />

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow rise" style={{ '--d': '0ms' } as React.CSSProperties}>{user && first ? `Welcome back, ${first}` : 'For VIT students'}</p>
            <h1 aria-label="Don’t travel alone. Don’t overpay.">
              <WordReveal text="Don’t travel alone." />
              <span className="hl"><WordReveal text="Don’t overpay." />
                <svg className="scribble" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 Q 40 1 80 7 T 160 6 T 240 8 T 298 5" /></svg>
              </span>
            </h1>
            <p className="lede rise" style={{ '--d': '420ms' } as React.CSSProperties}>
              Find students heading your way, by cab, train, flight or anything else. Split the cost, share the ride,
              and know who you are travelling with.
            </p>
            <div className="cta-pair rise auth-cta" style={{ '--d': '560ms' } as React.CSSProperties}>
              {user ? (
                <>
                  <Link className="btn primary xl" data-magnet to="/app">Find a trip <ArrowRight size={22} aria-hidden="true" /></Link>
                  <Link className="btn xl" data-magnet to="/app/post"><Plus size={22} aria-hidden="true" /> Post a trip</Link>
                </>
              ) : (
                <>
                  <button className="btn primary xl" data-magnet onClick={signIn}>Find a trip <ArrowRight size={22} aria-hidden="true" /></button>
                  <button className="btn xl" data-magnet onClick={signIn}><Plus size={22} aria-hidden="true" /> Post a trip</button>
                </>
              )}
            </div>
            <p className="how-link rise" style={{ '--d': '620ms' } as React.CSSProperties}><a href="#how">See how it works ↓</a></p>
            {error && <p className="error" role="alert">{error}</p>}
            <ul className="trust rise" style={{ '--d': '680ms' } as React.CSSProperties}>
              <li><BadgeCheck size={18} aria-hidden="true" /> Verified VIT students</li>
              <li><Handshake size={18} aria-hidden="true" /> Hosts approve joins</li>
              <li><ShieldCheck size={18} aria-hidden="true" /> Block and report</li>
            </ul>
            <p className="fine">A student-built project, not an official VIT service.</p>
          </div>

          <div className="hero-art rise" style={{ '--d': '300ms' } as React.CSSProperties}>
            <p className="hand note-top" aria-hidden="true">same journey,<br />better company.</p>
            <div className="stamp-collage">
              {[
                ['train', 'sc1', 'Illustrated postage stamp of a train crossing a stone viaduct'],
                ['plane', 'sc2', 'Illustrated postage stamp of an aeroplane in the sky'],
                ['car', 'sc3', 'Illustrated postage stamp of a small car on a coast road'],
                ['bus', 'sc4', 'Illustrated postage stamp of a bus below the mountains'],
              ].map(([name, cls, alt], i) => (
                <div key={name} className={`sc ${cls}`} style={{ '--k': i } as React.CSSProperties}>
                  <img className="sc-sketch" src={`/art/stamp-${name}.webp`} width={355} height={360} alt="" aria-hidden="true" />
                  <img className="sc-color" src={`/art/stamp-${name}.webp`} width={355} height={360} alt={alt} />
                </div>
              ))}
            </div>
            <span className="tape t1" aria-hidden="true" /><span className="tape t2" aria-hidden="true" />
            <DoodleArrow /><DoodleStar /><DoodleSquiggle /><DoodleSpark />
            <figure className="ticket-float" aria-label="Example of a trip ticket">
              <figcaption className="mono">Example</figcaption>
              <p className="tf-route"><strong>VIT</strong><span aria-hidden="true">→</span><strong>Chennai</strong></p>
              <p className="mono small">Fri · 06:40 · 2 seats</p>
            </figure>
            <div className="stamp" aria-hidden="true"><span>Travel Tinder</span><b>Est. 2026</b></div>
          </div>
        </section>

        <section className="finder-wrap" aria-label="Search trips">
          <form className="finder" onSubmit={onFind}>
            <label className="field"><span>From</span>
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Vellore, VIT…" /></label>
            <label className="field"><span>To</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Anywhere" /></label>
            <button className="btn primary" type="submit">Search trips <ArrowRight size={16} aria-hidden="true" /></button>
          </form>
          {!user && <p className="fine finder-hint">You will be asked to sign in with your VIT account first.</p>}
        </section>

        <RoadDivider />

        <section className="section" aria-labelledby="routes-h">
          <Reveal className="sec-head"><h2 id="routes-h">Routes people plan from campus</h2><SketchPlane /></Reveal>
          <p className="muted small">Shortcuts to search by place. These are not live listings.</p>
          <div className="routes-row">
            {ROUTES.map((r, i) => (
              <Reveal key={r.code} delay={i * 80}>
                <button type="button" className={`route-card mode-${r.mode}`} onClick={() => go(r.q)}>
                  <div className="rc-art"><ModeStamp mode={r.mode} /><span className="rc-code mono">{r.code}</span></div>
                  <strong>{r.title}</strong>
                  <span className="muted small">{r.note} · tap to search</span>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="banner-wrap">
          <Reveal className="banner">
            <div className="banner-art">
              <img src="/art/travellers.webp" width={1200} height={420} loading="lazy" decoding="async"
                alt="Two students with backpacks sitting on a hill, looking out over a lake towards purple mountains" />
            </div>
            <div className="banner-copy">
              <h2>Good trips.<br />Great company.</h2>
              <p>Travel with people who get it: students, with a host who approves every join.</p>
            </div>
            <div className="banner-actions">
              <button type="button" className="pass" data-magnet onClick={() => go('')}>
                <span className="mono">Join a trip</span>
                <strong>Find yours</strong>
                <ArrowRight size={22} aria-hidden="true" />
              </button>
              <button type="button" className="pass alt" data-magnet onClick={() => (user ? nav('/app/post') : signIn())}>
                <span className="mono">Going somewhere?</span>
                <strong>Post yours</strong>
                <Plus size={22} aria-hidden="true" />
              </button>
            </div>
          </Reveal>
        </section>

        <RoadDivider />

        <section id="how" className="section">
          <Reveal className="sec-head"><h2>How it works</h2><SketchCompass /></Reveal>
          <div className="how-grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100} className="how-card">
                <span className="how-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="safety" className="section">
          <Reveal className="sec-head"><h2>Built around safety and privacy</h2><SketchBackpack /></Reveal>
          <Reveal as="p" className="section-lede" delay={80}>
            Meeting people for a journey needs trust. These protections are enforced by the server,
            so they cannot be switched off by editing the page.
          </Reveal>
          <div className="safety-grid">
            {SAFETY.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} className="note-card" delay={(i % 2) * 100}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="faq" className="section">
          <Reveal className="sec-head"><h2>Questions</h2><SketchTicket /></Reveal>
          <div className="faq-list">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details><summary>{f.q}</summary><p>{f.a}</p></details>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="cta">
          <Reveal className="cta-inner">
            <SketchTrain />
            <h2>Ready for your next trip?</h2>
            <p>{user ? 'Browse what is planned, or post your own.' : <>Sign in with your <code>@{CAMPUS_DOMAIN}</code> account. Setting up takes a minute.</>}</p>
            {user
              ? <Link className="btn lg" to="/app">Find a trip <ArrowRight size={18} aria-hidden="true" /></Link>
              : <button className="btn lg" onClick={signIn}>Sign in with Google <ArrowRight size={18} aria-hidden="true" /></button>}
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
