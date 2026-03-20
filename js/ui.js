// -----------------------------
// UI behaviors: navigation & header
// -----------------------------
// Adds interactive UI behavior once the DOM is fully loaded, including:
// - Smooth scrolling for in-page navigation links
// - Automatically hiding the header while scrolling down
// - Revealing the header when scrolling up
// - Temporarily showing the header when the cursor approaches the top edge
//
// Wrapped in `DOMContentLoaded` to ensure all DOM elements exist
// before querying or attaching event listeners.
document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    // -----------------------------
    // Hamburger menu toggle (mobile)
    // -----------------------------
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("nav-links");

    function closeMenu() {
        navLinks?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
    }

    navToggle?.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close when any nav link is tapped
    navLinks?.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeMenu();
    });

    // -----------------------------
    // Smooth scrolling for anchor links
    // -----------------------------
    // Intercepts in-page navigation clicks and scrolls smoothly
    // to the target section instead of jumping instantly.
    document.addEventListener("click", (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const headerHeight = header.offsetHeight;
        const extraGap = 12;
        const y =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            headerHeight -
            extraGap;

        window.scrollTo({ top: y, behavior: "smooth" });
    });

    // -----------------------------
    // Header visibility based on scroll direction
    // -----------------------------
    // Hides the header when scrolling down and shows it again
    // when the user scrolls upward.
    let lastY = window.scrollY;
    let hidden = false;

    function onScroll() {
        const y = window.scrollY;
        const goingDown = y > lastY;

        // Hide header after a small scroll threshold
        if (y > 80 && goingDown && !hidden) {
            header.classList.add("is-hidden");
            header.classList.remove("is-peek");
            hidden = true;
            closeMenu();
        }

        // Reveal header when scrolling upward
        if (!goingDown && hidden) {
            header.classList.remove("is-hidden");
            hidden = false;
        }

        lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // -----------------------------
    // Header peek on cursor proximity
    // -----------------------------
    // Temporarily reveals the hidden header when the user's
    // cursor moves near the top of the viewport.
    document.addEventListener("mousemove", (e) => {
        const nearTop = e.clientY <= 74;
        if (nearTop) header.classList.add("is-peek");
        else header.classList.remove("is-peek");
    });
});
