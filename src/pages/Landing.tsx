import { ArrowRight, Coins, Handshake, Lock, MessageCircle, Route, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'
import { MODES } from '../lib/modes'
import ModeIcon from '../components/ModeIcon'

const STEPS = [
  { n: '1', title: 'Post or find a trip',
    text: 'Going to the airport, the station, home for the holidays, or somewhere new? Post where and when, or browse trips already planned. Any place works, not only big cities.' },
  { n: '2', title: 'Ask, then request to join',
    text: 'Message the host privately to check the plan. When you are ready, send a join request. The host decides who comes along.' },
  { n: '3', title: 'Share details, then go',
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

export default function Landing() {
  const { signIn, error } = useAuth()
  return (
    <div className="site">
      <div className="site-nav-wrap"><header className="site-nav">
        <a href="#top" className="brand">TravelBuddy</a>
        <nav aria-label="Page sections" className="site-links">
          <a href="#how">How it works</a>
          <a href="#safety">Safety</a>
          <a href="#faq">FAQ</a>
        </nav>
        <button className="btn primary sm" onClick={signIn}>Sign in</button>
      </header></div>

      <main id="top">
        <section className="hero2">
          <div className="hero2-copy">
            <p className="eyebrow">For VIT students</p>
            <h1>Don&rsquo;t travel alone. Don&rsquo;t overpay.</h1>
            <p className="lede">
              TravelBuddy helps you find other students heading the same way, by cab, train, flight,
              bus or anything else, so the ride costs less, the journey is better company, and you
              know who you are travelling with.
            </p>
            <div className="row">
              <button className="btn primary lg" onClick={signIn}>
                Sign in with your VIT Google account <ArrowRight size={18} aria-hidden="true" />
              </button>
              <a className="btn lg" href="#how">See how it works</a>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <p className="fine">A student-built project, not an official VIT service.</p>
          </div>

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
        </section>

        <section className="band" aria-label="What it does">
          <div className="pillars">
            <div><Coins size={22} aria-hidden="true" /><h3>Split the cost</h3><p>Share a cab or an auto and the fare per person drops.</p></div>
            <div><Route size={22} aria-hidden="true" /><h3>Go anywhere</h3><p>Not limited to a list of cities. Type any place in the world.</p></div>
            <div><Handshake size={22} aria-hidden="true" /><h3>Travel with people you can vet</h3><p>Verified students, private chat, and a host who approves each person.</p></div>
          </div>
        </section>

        <section id="how" className="section">
          <h2>How it works</h2>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n}><span className="step-n">{s.n}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>
            ))}
          </ol>
          <p className="modes-label">Works for every kind of trip</p>
          <ul className="mode-list">
            {MODES.map((m) => <li key={m.id}><ModeIcon id={m.id} size={18} /> {m.label}</li>)}
          </ul>
        </section>

        <section id="safety" className="section tint">
          <h2>Built around safety and privacy</h2>
          <p className="section-lede">
            Meeting people for a journey needs trust. These protections are enforced by the server,
            so they cannot be switched off by editing the page.
          </p>
          <div className="safety-grid">
            {SAFETY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="safety-item">
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="section">
          <h2>Questions</h2>
          <div className="faq-list">
            {FAQ.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2>Ready for your next trip?</h2>
          <p>Sign in with your <code>@{CAMPUS_DOMAIN}</code> account. Setting up takes a minute.</p>
          <button className="btn primary lg" onClick={signIn}>Sign in with Google</button>
        </section>
      </main>

      <footer className="site-foot">
        <span>TravelBuddy is a student project. Not affiliated with or endorsed by VIT.</span>
        <span>In an emergency in India, call <a href="tel:112">112</a>.</span>
      </footer>
    </div>
  )
}
