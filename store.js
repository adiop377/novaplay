// LocalStorage Helper for App State
const Store = {
    // Initial Data Seed
    seed() {
        if (!localStorage.getItem('ff_ids')) {
            const initialIds = [
                {
                    id: 1,
                    title: "Grandmaster | Level 78",
                    rank: "Grandmaster",
                    level: 78,
                    price: 12499,
                    skins: ["Sakura Bundle", "Hip Hop", "M1014 Green Flame"],
                    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
                    isSold: false,
                    tag: "RARE BUNDLE"
                },
                {
                    id: 2,
                    title: "Master | Level 72",
                    rank: "Master",
                    level: 72,
                    price: 8999,
                    skins: ["AK Blue Flame", "MP40 Cobra", "Arctic Blue"],
                    image: "https://images.unsplash.com/photo-1614027164847-1b2809eb189d?auto=format&fit=crop&q=80&w=400",
                    isSold: false,
                    tag: "EVO GUN MAX"
                },
                {
                    id: 3,
                    title: "OG Account | S1-S5",
                    rank: "Diamond",
                    level: 65,
                    price: 15000,
                    skins: ["S1 Jacket", "Criminal Bundle", "Angelical Pant"],
                    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=400",
                    isSold: false,
                    tag: "LEGACY ID"
                }
            ];
            localStorage.setItem('ff_ids', JSON.stringify(initialIds));
        }

        if (!localStorage.getItem('ff_cart')) {
            localStorage.setItem('ff_cart', JSON.stringify([]));
        }

        if (!localStorage.getItem('ff_orders')) {
            localStorage.setItem('ff_orders', JSON.stringify([]));
        }

        if (!localStorage.getItem('ff_users')) {
            localStorage.setItem('ff_users', JSON.stringify([]));
        }
    },

    // Getters
    getIds() {
        return JSON.parse(localStorage.getItem('ff_ids')) || [];
    },

    getCart() {
        return JSON.parse(localStorage.getItem('ff_cart')) || [];
    },

    // Setters
    updateIds(ids) {
        localStorage.setItem('ff_ids', JSON.stringify(ids));
    },

    addToCart(item) {
        const cart = this.getCart();
        if (!cart.find(i => i.id === item.id)) {
            cart.push(item);
            localStorage.setItem('ff_cart', JSON.stringify(cart));
            return true;
        }
        return false;
    },

    removeFromCart(id) {
        const cart = this.getCart().filter(i => i.id !== id);
        localStorage.setItem('ff_cart', JSON.stringify(cart));
    },

    clearCart() {
        localStorage.setItem('ff_cart', JSON.stringify([]));
    }
};

Store.seed();
export default Store;
