'use client'

export default function BotonLogout() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <button 
      onClick={handleLogout} 
      style={{
        width: '100%', textAlign: 'left', padding: '0.6rem 1.25rem',
        fontSize: '14px', color: '#A32D2D', background: 'transparent',
        border: 'none', cursor: 'pointer', marginTop: '1rem'
      }}
    >
      Cerrar sesión
    </button>
  )
}