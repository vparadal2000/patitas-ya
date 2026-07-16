let products = [];
let cart = JSON.parse(localStorage.getItem("patitasYaCartV2")) || [];
let selectedCategory = "Todos";
let searchTerm = "";
let currentSort = "recommended";

const $ = id => document.getElementById(id);
const formatCLP = value => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(value);

async function loadProducts(){
  try{
    const response = await fetch("productos.json");
    if(!response.ok) throw new Error("No se pudo cargar productos.json");
    products = await response.json();
    fillBrands();
    renderProducts();
    renderCart();
  }catch(error){
    $("resultsCount").textContent = "No fue posible cargar el catálogo.";
    $("productGrid").innerHTML = `<div class="empty"><h3>Error al cargar productos</h3><p>${error.message}</p></div>`;
  }
}

function fillBrands(){
  const brands = [...new Set(products.map(p=>p.brand))].sort();
  $("brandFilter").innerHTML = `<option value="Todas">Todas las marcas</option>`+
    brands.map(b=>`<option value="${b}">${b}</option>`).join("");
}

function stockStatus(stock){
  if(stock<=0) return {text:"Sin stock",class:"out-stock"};
  if(stock<=3) return {text:"Poco stock",class:"low-stock"};
  return {text:"Disponible",class:""};
}

function filteredProducts(){
  const brand = $("brandFilter").value;
  const stock = $("stockFilter").value;
  const maxPrice = Number($("priceFilter").value);

  let data = products.filter(p=>{
    const text = `${p.name} ${p.brand} ${p.category} ${p.stage} ${p.weight}`.toLowerCase();
    const categoryMatch = selectedCategory==="Todos" || p.category===selectedCategory ||
      (selectedCategory==="Perros" && `${p.stage} ${p.name}`.toLowerCase().includes("perro")) ||
      (selectedCategory==="Gatos" && `${p.stage} ${p.name}`.toLowerCase().includes("gato"));
    const stockMatch = stock==="Todos" ||
      (stock==="Disponible" && p.stock>0) ||
      (stock==="Poco stock" && p.stock>0 && p.stock<=3);
    return categoryMatch && text.includes(searchTerm.toLowerCase()) &&
      (brand==="Todas" || p.brand===brand) && stockMatch && p.price<=maxPrice;
  });

  if(currentSort==="priceAsc") data.sort((a,b)=>a.price-b.price);
  if(currentSort==="priceDesc") data.sort((a,b)=>b.price-a.price);
  if(currentSort==="name") data.sort((a,b)=>a.name.localeCompare(b.name));
  if(currentSort==="recommended") data.sort((a,b)=>Number(b.featured)-Number(a.featured));
  return data;
}

function renderProducts(){
  const data = filteredProducts();
  $("resultsCount").textContent = `${data.length} producto${data.length===1?"":"s"}`;
  $("emptyState").classList.toggle("hidden",data.length>0);
  $("productGrid").innerHTML = data.map(p=>{
    const status=stockStatus(p.stock);
    return `<article class="product-card">
      <div class="product-image" onclick="openProduct(${p.id})">
        ${p.featured?'<span class="badge">Destacado</span>':""}
        <span class="stock-badge ${status.class}">${status.text}</span>
        <img src="${p.image}" alt="${p.name}" onerror="this.classList.add('image-error')">
        <div class="image-placeholder">Sube la imagen:<br><strong>${p.image}</strong></div>
      </div>
      <div class="product-info">
        <span class="meta">${p.brand} · ${p.weight}</span>
        <h3 onclick="openProduct(${p.id})">${p.name}</h3>
        <p>${p.stage}</p>
        <div class="price-row"><span class="price">${formatCLP(p.price)}</span>${p.oldPrice?`<span class="old-price">${formatCLP(p.oldPrice)}</span>`:""}</div>
        <div class="product-actions">
          <button class="detail-button" onclick="openProduct(${p.id})">Ver detalles</button>
          <button class="add-button" onclick="addToCart(${p.id})" ${p.stock<=0?"disabled":""}>+</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

function openProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;
  const status=stockStatus(p.stock);
  $("productDetail").innerHTML=`<div class="product-detail">
    <div class="detail-image"><img src="${p.image}" alt="${p.name}"></div>
    <div class="detail-copy">
      <span class="meta">${p.brand} · ${p.category} · ${p.weight}</span>
      <h2>${p.name}</h2>
      <span class="stock-badge ${status.class}" style="position:static;display:inline-block">${status.text}</span>
      <p class="description">${p.description}</p>
      <strong>Características</strong>
      <ul>${p.benefits.map(b=>`<li>${b}</li>`).join("")}</ul>
      <div class="price-row"><span class="price">${formatCLP(p.price)}</span>${p.oldPrice?`<span class="old-price">${formatCLP(p.oldPrice)}</span>`:""}</div>
      <button class="add-detail" onclick="addToCart(${p.id});closeModal('productModal')" ${p.stock<=0?"disabled":""}>Agregar al carrito</button>
    </div>
  </div>`;
  openModal("productModal");
}

function addToCart(id){
  const p=products.find(x=>x.id===id);
  if(!p || p.stock<=0)return;
  const existing=cart.find(x=>x.id===id);
  if(existing && existing.quantity<p.stock) existing.quantity++;
  else if(!existing) cart.push({id,quantity:1});
  saveCart();
}

function changeQuantity(id,delta){
  const item=cart.find(x=>x.id===id);
  const product=products.find(x=>x.id===id);
  if(!item||!product)return;
  item.quantity=Math.min(item.quantity+delta,product.stock);
  if(item.quantity<=0) cart=cart.filter(x=>x.id!==id);
  saveCart();
}

function saveCart(){
  localStorage.setItem("patitasYaCartV2",JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const detail=cart.map(i=>({...products.find(p=>p.id===i.id),quantity:i.quantity})).filter(x=>x.id);
  const count=detail.reduce((s,x)=>s+x.quantity,0);
  const total=detail.reduce((s,x)=>s+x.price*x.quantity,0);
  $("cartCount").textContent=count;
  $("cartTotal").textContent=formatCLP(total);
  $("cartEmpty").classList.toggle("hidden",detail.length>0);
  $("cartItems").innerHTML=detail.map(x=>`<div class="cart-item">
    <img src="${x.image}" alt="${x.name}">
    <div><h4>${x.name}</h4><small>${formatCLP(x.price)} c/u</small></div>
    <div class="quantity"><button onclick="changeQuantity(${x.id},-1)">−</button><strong>${x.quantity}</strong><button onclick="changeQuantity(${x.id},1)">+</button></div>
  </div>`).join("");
}

function openDrawer(){
  $("cartDrawer").classList.add("open");
  $("overlay").classList.add("show");
  document.body.style.overflow="hidden";
}
function closeDrawer(){
  $("cartDrawer").classList.remove("open");
  if(!document.querySelector(".modal.open") && !$("filterPanel").classList.contains("open")) $("overlay").classList.remove("show");
  document.body.style.overflow="";
}
function openModal(id){
  $(id).classList.add("open");
  $("overlay").classList.add("show");
  document.body.style.overflow="hidden";
}
function closeModal(id){
  $(id).classList.remove("open");
  if(!$("cartDrawer").classList.contains("open") && !$("filterPanel").classList.contains("open")) $("overlay").classList.remove("show");
  document.body.style.overflow="";
}
function openFilters(){
  $("filterPanel").classList.add("open");
  $("overlay").classList.add("show");
}
function closeFilters(){
  $("filterPanel").classList.remove("open");
  if(!$("cartDrawer").classList.contains("open") && !document.querySelector(".modal.open")) $("overlay").classList.remove("show");
}

$("searchInput").addEventListener("input",e=>{searchTerm=e.target.value;renderProducts()});
$("sortSelect").addEventListener("change",e=>{currentSort=e.target.value;renderProducts()});
$("brandFilter").addEventListener("change",renderProducts);
$("stockFilter").addEventListener("change",renderProducts);
$("priceFilter").addEventListener("input",e=>{$("priceLabel").textContent=`Hasta ${formatCLP(Number(e.target.value))}`;renderProducts()});
$("categoryButtons").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  document.querySelectorAll(".categories button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");selectedCategory=b.dataset.category;renderProducts();
});
$("clearFilters").addEventListener("click",()=>{
  $("brandFilter").value="Todas";$("stockFilter").value="Todos";$("priceFilter").value=60000;
  $("priceLabel").textContent="Hasta $60.000";searchTerm="";$("searchInput").value="";renderProducts();
});
$("openCart").addEventListener("click",openDrawer);
$("closeCart").addEventListener("click",closeDrawer);
$("openCheckout").addEventListener("click",()=>{
  if(!cart.length){alert("Agrega productos al carrito.");return}
  closeDrawer();openModal("checkoutModal");
});
$("toggleFilters").addEventListener("click",openFilters);
$("closeFilters").addEventListener("click",closeFilters);
$("overlay").addEventListener("click",()=>{
  closeDrawer();closeFilters();document.querySelectorAll(".modal.open").forEach(m=>closeModal(m.id));
});
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.closeModal)));

$("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  const detail=cart.map(i=>({...products.find(p=>p.id===i.id),quantity:i.quantity})).filter(x=>x.id);
  const total=detail.reduce((s,x)=>s+x.price*x.quantity,0);
  const lines=detail.map(x=>`• ${x.quantity} x ${x.name} (${x.weight}) — ${formatCLP(x.price*x.quantity)}`).join("\n");
  const message=`Hola Patitas Ya 🐾

Quiero realizar el siguiente pedido:

${lines}

Total estimado: ${formatCLP(total)}

Nombre: ${$("customerName").value}
Sector o dirección: ${$("customerAddress").value}
Forma de pago: ${$("paymentMethod").value}
Observaciones: ${$("customerNotes").value || "Sin observaciones"}

Quedo atento/a a la confirmación de stock y despacho.`;

  // CAMBIA ESTE NÚMERO por el WhatsApp real, con código de país y sin el signo +.
  const phone="56900000000";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,"_blank");
});

loadProducts();