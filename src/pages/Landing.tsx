import { useRef, useState } from 'react'
import { ArrowRight, Coins, Handshake, Lock, MessageCircle, Route, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'
import { MODES } from '../lib/modes'
import { Reveal, WordReveal, useScrollProgress, useScrollVars } from '../lib/motion'
import ModeIcon from '../components/ModeIcon'
import ThemeToggle from '../components/ThemeToggle'
import HeroScene from '../components/HeroScene'

const STEPS = [
  { title: 'Post or find a trip',
    text: 'Going to the airport, the station, home for the holidays, or somewhere new? Post where and when, or browse trips already planned. Any place works, not only big cities.' },
  { title: 'Ask, then request to join',
    text: 'Message the host privately to check the plan. When you are ready, send a join request. The host decides who comes along.' },
  { title: 'Share details, then go',
    text: 'Once you are accepted, the contact details each person chose to share with travel mates unlock. Everything else stays hidden.' },
]

const SAFETY = [
  { icon: ShieldCheck, title: 'Only verified VIT students',
    text: `Sign-in needs a Google account ending in @${CAMPUS_DOMAIN}. The server checks this, not just the page.` },
  { icon: Lock, title: 'You control each detail',
    text: 'Phone, email, Instagram and gender each have their own setting: everyone on campus, only travel mates, or only you. Instagram is optional.' },
  { icon: Users, title: 'Women-only and men-only trips',
    text: 'Hosts can restrict a trip. The server then rejects join requests from anyone else. Gender is self-declared, so treat it as a strong filter, not proof of identity.' },
  { icon: MessageCircle, title: 'Block and report, always',
    text: 'Chats start only from a trip. You can block anyone, and report a person or trip to the project owner in two taps.' },
]

const FAQ = [
  { q: 'Is this an official VIT service?',
    a: 'No. TravelBuddy is a student-built project and is not affiliated with or endorsed by VIT. That is why it only asks for a Google sign-in, nothing else.' },
  { q: 'What does it cost?',
    a: 'Nothing. TravelBuddy never handles money. Fares are split between travellers directly, the way you agree in the trip.' },
  { q: 'Who can see my phone number?',
    a: 'Only who you choose. The default is travel mates only: people whose trip you hosted or joined. You can change it, per detail, any time.' },
  { q: 'Do I have to share my Instagram?',
    a: 'No. Phone and gender are required, because they power contact and the safety filters. Instagram is optional and starts hidden from strangers.' },
  { q: 'What if something feels wrong?',
    a: 'Block the person, report them from the chat or the trip, and call 112 in an emergency. Reports are visible only to you and the project owner.' },
]

const OCCASIONS = [
  'Airport runs', 'Station drops', 'Home for the holidays', 'Weekend getaways', 'Internship commutes',
  'Late-night arrivals', 'Hometown trips', 'Group outings', 'Anywhere else',
]

/** An endlessly scrolling row. The second copy is hidden from screen readers. */
function Marquee({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) {
  return (
    <div className={reverse ? 'marquee reverse' : 'marquee'}>
      <div className="marquee-track">
        <ul>{children}</ul>
        <ul aria-hidden="true" className="dup">{children}</ul>
      </div>
    </div>
  )
}

export default function Landing() {
  const { signIn, error } = useAuth()
  const root = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)
  const [reached, setReached] = useState(0)
  useScrollVars(root)
  useScrollProgress(stepsRef, STEPS.length, setReached)

  return (
    <div className="site" ref={root}>
      <div className="site-nav-wrap">
        <header className="site-nav">
          <a href="#top" className="brand">TravelBuddy</a>
          <nav aria-label="Page sections" className="site-links">
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="site-nav-actions">
            <ThemeToggle />
            <button className="btn primary sm" onClick={signIn}>Sign in</button>
          </div>
        </header>
      </div>

      <main id="top">
        <HeroScene
          a={
            <>
              <p className="eyebrow rise" style={{ '--d': '0ms' } as React.CSSProperties}>For VIT students</p>
              <h1 aria-label="Don’t travel alone. Don’t overpay."><WordReveal text="Don’t travel alone. Don’t overpay." /></h1>
              <p className="lede rise" style={{ '--d': '420ms' } as React.CSSProperties}>
                Find students heading your way, by cab, train, flight or anything else. Split the cost,
                share the ride, and know who you are travelling with.
              </p>
              <div className="row center-row rise" style={{ '--d': '560ms' } as React.CSSProperties}>
                <button className="btn primary lg" onClick={signIn}>
                  Sign in with your VIT Google account <ArrowRight size={18} aria-hidden="true" />
                </button>
                <a className="btn lg" href="#how">See how it works</a>
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <p className="fine rise" style={{ '--d': '680ms' } as React.CSSProperties}>A student-built project, not an official VIT service.</p>
            </>
          }
          b={
            <>
              <p className="eyebrow">Someone is already going your way</p>
              <h2 className="scene-h2">Find them. Ask them. Go together.</h2>
              <figure className="example" aria-label="Example of a trip card">
                <figcaption>Example trip</figcaption>
                <div className="ex-card">
                  <div className="row between">
                    <span className="chip"><ModeIcon id="cab" /> Cab</span>
                    <span className="chip ok">2 spots open</span>
                  </div>
                  <div className="ex-route">
                    <strong>VIT Vellore</strong>
                    <span aria-hidden="true">→</span>
                    <strong>Chennai Airport</strong>
                  </div>
                  <p className="muted small">Fri, 6:00 am · Meet at main gate · Split equally</p>
                  <div className="row">
                    <span className="chip safe"><ShieldCheck size={14} aria-hidden="true" /> Women only</span>
                    <span className="chip">Space for luggage</span>
                  </div>
                </div>
              </figure>
              <a className="btn primary lg" href="#how">See how it works <ArrowRight size={18} aria-hidden="true" /></a>
            </>
          }
        />

        <section className="marquees" aria-label="Every kind of trip">
          <Marquee>
            {MODES.map((m) => <li key={m.id}><ModeIcon id={m.id} size={18} /> {m.label}</li>)}
          </Marquee>
          <Marquee reverse>
            {OCCASIONS.map((o) => <li key={o} className="alt">{o}</li>)}
          </Marquee>
        </section>

        <section className="band" aria-label="What it does">
          <div className="pillars">
            <Reveal><Coins size={22} aria-hidden="true" /><h3>Split the cost</h3><p>Share a cab or an auto and the fare per person drops.</p></Reveal>
            <Reveal delay={120}><Route size={22} aria-hidden="true" /><h3>Go anywhere</h3><p>Not limited to a list of cities. Type any place in the world.</p></Reveal>
            <Reveal delay={240}><Handshake size={22} aria-hidden="true" /><h3>Travel with people you can vet</h3><p>Verified students, private chat, and a host who approves each person.</p></Reveal>
          </div>
        </section>

        <section id="how" className="section">
          <Reveal><h2>How it works</h2></Reveal>
          <ol className="steps" ref={stepsRef}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={reached > i ? 'on' : ''}>
                <span className="step-n">{i + 1}</span>
                <div><h3>{s.title}</h3><p>{s.text}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="safety" className="section tint">
          <Reveal><h2>Built around safety and privacy</h2></Reveal>
          <Reveal as="p" className="section-lede" delay={80}>
            Meeting people for a journey needs trust. These protections are enforced by the server,
            so they cannot be switched off by editing the page.
          </Reveal>
          <div className="safety-grid">
            {SAFETY.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} className="safety-item" delay={(i % 2) * 120}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="faq" className="section">
          <Reveal><h2>Questions</h2></Reveal>
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
            <h2>Ready for your next trip?</h2>
            <p>Sign in with your <code>@{CAMPUS_DOMAIN}</code> account. Setting up takes a minute.</p>
            <button className="btn primary lg" onClick={signIn}>Sign in with Google <ArrowRight size={18} aria-hidden="true" /></button>
          </Reveal>
        </section>
      </main>

      <footer className="site-foot">
        <span>TravelBuddy is a student project. Not affiliated with or endorsed by VIT.</span>
        <span>In an emergency in India, call <a href="tel:112">112</a>.</span>
      </footer>
    </div>
  )
}
