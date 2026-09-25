/**
 * A template, unlike a layout, is remounted on every navigation. That makes it
 * the one place where "a new tab just opened" can be expressed without any
 * JavaScript: the wrapper is a fresh element each time, so its CSS entry
 * animation plays each time.
 *
 * The header and footer live in the layout, above this, so they stay put while
 * only the page underneath settles in. The animation is transform-only (see
 * .page-enter in globals.css): it never changes opacity, so nothing on the page
 * is ever invisible, and it cannot delay the largest paint.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
