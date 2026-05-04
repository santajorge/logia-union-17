import Image from 'next/image'
import NavbarPublico from './components/NavbarPublico'
import AnimatedSection from './components/AnimatedSection'

export const metadata = {
  title: 'Logia Unión N° 17 — Masonería en Rosario',
  description: 'Logia masónica en Rosario, Santa Fe. Fundada en 1860. Bajo los auspicios de la Gran Logia de la Argentina de Libres y Aceptados Masones.',
}

export default function HomePage() {
  return (
    <div style={{ backgroundColor: 'var(--color-marfil)' }}>
      <NavbarPublico />

      {/* HERO SECTION / PORTADA */}
      <section aria-label="Presentación" style={{ position: 'relative', height: '85vh', minHeight: '650px', overflow: 'hidden' }}>
        <Image
          src="/templo-antiguo-frente.jpg"
          alt="Fachada del templo histórico"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
          priority
        />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: 'var(--color-oro)', letterSpacing: '0.25em', marginBottom: '2rem', fontFamily: 'var(--font-montserrat)' }}>
            A L.·.G.·.D.·.G.·.A.·.D.·.U.·.
          </p>
          <Image
            src="/logo-union-17-dorado.png"
            alt="Logo Logia Unión N° 17"
            width={280} 
            height={280}
            style={{ marginBottom: '1.5rem', objectFit: 'contain', width: '100%', maxWidth: '280px' }}
            priority
          />
          {/* Tamaños fluidos con clamp() para responsividad */}
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 46px)', fontWeight: '700', color: 'var(--color-marfil)', marginBottom: '12px', lineHeight: '1.2', fontFamily: 'var(--font-baskerville)' }}>
            Aug.·. y Resp.·. Log.·. Unión N° 17
          </h1>
          <p style={{ fontSize: 'clamp(15px, 3vw, 18px)', color: 'var(--color-marfil)', marginBottom: '3rem', letterSpacing: '0.05em', fontFamily: 'var(--font-montserrat)' }}>
            Bajo los Auspicios de la Gran Logia Argentina de Libres y Aceptados Masones
          </p>
          
          <a
            href="https://masoneria-argentina.org.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="link-gl"
            style={{ 
              display: 'inline-block',
              fontSize: '13px', 
              color: 'var(--color-gris)', 
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-montserrat)',
              transition: 'all 0.3s ease',
              borderBottom: '1px solid transparent',
              paddingBottom: '2px'
            }}
          >
            Visitar web de la Gran Logia Argentina
          </a>
        </div>
      </section>

      {/* SECCIÓN LEGADO (Nosotros) */}
      <section id="nosotros" style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', backgroundColor: 'var(--color-marfil)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 5vw, 4rem)' }}>
          
          {/* Fila 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <AnimatedSection>
              <Image src="/templo-antiguo-grupo-1.png" alt="Historia y Tradición" width={500} height={500} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <p style={{ fontSize: '13px', color: 'var(--color-oro)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nuestro Legado
              </p>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '1.5rem', fontFamily: 'var(--font-baskerville)', lineHeight: '1.1' }}>
                HISTORIA Y TRADICIÓN
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--color-profundo)', lineHeight: '1.8', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)' }}>
                La historia de la Logia Unión N° 17 se entreteje con los momentos más decisivos de la construcción nacional. En la década de 1850, Argentina transitaba procesos decisivos marcados por fuertes divisiones políticas entre unitarios y federales.
              </p>
              <p style={{ fontSize: '16px', color: 'var(--color-profundo)', lineHeight: '1.8', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)' }}>
                En ese escenario, muchos masones entendieron que la fraternidad podía tender puentes donde la política abría grietas. El 24 de junio de 1860, la Logia Unión levantó columnas y, el 11 de octubre del mismo año, se le otorgó la carta patente N° 17, firmada por el Dr. Roque Pérez.
              </p>
            </AnimatedSection>
          </div>

          {/* Fila 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center', marginTop: 'clamp(-1rem, -4vw, -4rem)', position: 'relative', zIndex: 2 }}>
            <AnimatedSection style={{ order: 2 }}>
              <p style={{ fontSize: '13px', color: 'var(--color-oro)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                165 Años de Trabajos
              </p>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '1.5rem', fontFamily: 'var(--font-baskerville)', lineHeight: '1.1' }}>
                RAÍCES EN LA CIUDAD
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--color-profundo)', lineHeight: '1.8', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)' }}>
                A lo largo de estos 165 años ininterrumpidos, los hermanos de Unión 17 participaron activamente en iniciativas vinculadas a la educación, la inmigración y el desarrollo urbano de Rosario. Nuestro trabajo ha acompañado el crecimiento de la ciudad y su identidad.
              </p>
              <p style={{ fontSize: '16px', color: 'var(--color-profundo)', lineHeight: '1.8', fontFamily: 'var(--font-montserrat)' }}>
                Hoy continuamos trabajando por la libertad, la igualdad y la fraternidad, honrando a los fundadores y proyectando este legado hacia el futuro.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200} style={{ order: 1 }}>
               <Image src="/templo-antiguo-grupo-2.png" alt="Pasado y Presente" width={500} height={500} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
            </AnimatedSection>
          </div>

        </div>
      </section>

      {/* SECCIÓN MASONERÍA */}
      <section id="masoneria" style={{ backgroundColor: 'var(--color-institucional)', padding: 'clamp(4rem, 8vw, 8rem) 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(3rem, 6vw, 6rem)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center' }}>
            <AnimatedSection>
              <p style={{ fontSize: '14px', color: 'var(--color-oro)', letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: '600' }}>
                Conocé la institución
              </p>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: '400', color: 'var(--color-marfil)', marginBottom: '2rem', fontFamily: 'var(--font-baskerville)', lineHeight: '1.1' }}>
                QUÉ ES LA MASONERÍA
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--color-marfil)', lineHeight: '1.8', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)' }}>
                La masonería es una institución filosófica, filantrópica y progresista. Es una escuela de pensamiento y un sistema de ética basado en la convicción de que cada persona tiene la responsabilidad de mejorarse a sí misma y de contribuir al bien de su entorno, sostenidos por el lema: Ciencia, Justicia y Trabajo.
              </p>
              <p style={{ fontSize: '15px', color: 'var(--color-marfil)', lineHeight: '1.8', fontFamily: 'var(--font-montserrat)' }}>
                No es una religión ni está afiliada a ninguna. Se eleva sobre toda clase de diferencias para ofrecer a los amantes de la verdad un terreno de entendimiento mutuo y unión fraternal, admitiendo en su seno a personas de todas las creencias, profesiones y orígenes.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <Image src="/hombre-mason.png" alt="Hombre Masón" width={600} height={600} style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
            </AnimatedSection>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center' }}>
            <AnimatedSection style={{ order: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-oro)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-montserrat)' }}>
                    Fraternidad universal
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--color-marfil)', lineHeight: '1.7', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
                    Los masones de cualquier país y rito constituyen una sola familia humana. La fraternidad es uno de sus principios fundamentales.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-oro)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-montserrat)' }}>
                    Mejoramiento personal
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--color-marfil)', lineHeight: '1.7', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
                    Trabajamos sobre nuestra piedra bruta para esculpir una persona más justa, sabia y comprometida con el desarrollo de su comunidad.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-oro)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-montserrat)' }}>
                    Compromiso histórico
                  </h3>
                  <p style={{ fontSize: '15px', color: 'var(--color-marfil)', lineHeight: '1.7', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
                    Lejos del hermetismo absoluto, la masonería ha contribuido históricamente al progreso moral, intelectual y social de nuestra nación.
                  </p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200} style={{ order: 1 }}>
              <Image src="/herramientas-masonicas.png" alt="Herramientas Masónicas" width={600} height={600} style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
            </AnimatedSection>
          </div>

        </div>
      </section>

      {/* ADMISIÓN */}
      <section id="admision" style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', backgroundColor: 'var(--color-marfil)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Aumentamos el marginBottom para dar más aire antes del formulario */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center', marginBottom: 'clamp(5rem, 10vw, 8rem)' }}>
            <AnimatedSection>
               <Image src="/herramientas-masonicas-2.png" alt="Herramientas Masonicas 2" width={500} height={600} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p style={{ fontSize: '13px', color: 'var(--color-oro)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                Sumate
              </p>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '1.5rem', fontFamily: 'var(--font-baskerville)', lineHeight: '1.1' }}>
                ¿Cómo ingresar a la logia?
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--color-profundo)', lineHeight: '1.8', marginBottom: '3rem', fontFamily: 'var(--font-montserrat)' }}>
                Nuestra Logia es un espacio de libre pensamiento donde convergen hombres de distintas profesiones, edades y trasfondos. No buscamos uniformidad, sino la riqueza de la diversidad trabajando unida bajo los principios de Libertad, Igualdad y Fraternidad.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', backgroundColor: 'var(--color-gris)', opacity: 0.3 }}></div>
                
                {[
                  { num: '01', titulo: 'Requisitos básicos', texto: 'Ser mayor de edad, hombre libre y de buenas costumbres. No se requiere fortuna ni conocimientos excepcionales, sino un profundo anhelo de aprendizaje.' },
                  { num: '02', titulo: 'El proceso', texto: 'Podés comunicarte a través de esta web o ser presentado por un miembro del Taller. Tu solicitud será evaluada con respeto.' },
                  { num: '03', titulo: 'El compromiso', texto: 'El ingreso requiere disposición de tiempo para la asistencia a los trabajos de la Logia y estudio personal.' },
                ].map((item, i) => (
                  // Usamos alignItems: 'flex-start' para corregir el desfasaje del texto
                  <div key={i} style={{ display: 'flex', gap: '1.5rem', paddingBottom: i !== 2 ? '2.5rem' : '0', position: 'relative', zIndex: 1, alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-institucional)', 
                      color: 'var(--color-marfil)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: '700', flexShrink: 0, border: '4px solid var(--color-marfil)', fontSize: '14px',
                      marginTop: '-4px' // Sube apenas el círculo para alinear perfectamente con la altura de la fuente del título
                    }}>
                      {item.num}
                    </div>
                    <div> {/* Quitamos el padding-top que desfasaba el texto */}
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-montserrat)' }}>
                        {item.titulo}
                      </h3>
                      <p style={{ fontSize: '15px', color: 'var(--color-profundo)', lineHeight: '1.6', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
                        {item.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Recuadro CTA */}
          <AnimatedSection delay={300}>
            <div style={{ 
              backgroundColor: 'var(--color-profundo)', 
              borderRadius: '16px', 
              padding: 'clamp(3rem, 6vw, 4rem) 2rem', 
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid rgba(207, 181, 59, 0.2)'
            }}>
              <h3 style={{ fontSize: 'clamp(24px, 4vw, 28px)', color: 'var(--color-oro)', marginBottom: '1rem', fontFamily: 'var(--font-baskerville)' }}>
                ¿Deseás ingresar a la Masonería?
              </h3>
              <p style={{ color: 'var(--color-marfil)', fontSize: '16px', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.6', fontFamily: 'var(--font-montserrat)' }}>
                Completá nuestro formulario de contacto para iniciar tu ingreso a la Logia. Nos pondremos en contacto con vos a la brevedad.
              </p>
              <a 
                href="/formulario" 
                className="btn-cta"
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--color-oro)',
                  color: 'var(--color-profundo)',
                  padding: '14px 32px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '15px',
                  fontFamily: 'var(--font-montserrat)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
              >
                Completar Formulario
              </a>
            </div>
          </AnimatedSection>

        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" style={{ padding: 'clamp(4rem, 8vw, 8rem) 2rem', backgroundColor: 'var(--color-profundo)', borderTop: '4px solid var(--color-oro)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(3rem, 5vw, 4rem)', alignItems: 'center' }}>
          
          <AnimatedSection>
            <p style={{ fontSize: '13px', color: 'var(--color-oro)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
              Contacto
            </p>
            {/* Truco white-space: nowrap para "con nosotros" así nunca se separa */}
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 40px)', fontWeight: '700', color: 'var(--color-marfil)', marginBottom: '3rem', fontFamily: 'var(--font-baskerville)', lineHeight: '1.1' }}>
              Comunicate <span style={{ whiteSpace: 'nowrap' }}>con nosotros</span>
            </h2>
            
            <div className="grid-contacto">
              <CardContacto 
                icono="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" 
                rect={true}
                titulo="Instagram" 
                enlace="https://www.instagram.com/logia.union17/" 
              />
              <CardContacto 
                icono="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" 
                rect={false}
                titulo="Correo Oficial" 
                enlace="mailto:logiaunion17@yahoo.com.ar" 
              />
              <CardContacto 
                icono="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" 
                rect={false}
                titulo="Formulario Web" 
                enlace="https://forms.gle/v6qPGoHVB7wdT3KC6" 
              />
              <CardContacto 
                icono="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" 
                rect={false}
                titulo="Gran Logia Argentina" 
                enlace="https://masoneria-argentina.org.ar" 
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
             <Image 
               src="/medalla-fondo.png" 
               alt="Medalla Unión 17" 
               width={500} 
               height={500} 
               style={{ width: '100%', maxWidth: '380px', height: 'auto', margin: '0 auto', display: 'block' }} 
             />
          </AnimatedSection>

        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: 'var(--color-institucional)', padding: '4rem 2rem 2rem', textAlign: 'center', borderTop: '2px solid var(--color-oro)' }}>
        
        <Image src="/logo-union-17-blanco.png" alt="Logo Logia Unión N° 17" width={80} height={80} style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
        
        <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', color: 'var(--color-oro)', fontFamily: 'var(--font-baskerville)', letterSpacing: '0.15em', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
          Libertad · Igualdad · Fraternidad
        </p>

        <p style={{ fontSize: '13px', color: 'var(--color-marfil)', lineHeight: '1.8', marginBottom: '8px', fontFamily: 'var(--font-montserrat)' }}>
          Aug.·. y Resp.·. Log.·. Unión N° 17 · Rosario, Santa Fe, Argentina<br />
          Bajo los auspicios de la Gran Logia de la Argentina de Libres y Aceptados Masones
        </p>

        <div style={{ 
          marginTop: '4rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid rgba(248, 245, 240, 0.1)', 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem', 
          maxWidth: '1100px', 
          margin: '4rem auto 0' 
        }}>
          <p style={{ fontSize: '12px', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)', margin: 0, textAlign: 'left' }}>
             © {new Date().getFullYear()} Logia Unión N° 17. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)', margin: 0, textAlign: 'right' }}>
            Desarrollado por{' '}
            <a href="https://www.instagram.com/santaweb.studio/" target="_blank" rel="noopener noreferrer" className="link-gl" style={{ color: 'var(--color-marfil)', fontWeight: '600' }}>
              Santa | Web & UX Studio
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function CardContacto({ icono, rect, titulo, enlace }) {
  return (
    <a 
      href={enlace} 
      target={enlace.startsWith('http') ? "_blank" : "_self"} 
      rel="noopener noreferrer"
      className="contacto-card"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-oro)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {rect && <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>}
        <path d={icono}></path>
      </svg>
      <span style={{ color: 'var(--color-marfil)', fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-montserrat)', textAlign: 'center' }}>{titulo}</span>
    </a>
  )
}