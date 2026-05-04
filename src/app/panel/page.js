'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { BookOpen, Users, FileText, CreditCard, Sparkles } from 'lucide-react'
import capsulasMaconicas from '@/data/capsulas.json'

export default function PanelInicio() {
  const { usuario, cargandoAuth } = useAuth()

  // Lógica de la cápsula masónica
  const gradoUsuario = usuario?.grado || 1
  const reflexionesDelGrado = capsulasMaconicas.filter(capsula => capsula.grado === gradoUsuario)
  const arrayAUsar = reflexionesDelGrado.length > 0 ? reflexionesDelGrado : capsulasMaconicas
  
  const diaActual = new Date().getDate()
  const indice = diaActual % arrayAUsar.length
  const capsulaDelDia = arrayAUsar[indice]

  if (cargandoAuth) return null

  const rol = usuario?.rol_oficial
  const esVenerable = rol === 'Venerable Maestro'
  const veTesoreria = esVenerable || rol === 'Tesorero'
  const veSecretaria = esVenerable || rol === 'Secretario'

  return (
    <div style={{ maxWidth: '1000px', paddingBottom: '3rem', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* Mensaje de Bienvenida */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-gris)' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--color-profundo)', margin: '0 0 8px', fontWeight: '700', fontFamily: 'var(--font-baskerville)' }}>
          Bienvenido, Q.·. H.·. {usuario?.nombre}
        </h1>
        <p style={{ color: 'var(--color-profundo)', opacity: 0.8, margin: 0, fontSize: '15px' }}>
          Panel de gestión administrativa y operativa de la Logia Unión N° 17.
        </p>
      </div>

      {/* CÁPSULA MASÓNICA DIARIA */}
      <div style={{ 
        backgroundColor: 'var(--color-institucional)', 
        borderRadius: '12px', 
        padding: '2rem', 
        marginBottom: '2.5rem', 
        color: 'var(--color-marfil)', 
        position: 'relative', 
        overflow: 'hidden', 
        boxShadow: '0 10px 25px rgba(33, 77, 119, 0.2)' 
      }}>
        {/* Fondo decorativo */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: '0.1' }}>
          <Sparkles size={200} color="var(--color-oro)" />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <Sparkles size={20} color="var(--color-oro)" />
            <h2 style={{ fontSize: '14px', color: 'var(--color-oro)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: '700' }}>
              Reflexión del Día
            </h2>
          </div>
          
          <h3 style={{ fontSize: '22px', margin: '0 0 1rem', color: 'var(--color-marfil)', fontWeight: '500', fontFamily: 'var(--font-baskerville)' }}>
            {capsulaDelDia.titulo}
          </h3>
          
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-marfil)', opacity: 0.9, fontStyle: 'italic', margin: 0, maxWidth: '800px' }}>
            &quot;{capsulaDelDia.texto}&quot;
          </p>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS DE OFICIALES (Sólo aparecen si tienen el cargo) */}
      {(veSecretaria || veTesoreria) && (
        <div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-profundo)', marginBottom: '1.2rem', fontWeight: '700' }}>
            Accesos de Oficialidad
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            {veSecretaria && (
              <>
                <TarjetaAcceso 
                  href="/panel/secretaria/candidatos" 
                  icono={<Users size={24} />} 
                  titulo="Candidatos" 
                  descripcion="Gestión de profanos" 
                />
                <TarjetaAcceso 
                  href="/panel/secretaria/tenidas" 
                  icono={<FileText size={24} />} 
                  titulo="Tenidas" 
                  descripcion="Control de asistencia" 
                />
              </>
            )}

            {veTesoreria && (
              <>
                <TarjetaAcceso 
                  href="/panel/tesoreria" 
                  icono={<CreditCard size={24} />} 
                  titulo="Tesoro" 
                  descripcion="Dashboard financiero" 
                />
                <TarjetaAcceso 
                  href="/panel/tesoreria/hermanos" 
                  icono={<BookOpen size={24} />} 
                  titulo="Cuadro Lógico" 
                  descripcion="Estado de los HH.·." 
                />
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

// Componente visual para las tarjetas
function TarjetaAcceso({ href, icono, titulo, descripcion }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '1.2rem',
      backgroundColor: '#ffffff',
      border: '1px solid rgba(207, 181, 59, 0.3)', // Borde dorado sutil
      borderRadius: '12px',
      textDecoration: 'none',
      color: 'var(--color-profundo)',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-oro)'
      e.currentTarget.style.transform = 'translateY(-3px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(207, 181, 59, 0.15)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = 'rgba(207, 181, 59, 0.3)'
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'
    }}
    >
      <div style={{ 
        width: '48px', 
        height: '48px', 
        backgroundColor: 'rgba(207, 181, 59, 0.1)', // Fondo doradito claro para el ícono
        borderRadius: '10px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'var(--color-oro)' 
      }}>
        {icono}
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700' }}>{titulo}</h4>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gris)', fontWeight: '500' }}>{descripcion}</p>
      </div>
    </Link>
  )
}