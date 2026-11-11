import { createPortal } from "react-dom";

// Renders overlays (modals, lightboxes) directly in <body>. Without this a modal
// inherits the stacking context / clipping of whatever card it was written in
// (backdrop-blur and overflow-hidden ancestors trap `position: fixed` children)
// and the site's sticky Navbar can end up on top of it.
export default function Portal({ children }) {
  if (typeof document === "undefined") return children; // server render / tests
  return createPortal(children, document.body);
}
