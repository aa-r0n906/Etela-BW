// ChobeKasane Domestic Tourism Platform - Interactive Search, Tier Filtering & Trip Cart

const CART_STORAGE_KEY = 'chobe_kasane_trip_cart_v2';
let currentTierFilter = 'all';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderCartUI();
}

function addToCart(id, name, price, unit) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, unit, qty: 1 });
    }
    saveCart(cart);
    showToast(`Added "${name}" to Trip Cart`);
}

function updateQty(id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    saveCart(cart);
}

function removeFromCart(id) {
    const cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
}

function clearCart() {
    saveCart([]);
}

function renderCartUI() {
    const cart = getCart();
    const countEl = document.getElementById('cartCount');
    const totalItemsEl = document.getElementById('cartTotalItems');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    const container = document.getElementById('cartItemsContainer');

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (countEl) countEl.textContent = totalQty;
    if (totalItemsEl) totalItemsEl.textContent = totalQty;
    if (totalPriceEl) totalPriceEl.textContent = `BWP ${totalAmount.toLocaleString()}`;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p style="font-size:2rem; margin-bottom:0.5rem;">🧳</p>
                <p><strong>Your Trip Cart is empty</strong></p>
                <p style="font-size:0.85rem; margin-top:0.35rem;">Click "+ Add to Trip" on any accommodation or activity to calculate your citizen package price.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-top">
                <span class="cart-item-title">${item.name}</span>
                <button class="cart-remove" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
            <div style="font-size:0.8rem; color:#475569; margin-bottom:0.5rem;">
                BWP ${item.price.toLocaleString()} / ${item.unit}
            </div>
            <div class="cart-item-bottom">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
                    <span style="font-size:0.88rem; font-weight:600;">${item.qty} ${item.unit}${item.qty > 1 ? 's' : ''}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
                <span class="cart-item-subtotal">BWP ${(item.price * item.qty).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (drawer && backdrop) {
        drawer.classList.toggle('open');
        backdrop.classList.toggle('open');
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('open');
}

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2600);
}

// Hero Search Bar Handler -> Routes to Accommodations or Activities with query & preference tier
function handleHeroSearch(event) {
    event.preventDefault();
    const query = document.getElementById('heroSearchInput').value.trim();
    const tier = document.getElementById('heroTierSelect').value;

    const activityKeywords = ['cruise', 'boat', 'game drive', 'safari', 'walk', 'tour', 'activity'];
    const isActivity = activityKeywords.some(kw => query.toLowerCase().includes(kw));
    const targetPage = isActivity ? 'activities.html' : 'accommodations.html';

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tier && tier !== 'all') params.set('tier', tier);

    const qs = params.toString();
    window.location.href = qs ? `${targetPage}?${qs}` : targetPage;
}

// Subpage Preference Tier Tabs & Search Filtering
function setTierFilter(tier, btnElement) {
    currentTierFilter = tier;
    document.querySelectorAll('.tier-tab').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    applyPageFilters();
}

function applyPageFilters() {
    const searchInput = document.getElementById('pageSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('#filterableGrid .listing-card');
    const emptyState = document.getElementById('emptyFilterState');

    let visibleCount = 0;
    cards.forEach(card => {
        const cardTier = card.getAttribute('data-tier');
        const cardText = card.innerText.toLowerCase();

        const matchesTier = (currentTierFilter === 'all' || cardTier === currentTierFilter);
        const matchesQuery = (!query || cardText.includes(query));

        if (matchesTier && matchesQuery) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function resetPageFilters() {
    const searchInput = document.getElementById('pageSearchInput');
    if (searchInput) searchInput.value = '';
    const allBtn = document.querySelector('.tier-tab[data-tier="all"]');
    setTierFilter('all', allBtn);
}

// Contact Form Validation (Supports 8-digit local & +267 Botswana numbers)
function handleFormSubmit(event) {
    event.preventDefault();
    const phone = document.getElementById('phone').value.trim();
    const errorEl = document.getElementById('formError');
    const successEl = document.getElementById('formSuccess');

    const bwPhoneRegex = /^(\+267\s?)?[7][0-9]{7}$/;
    if (!bwPhoneRegex.test(phone.replace(/\s+/g, ''))) {
        errorEl.textContent = 'Please enter a valid Botswana mobile number (e.g., 71234567 or +267 71234567).';
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
        return;
    }

    errorEl.style.display = 'none';
    successEl.style.display = 'block';
    document.getElementById('enquiryForm').reset();
}

// Initialize URL Parameters & Cart State on Load
window.addEventListener('DOMContentLoaded', () => {
    renderCartUI();

    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    const tierParam = params.get('tier');
    const listingParam = params.get('listing') || params.get('activity');
    const fromCart = params.get('fromCart');

    // Apply search query if passed from index hero
    const pageSearch = document.getElementById('pageSearchInput');
    if (pageSearch && qParam) {
        pageSearch.value = qParam;
    }

    // Apply tier filter if passed via URL
    if (tierParam && document.getElementById('filterableGrid')) {
        const targetBtn = document.querySelector(`.tier-tab[data-tier="${tierParam}"]`);
        setTierFilter(tierParam, targetBtn);
    } else if (qParam && document.getElementById('filterableGrid')) {
        applyPageFilters();
    }

    // Populate Contact Page with Cart Summary or Direct Listing
    const msgField = document.getElementById('message');
    if (msgField) {
        const cart = getCart();
        if (cart.length > 0 && (fromCart || !listingParam)) {
            const previewBox = document.getElementById('enquiryCartPreview');
            const summaryList = document.getElementById('enquiryCartSummaryList');
            const totalEl = document.getElementById('enquiryCartTotal');
            const tierSelect = document.getElementById('preferenceTier');

            if (tierSelect) tierSelect.value = 'Mixed';

            let total = 0;
            const lines = cart.map(item => {
                const sub = item.price * item.qty;
                total += sub;
                return `• ${item.name} — ${item.qty} ${item.unit}(s) = BWP ${sub.toLocaleString()}`;
            });

            if (previewBox && summaryList && totalEl) {
                previewBox.style.display = 'block';
                summaryList.innerHTML = lines.map(l => `<p style="font-size:0.84rem; margin-bottom:0.25rem;">${l}</p>`).join('');
                totalEl.textContent = `Estimated Total: BWP ${total.toLocaleString()}`;
            }

            msgField.value = `Hello, I would like to enquire about booking the following citizen-rate itinerary:\n\n${lines.join('\n')}\n\nEstimated Total: BWP ${total.toLocaleString()}\nPlease confirm availability.`;
        } else if (listingParam) {
            msgField.value = `Hello, I would like to enquire about citizen rates and availability for: ${listingParam}.`;
        }
    }
});
