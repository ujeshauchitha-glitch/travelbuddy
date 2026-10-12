export default function SetupNeeded() {
  return (
    <div className="center">
      <div className="card login">
        <h1>Firebase is not configured yet</h1>
        <ol>
          <li>Create a Firebase project and add a Web app.</li>
          <li>Enable Authentication (Google) and Firestore.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill it in.</li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
      </div>
    </div>
  )
}
