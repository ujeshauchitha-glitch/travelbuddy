import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'
import { Reveal } from '../lib/motion'
import { SiteFooter, SiteNav } from '../components/SiteChrome'

const STORED = [
  ['Name and campus email', 'From your Google sign-in. The email is checked to end in @' + CAMPUS_DOMAIN + '.'],
  ['Phone number', 'Required, so travel mates can reach you. Hidden from strangers by default.'],
  ['Gender', 'Required, self-declared. Used only to enforce women-only and men-only trips. Hidden by default.'],
  ['Instagram', 'Optional. Only stored if you add it.'],
  ['Hometown and a short bio', 'Optional.'],
  ['Trips, join requests and chats', 'What you post and send inside the app. Chats are readable only by the two people in them.'],
  ['Reports', 'What you send through Help. Visible to you and the project owner.'],
]

export default function About() {
  const { user, signIn } = useAuth()
  return (
    <div className="site">
      <SiteNav />
      <main className="prose-page">
        <Reveal as="section" className="prose-hero">
          <p className="eyebrow">About</p>
          <h1>Travel together, on purpose.</h1>
          <p className="lede">
            Travel Tinder is a student-built way for VIT students to find each other for the same journey,
            so rides cost less, travel feels safer, and nobody has to go alone.
          </p>
        </Reveal>

        <Reveal as="section" className="prose">
          <h2>What it is</h2>
          <p>
            Many students make the same trip at the same time: the airport, the station, home for the
            holidays. Travel Tinder lets you post a trip, or join one, by cab, train, flight, bus or any
            other way, to any place. The host approves who joins, and you can ask questions in a private
            chat before you decide.
          </p>
          <h2>What it is not</h2>
          <ul>
            <li><strong>Not official.</strong> It is a student project, not affiliated with or endorsed by VIT.</li>
            <li><strong>Not a payment service.</strong> It never handles money. Travellers split fares directly.</li>
            <li><strong>Not a guarantee of safety.</strong> It adds protections, listed below, but you still need to use judgement.</li>
          </ul>
        </Reveal>

        <Reveal as="section" className="prose tint-block">
          <h2>How your information is handled</h2>
          <p className="muted">
            Here is everything the app stores about you, and who can see it. You choose, per detail,
            whether it is visible to everyone on campus, only your travel mates, or only you.
          </p>
          <dl className="data-list">
            {STORED.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
          <h3>Services involved</h3>
          <ul>
            <li><strong>Google</strong> handles sign-in, and Google Firebase hosts the site and stores the data above.</li>
            <li><strong>Place suggestions</strong> use Photon, an OpenStreetMap-based search service. The text you type into
              the From and To boxes is sent to it to find matches. Nothing else is.</li>
          </ul>
          <h3>What it does not do</h3>
          <ul>
            <li>No payments, no ads, and no tracking of your live location.</li>
            <li>Your details are never shown to people you did not allow.</li>
          </ul>
          <p className="muted">
            You can delete your account any time from <strong>Profile → Delete account</strong>. That erases your profile,
            contact details, trips and chats (chats are removed for the other person too). Reports you sent through Help
            are kept, so safety reports about other people are not lost.
          </p>
        </Reveal>

        <Reveal as="section" className="prose">
          <h2>Safety, and its limits</h2>
          <ul>
            <li>Only verified <code>@{CAMPUS_DOMAIN}</code> accounts can sign in, checked by the server.</li>
            <li>Hosts can limit a trip to women or to men. The server rejects other join requests.
              Gender is self-declared, so it is a strong filter, not proof of identity.</li>
            <li>Chats start only from a trip. You can block anyone, and report a person or trip from the chat or the trip page.</li>
            <li>Meet in public places, share your trip with someone you trust, and never share money or OTPs in chat.</li>
          </ul>
          <p>
            In an emergency in India call <a href="tel:112">112</a>. Women’s helpline: <a href="tel:181">181</a>.
          </p>
        </Reveal>

        <Reveal as="section" className="prose">
          <h2>Get in touch</h2>
          <p>
            Found a bug, have an idea, or need help with your account? Signed-in users can use the{' '}
            <Link to="/app/help">Help page</Link> to send a message straight to the project owner.
          </p>
          <div className="row">
            {user
              ? <Link to="/app" className="btn primary lg">Open the app <ArrowRight size={18} aria-hidden="true" /></Link>
              : <button className="btn primary lg" onClick={signIn}>Sign in with Google <ArrowRight size={18} aria-hidden="true" /></button>}
            <Link to="/" className="btn lg">Back to home</Link>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  )
}
