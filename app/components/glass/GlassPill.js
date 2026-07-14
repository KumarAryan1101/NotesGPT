/**
 * GlassPill — liquid-glass rounded-full container (nav bars, chips, input shells).
 */
export default function GlassPill({ children, className = "", ...props }) {
  return (
    <div className={`liquid-glass rounded-full ${className}`} {...props}>
      {children}
    </div>
  );
}
