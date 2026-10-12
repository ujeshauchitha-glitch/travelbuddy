import { useAuth } from '../auth/AuthContext'
import { CAMPUS_DOMAIN } from '../lib/firebase'

export default function Login() {
  const { signIn, error } = useAuth()
  return (
    <div className="center">
      <div className="card login">
        <h1>🧭 TravelBuddy</h1>
        <p>Find people to share a cab, train, flight or any journey, anywhere.</p>
        <p className="notice">
          A student-built project. It is <strong>not</strong> an official VIT service.
          Sign-in is limited to <code>@{CAMPUS_DOMAIN}</code> Google accounts so you only meet fellow students.
        </p>
        <button className="btn primary" onClick={signIn}>Sign in with Google</button>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="muted small">
          We only use your name and campus email. Your phone, email and Instagram stay hidden
          unless you choose to share them.
        </p>
      </div>
    </div>
  )
}
