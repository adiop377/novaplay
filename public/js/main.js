// FF Marketplace - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Update cart count on page load
    updateCartCount();

    // Price filter display update
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = document.getElementById('priceValue');

    if (priceFilter && priceValue) {
        priceFilter.addEventListener('input', () => {
            priceValue.textContent = '₹' + parseInt(priceFilter.value).toLocaleString('en-IN');
        });
    }

    // Auto-hide flash messages
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.padding = '8px 0';
                header.style.background = 'rgba(5, 6, 8, 0.95)';
            } else {
                header.style.padding = '15px 0';
                header.style.background = 'rgba(5, 6, 8, 0.85)';
            }
        });
    }

    // Scroll Reveal Animation (Motion Graphics)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });
});

// Update cart count from API
async function updateCartCount() {
    try {
        const response = await fetch('/cart/api/count');
        const data = await response.json();
        const cartBadge = document.getElementById('cartCount');
        if (cartBadge) {
            cartBadge.textContent = data.count || 0;
        }
    } catch (error) {
        console.log('Could not fetch cart count');
    }
}

// Add to cart with AJAX
async function addToCart(productId) {
    try {
        const response = await fetch(`/cart/add/${productId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Update cart badge
            const cartBadge = document.getElementById('cartCount');
            if (cartBadge) {
                cartBadge.textContent = data.cartCount;
            }
            showNotification('Added to cart!', 'success');
        } else {
            showNotification(data.error || 'Could not add to cart', 'error');
        }
    } catch (error) {
        // If not logged in, redirect to login
        window.location.href = '/login';
    }
}

// Show notification toast
function showNotification(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'sale-toast';
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</div>
        <div class="toast-info">
            <strong>${type === 'success' ? 'Success' : 'Notice'}</strong>
            <span>${msg}</span>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
