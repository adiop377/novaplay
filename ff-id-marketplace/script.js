import Store from './store.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const idGrid = document.querySelector('.id-grid');
    const searchInput = document.getElementById('searchInput');
    const rankFilter = document.getElementById('rankFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = document.getElementById('priceValue');
    const resetFilters = document.getElementById('resetFilters');

    const cartOpenBtn = document.getElementById('cartOpenBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const authBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authModal = document.getElementById('authModal');
    const closeModal = document.querySelector('.close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    // 2. Product Rendering Logic
    function renderProducts() {
        const ids = Store.getIds();
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const selectedRank = rankFilter?.value || 'all';
        const maxPrice = parseInt(priceFilter?.value) || 20000;

        if (!idGrid) return;

        const filtered = ids.filter(id => {
            const matchesSearch = id.title.toLowerCase().includes(searchTerm) || id.rank.toLowerCase().includes(searchTerm);
            const matchesRank = selectedRank === 'all' || id.rank === selectedRank;
            const matchesPrice = id.price <= maxPrice;
            return matchesSearch && matchesRank && matchesPrice;
        });

        if (filtered.length === 0) {
            idGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                    <h3>No items match your filters</h3>
                    <p style="color: var(--text-dim)">Try adjusting your search criteria or price range.</p>
                </div>
            `;
            return;
        }

        idGrid.innerHTML = filtered.map((id, index) => `
            <div class="id-card fade-up active" style="transition-delay: ${index * 0.05}s">
                <div class="id-tag" ${id.rank === 'Master' ? 'style="background: var(--secondary-neon);"' : ''}>
                    ${id.tag}
                </div>
                <img src="${id.image}" alt="FF ID">
                <div class="id-details">
                    <h3>${id.title}</h3>
                    <div class="stats">
                        <span><i class="icon">🏆</i> ${id.rank}</span>
                        <span><i class="icon">🔥</i> LVL ${id.level}</span>
                    </div>
                    <div class="rare-skins">
                        ${id.skins.map(skin => `<span class="skin-tag">${skin}</span>`).join('')}
                    </div>
                    <div class="price-row">
                        <span class="price">₹${id.price.toLocaleString('en-IN')}</span>
                        <div class="card-actions">
                            <button class="btn-buy" onclick="handleBuyNow(${id.id})">Buy Now</button>
                            <button class="btn-icon" onclick="handleAddToCart(${id.id})">🛒</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 3. Cart Management
    function updateCartUI() {
        const cart = Store.getCart();
        if (cartCount) cartCount.textContent = cart.length;

        let total = 0;
        if (cartItemsList) {
            cartItemsList.innerHTML = cart.length ? cart.map(item => {
                total += item.price;
                return `
                    <div class="cart-item">
                        <img src="${item.image}" alt="">
                        <div class="cart-item-info">
                            <h4>${item.title}</h4>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                        </div>
                        <span class="remove-item" onclick="handleRemoveFromCart(${item.id})">&times;</span>
                    </div>
                `;
            }).join('') : `
                <div style="text-align: center; padding: 50px 20px; color: var(--text-dim);">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">🛒</div>
                    <p>Your cart is empty</p>
                </div>
            `;
        }

        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // 4. Notification Utility
    function showNotification(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'sale-toast';
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✅' : '🔔'}</div>
            <div class="toast-info">
                <strong>Notification</strong>
                <span>${msg}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('active'), 100);
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // 5. Auth Modal Logic
    function openAuthModal(tab) {
        if (!authModal) return;
        authModal.classList.add('active');
        switchTab(tab);
    }

    function switchTab(tab) {
        tabBtns.forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-tab') === tab) b.classList.add('active');
        });
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${tab}Form`) form.classList.add('active');
        });
    }

    // Event Handlers Setup
    if (authBtn) authBtn.addEventListener('click', () => openAuthModal('login'));
    if (registerBtn) registerBtn.addEventListener('click', () => openAuthModal('register'));
    if (closeModal) closeModal.addEventListener('click', () => authModal.classList.remove('active'));

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.remove('active');
        if (e.target === cartDrawer) cartDrawer.classList.remove('active');
    });

    tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));

    authForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = form.id === 'loginForm' ? 'Login' : 'Registration';
            showNotification(`${type} Success! Welcome to FF Market.`);
            authModal.classList.remove('active');
        });
    });

    // Shop Listeners
    [searchInput, rankFilter, priceFilter].forEach(el => {
        el?.addEventListener('input', () => {
            if (priceValue) priceValue.textContent = `₹${parseInt(priceFilter.value).toLocaleString('en-IN')}`;
            renderProducts();
        });
    });

    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (rankFilter) rankFilter.value = 'all';
            if (priceFilter) priceFilter.value = 20000;
            if (priceValue) priceValue.textContent = `₹20,000`;
            renderProducts();
        });
    }

    if (cartOpenBtn) cartOpenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cartDrawer.classList.add('active');
    });
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', () => cartDrawer.classList.remove('active'));

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = Store.getCart();
            if (cart.length === 0) {
                showNotification("Cart is empty!", "error");
                return;
            }
            showNotification("Processing payment...", "success");
            setTimeout(() => {
                showNotification("Order Confirmed! Check your Telegram.", "success");
                Store.clearCart();
                updateCartUI();
                cartDrawer.classList.remove('active');
            }, 2000);
        });
    }

    // Scroll Sticky Header
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '8px 0';
            header.style.background = 'rgba(5, 6, 8, 0.95)';
        } else {
            header.style.padding = '15px 0';
            header.style.background = 'rgba(5, 6, 8, 0.85)';
        }
    });

    // Global exposed functions for onclick
    window.handleBuyNow = (id) => {
        const product = Store.getIds().find(p => p.id === id);
        Store.addToCart(product);
        updateCartUI();
        cartDrawer.classList.add('active');
        showNotification(`${product.title} ready for checkout!`);
    };

    window.handleAddToCart = (id) => {
        const product = Store.getIds().find(p => p.id === id);
        if (Store.addToCart(product)) {
            showNotification(`${product.title} added to cart!`);
            updateCartUI();
        } else {
            showNotification(`Item already in cart!`);
        }
    };

    window.handleRemoveFromCart = (id) => {
        Store.removeFromCart(id);
        updateCartUI();
    };

    // Initialize
    renderProducts();
    updateCartUI();
});
