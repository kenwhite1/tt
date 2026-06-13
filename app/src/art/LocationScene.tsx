// Location backdrop scene, built by the art module agent.
interface Props { sky?: string; ground?: string; accent?: string; children?: React.ReactNode }

export function LocationScene({ sky = '#cfe6f5', ground = '#d7e8bf', children }: Props) {
 return (
 <div style={{ background: `linear-gradient(${sky} 0%, ${ground} 100%)`, borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: 16, position: 'relative' }}>
 {children}
 </div>
 )
}
