export function Inspector() {
  return (
    <div style={{ 
      width: '300px', 
      height: '100%', 
      background: '#333', 
      color: '#fff', 
      padding: '1rem',
      borderLeft: '1px solid #444',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #555', paddingBottom: '0.5rem' }}>Inspector</h3>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Select an object to inspect properties.</p>
        
        {/* Placeholder controls */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Transform</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="number" placeholder="X" style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '4px' }} />
            <input type="number" placeholder="Y" style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '4px' }} />
            <input type="number" placeholder="Z" style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
