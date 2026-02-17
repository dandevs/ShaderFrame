import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/editor-test-bed')({
  component: EditorTestBed,
})

function EditorTestBed() {
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>Editor Test Bed</h2>
      <p>This is a test bed for the editor components.</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  )
}
