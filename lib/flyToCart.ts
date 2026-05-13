/**
 * flyToCart — "Add to cart" flying image animation.
 *
 * Usage:
 *   flyToCart(buttonElement, imageUrl)
 *
 * The cart icon must have id="cart-icon" in the DOM.
 */
export function flyToCart(
  sourceEl: HTMLElement,
  imageUrl?: string,
  cartIconId = "cart-icon"
): void {
  const cartEl = document.getElementById(cartIconId);
  if (!cartEl || typeof window === "undefined") return;

  const sourceRect = sourceEl.getBoundingClientRect();
  const cartRect   = cartEl.getBoundingClientRect();

  // ── Create the flying "pill" ───────────────────────────────────
  const SIZE = 52;

  const flyer = document.createElement("div");
  flyer.style.cssText = [
    "position:fixed",
    `z-index:99999`,
    "pointer-events:none",
    `width:${SIZE}px`,
    `height:${SIZE}px`,
    "border-radius:50%",
    "overflow:hidden",
    "box-shadow:0 4px 16px rgba(0,0,0,.25)",
    "border:2.5px solid #111827",
    "background:#f9fafb",
    // Start position (center of source button)
    `left:${sourceRect.left + sourceRect.width  / 2 - SIZE / 2}px`,
    `top: ${sourceRect.top  + sourceRect.height / 2 - SIZE / 2}px`,
  ].join(";");

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    flyer.appendChild(img);
  } else {
    // Fallback: shopping cart icon (SVG)
    flyer.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111827;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
             fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </div>`;
  }

  document.body.appendChild(flyer);

  // ── Destination: center of cart icon ──────────────────────────
  const endX = cartRect.left + cartRect.width  / 2 - SIZE / 2;
  const endY = cartRect.top  + cartRect.height / 2 - SIZE / 2;

  // Arc control point — shoot up then curve into cart
  const startX = sourceRect.left + sourceRect.width  / 2 - SIZE / 2;
  const startY = sourceRect.top  + sourceRect.height / 2 - SIZE / 2;
  const arcY   = Math.min(startY, endY) - 120; // apex of the arc

  // ── Web Animations API — parabolic path ───────────────────────
  const anim = flyer.animate(
    [
      // Start: full size, opaque
      {
        left:      `${startX}px`,
        top:       `${startY}px`,
        transform: "scale(1)",
        opacity:   "1",
      },
      // Mid arc: apex, slightly smaller
      {
        left:      `${(startX + endX) / 2}px`,
        top:       `${arcY}px`,
        transform: "scale(0.75)",
        opacity:   "0.95",
        offset:    0.45,
      },
      // Land: tiny, fade out right as it hits the cart
      {
        left:      `${endX}px`,
        top:       `${endY}px`,
        transform: "scale(0.15)",
        opacity:   "0",
      },
    ],
    {
      duration: 640,
      easing:   "cubic-bezier(.4,0,.2,1)",
      fill:     "forwards",
    }
  );

  anim.onfinish = () => {
    flyer.remove();
    // Bounce the cart icon to confirm receipt
    cartEl.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.45)" },
        { transform: "scale(0.85)" },
        { transform: "scale(1.15)" },
        { transform: "scale(1)" },
      ],
      { duration: 380, easing: "ease-out" }
    );
  };
}
