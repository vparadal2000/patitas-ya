const products = [
  {
    id: 1,
    name: "Alimento Premium Perro Adulto",
    category: "Perros",
    description: "Bolsa de 15 kg, fórmula completa para perros adultos.",
    price: 32990,
    emoji: "🐶",
    badge: "Más vendido"
  },
  {
    id: 2,
    name: "Alimento Gato Adulto",
    category: "Gatos",
    description: "Bolsa de 10 kg, sabor pollo y salmón.",
    price: 28990,
    emoji: "🐱",
    badge: "Destacado"
  },
  {
    id: 3,
    name: "Snack Dental para Perros",
    category: "Snacks",
    description: "Ayuda al cuidado dental y combate el mal aliento.",
    price: 4990,
    emoji: "🦴",
    badge: ""
  },
  {
    id: 4,
    name: "Arena Sanitaria Aglomerante",
    category: "Higiene",
    description: "Arena de alta absorción, formato 10 kg.",
    price: 8990,
    emoji: "🪣",
    badge: "Oferta"
  },
  {
    id: 5,
    name: "Correa Reforzada",
    category: "Accesorios",
    description: "Correa resistente para paseos seguros.",
    price: 6990,
    emoji: "🦮",
    badge: ""
  },
  {
    id: 6,
    name: "Snack Cremoso para Gatos",
    category: "Snacks",
    description: "Pack de premios cremosos, sabor atún.",
    price: 3990,
    emoji: "🐟",
    badge: ""
  },
  {
    id: 7,
    name: "Shampoo Suave para Mascotas",
    category: "Higiene",
    description: "Limpieza suave para perros y gatos, 500 ml.",
    price: 5990,
    emoji: "🧴",
    badge: ""
  },
  {
    id: 8,
    name: "Cama Acolchada Mediana",
    category: "Accesorios",
    description: "Cama cómoda y lavable para mascotas medianas.",
    price: 18990,
    emoji: "🛏️",
    badge: "Nuevo"
  }
];

let selectedCategory = "Todos";
let searchTerm = "";
let sortType = "default";
let cart = JSON.parse(localStorage.getItem("patitasYaCart")) || [];

const productGrid = document.getElementById("productGrid");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const categoryButtons = document.getElementById("categoryButtons");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

function formatCLP(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

function getFilteredProducts() {
  let filtered = products.filter(product => {
    const matchesCategory =
      selectedCategory === "Todos" ||
      product.category === selectedCategory ||
      (selectedCategory === "Perros" && product.name.toLowerCase().includes("perro")) ||
      (selectedCategory === "Gatos" && product.name.toLowerCase().includes("gato"));

    const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (sortType === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sortType === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sortType === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return filtered;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image">
        ${product.badge ? `<span class="badge">${product.badge}</span>` : ""}
        <span aria-hidden="true">${product.emoji}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <span class="product-price">${formatCLP(product.price)}</span>
          <button class="add-button" onclick="addToCart(${product.id})" aria-label="Agregar ${product.name}">
            +
          </button>
        </div>
      </div>
    </article>
  `).join("");

  resultsCount.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;
  emptyState.classList.toggle("hidden", filtered.length > 0);
}

function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveAndRenderCart();
  openCart();
}

function changeQuantity(productId, amount) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(cartItem => cartItem.id !== productId);
  }

  saveAndRenderCart();
}

function saveAndRenderCart() {
  localStorage.setItem("patitasYaCart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const detailedCart = cart.map(item => ({
    ...products.find(product => product.id === item.id),
    quantity: item.quantity
  }));

  const totalItems = detailedCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = detailedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalItems;
  cartTotal.textContent = formatCLP(totalPrice);

  cartItems.innerHTML = detailedCart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">${item.emoji}</div>
      <div>
        <h4>${item.name}</h4>
        <span class="cart-item-price">${formatCLP(item.price)} c/u</span>
      </div>
      <div class="quantity-control">
        <button onclick="changeQuantity(${item.id}, -1)" aria-label="Quitar uno">−</button>
        <strong>${item.quantity}</strong>
        <button onclick="changeQuantity(${item.id}, 1)" aria-label="Agregar uno">+</button>
      </div>
    </div>
  `).join("");

  cartEmpty.classList.toggle("hidden", detailedCart.length > 0);
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Agrega productos al carrito antes de enviar tu pedido.");
    return;
  }

  const detailedCart = cart.map(item => ({
    ...products.find(product => product.id === item.id),
    quantity: item.quantity
  }));

  const totalPrice = detailedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const detail = detailedCart
    .map(item => `• ${item.quantity} x ${item.name} — ${formatCLP(item.price * item.quantity)}`)
    .join("\n");

  const message = `Hola Patitas Ya 🐾\n\nQuiero realizar el siguiente pedido:\n${detail}\n\nTotal estimado: ${formatCLP(totalPrice)}\n\nMi dirección es: `;

  // Reemplazar por el número real de Patitas Ya, con código de país y sin +.
  const phone = "56900000000";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value;
  renderProducts();
});

sortSelect.addEventListener("change", event => {
  sortType = event.target.value;
  renderProducts();
});

categoryButtons.addEventListener("click", event => {
  const button = event.target.closest(".category");
  if (!button) return;

  document.querySelectorAll(".category").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  selectedCategory = button.dataset.category;
  renderProducts();
});

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("checkoutButton").addEventListener("click", checkoutWhatsApp);
overlay.addEventListener("click", closeCart);

renderProducts();
renderCart();
