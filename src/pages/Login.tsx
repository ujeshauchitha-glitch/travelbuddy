import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'

export default function Login() {
  const { signIn, error } = useAuth()
  return (
    <div className="landing">
      <div className="hero">
        <h1 className="wordmark">Travel<br />Buddy</h1>
        <p className="tagline">Share a cab, train, flight or any journey, to anywhere, with students you can trust.</p>
        <div className="phone">
          <div className="card login">
            <h1>Hop in</h1>
            <p className="notice">
              A student-built project, <strong>not</strong> an official VIT service. Only{' '}
              <code>@{CAMPUS_DOMAIN}</code> Google accounts can sign in.
            </p>
            <button className="btn primary" onClick={signIn}>Sign in with Google</button>
            {error && <p className="error" role="alert">{error}</p>}
            <p className="fine">
              Your phone, email, Instagram and gender stay hidden unless you choose to share them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
