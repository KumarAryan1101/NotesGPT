/**
 * GlassCard — liquid-glass container. Pass `rounded` to override radius.
 */
export default function GlassCard({
  children,
  className = "",
  rounded = "rounded-3xl",
  ...props
}) {
  return (
    <div className={`liquid-glass ${rounded} ${className}`} {...props}>
      {children}
    </div>
  );
}
