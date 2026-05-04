'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Phone, Mail, Calendar, CircleDollarSign } from 'lucide-react'

export default function IniciacionesTesoreria() {
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarIniciaciones() {
      // Traemos solo a los aprobados que ya tienen fecha fijada
      const { data, error } = await supabase
        .from('candidatos')
        .select('id, nombre, apellido, email, telefono, fecha_iniciacion, derechos_pagados')
        .eq('estado', 'aprobado')
        .not('fecha_iniciacion', 'is', null)
        .order('fecha_iniciacion', { ascending: true })

      if (!error && data) {
        setCandidatos(data)
      }
      setCargando(false)
    }
    cargarIniciaciones()
  }, [])

  const marcarComoPagado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    // Actualizamos la UI al instante
    setCandidatos(prev => prev.map(c => c.id === id ? { ...c, derechos_pagados: nuevoEstado } : c))

    // Guardamos en Supabase
    const { error } = await supabase
      .from('candidatos')
      .update({ derechos_pagados: nuevoEstado })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar el pago.')
      setCandidatos(prev => prev.map(c => c.id === id ? { ...c, derechos_pagados: estadoActual } : c))
    }
  }

  if (cargando) return <p style={{ padding: '2rem', color: '#888' }}>Cargando agenda de iniciaciones...</p>

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircleDollarSign color="#CDA434" /> Derechos de Iniciación
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: '4px 0 0' }}>
          Gestión de cobro y citación oficial para candidatos con fecha de iniciación fijada por Secretaría.
        </p>
      </div>

      {candidatos.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px dashed #c8c5b8', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#888', margin: 0 }}>No hay iniciaciones programadas pendientes de gestión.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {candidatos.map(c => (
            <div key={c.id} style={{ backgroundColor: '#ffffff', border: `1px solid ${c.derechos_pagados ? '#b8d598' : '#e8e6e0'}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 8px' }}>
                  {c.apellido}, {c.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#CDA434" /> Iniciación: <strong style={{ color: '#1a1a2e' }}>{new Date(c.fecha_iniciacion + 'T00:00:00').toLocaleDateString('es-AR')}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {c.telefono || 'Sin tel.'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {c.email || 'Sin email'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {c.derechos_pagados ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#27500A', backgroundColor: '#EAF3DE', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <CheckCircle2 size={16} /> Derechos Cancelados
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854F0B', backgroundColor: '#FFF4E5', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                    Pendiente de Cobro
                  </span>
                )}
                
                <button 
                  onClick={() => marcarComoPagado(c.id, c.derechos_pagados)}
                  style={{ backgroundColor: c.derechos_pagados ? '#f0efe9' : '#1a1a2e', color: c.derechos_pagados ? '#666' : '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {c.derechos_pagados ? 'Anular Pago' : 'Registrar Pago'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}