const CONFIG={
  whatsapp:"56956736785",
  productsUrl:"data/productos.json",
  pageSize:24
};

let products=[];
let cart=JSON.parse(localStorage.getItem("patitasYaCartModern"))||[];
let visibleCount=CONFIG.pageSize;
let searchTerm="";

const $=id=>document.getElementById(id);
const money=value=>value==null?"Consultar":new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(value);

async function init(){
  try{
    const response=await fetch(CONFIG.productsUrl);
    if(!response.ok)throw new Error("No se pudo cargar productos.json");
    products=await response.json();
    buildFilters();
    renderCategories();
    renderFeatured();
    renderProducts();
    renderCart();
    $("coverageWhatsapp").href=`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, quisiera consultar si tienen delivery a mi sector.")}`;
  }catch(error){
    console.error(error);
    $("resultsCount").textContent="No fue posible cargar el catálogo.";
  }
}

function buildFilters(){
  const categories=[...new Set(products.map(p=>p.category))].sort();
  const brands=[...new Set(products.map(p=>p.brand))].sort();
  $("categoryFilter").innerHTML='<option value="Todas">Todas</option>'+categories.map(x=>`<option>${x}</option>`).join("");
  $("brandFilter").innerHTML='<option value="Todas">Todas</option>'+brands.map(x=>`<option>${x}</option>`).join("");
}

function renderCategories(){
  const icons={Perros:"🐶",Gatos:"🐱",Higiene:"🧼",Snacks:"🦴",Aves:"🐦",Roedores:"🐰"};
  const counts={};
  products.forEach(p=>counts[p.category]=(counts[p.category]||0)+1);
  $("categoryGrid").innerHTML=Object.entries(counts).map(([category,count])=>`
    <button class="category-card" onclick="chooseCategory('${category}')">
      <span>${icons[category]||"🐾"}</span>
      <strong>${category}</strong>
      <small>${count} productos</small>
    </button>`).join("");
}

function chooseCategory(category){
  $("categoryFilter").value=category;
  visibleCount=CONFIG.pageSize;
  renderProducts();
  $("catalogo").scrollIntoView({behavior:"smooth"});
}

function imageMarkup(p,context=""){
  return `<img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('image-error')">
    <div class="image-fallback"><div>Agrega la imagen:<br><strong>${p.image.split("/").pop()}</strong></div></div>`;
}

function renderFeatured(){
  const featured=products.filter(p=>p.featured).slice(0,8);
  $("featuredGrid").innerHTML=featured.map(p=>`
    <article class="featured-card">
      <div class="featured-card__image" onclick="openProduct(${p.id})">
        <span class="badge">${p.badge||"Destacado"}</span>
        ${imageMarkup(p)}
      </div>
      <div class="featured-card__content">
        <span class="meta">${p.brand} · ${p.weight}</span>
        <h3>${p.name}</h3>
        <div class="price-row">${p.price==null?'<span class="consult-price">Consultar precio</span>':`<span class="price">${money(p.price)}</span>`}</div>
        <div class="card-actions">
          <button class="details" onclick="openProduct(${p.id})">Ver producto</button>
          <button class="add" onclick="addToCart(${p.id})" ${p.price==null?"disabled":""}>+</button>
        </div>
      </div>
    </article>`).join("");
}

function filteredProducts(){
  const category=$("categoryFilter").value;
  const brand=$("brandFilter").value;
  const onlyAvailable=$("availableFilter").checked;
  const sort=$("sortFilter").value;
  let list=products.filter(p=>{
    const searchable=[p.name,p.brand,p.category,p.weight].join(" ").toLowerCase();
    return searchable.includes(searchTerm.toLowerCase()) &&
      (category==="Todas"||p.category===category) &&
      (brand==="Todas"||p.brand===brand) &&
      (!onlyAvailable||p.price!=null);
  });
  if(sort==="priceAsc")list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  if(sort==="priceDesc")list.sort((a,b)=>(b.price??-1)-(a.price??-1));
  if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==="recommended")list.sort((a,b)=>Number(b.featured)-Number(a.featured));
  return list;
}

function renderProducts(){
  const list=filteredProducts();
  const visible=list.slice(0,visibleCount);
  $("resultsCount").textContent=`${list.length} producto${list.length===1?"":"s"} disponibles en el catálogo`;
  $("emptyState").classList.toggle("hidden",list.length>0);
  $("loadMore").classList.toggle("hidden",visible.length>=list.length);
  $("activeSearch").classList.toggle("hidden",!searchTerm);
  $("activeSearch").textContent=searchTerm?`Resultados para “${searchTerm}”`:"";
  $("productGrid").innerHTML=visible.map(p=>`
    <article class="product-card">
      <div class="product-card__image" onclick="openProduct(${p.id})">
        ${p.featured?`<span class="badge">${p.badge||"Destacado"}</span>`:""}
        ${imageMarkup(p)}
      </div>
      <div class="product-card__content">
        <span class="meta">${p.brand} · ${p.weight}</span>
        <h3>${p.name}</h3>
        <p>${p.category}</p>
        <div class="price-row">${p.price==null?'<span class="consult-price">Consultar precio</span>':`<span class="price">${money(p.price)}</span>`}</div>
        <div class="card-actions">
          <button class="details" onclick="openProduct(${p.id})">Ver detalle</button>
          <button class="add" onclick="addToCart(${p.id})" ${p.price==null?"disabled":""}>+</button>
        </div>
      </div>
    </article>`).join("");
}

function openProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;
  $("productDetail").innerHTML=`
    <div class="product-detail">
      <div class="product-detail__visual">${imageMarkup(p)}</div>
      <div class="product-detail__copy">
        <span class="meta">${p.brand} · ${p.category} · ${p.weight}</span>
        <h2>${p.name}</h2>
        <p>${p.description||"Puedes completar aquí la descripción, ingredientes, beneficios y recomendaciones del producto desde productos.json."}</p>
        ${p.benefits?.length?`<ul>${p.benefits.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}
        <div class="price-row">${p.price==null?'<span class="consult-price">Precio por consultar</span>':`<span class="price">${money(p.price)}</span>`}</div>
        <button class="add-detail" onclick="addToCart(${p.id});closeProduct()" ${p.price==null?"disabled":""}>Agregar al carrito</button>
      </div>
    </div>`;
  $("productModal").classList.add("open");
  $("overlay").classList.add("show");
  document.body.style.overflow="hidden";
}

function closeProduct(){
  $("productModal").classList.remove("open");
  updateOverlay();
}

function addToCart(id){
  const p=products.find(x=>x.id===id);
  if(!p||p.price==null)return;
  const item=cart.find(x=>x.id===id);
  item?item.quantity++:cart.push({id,quantity:1});
  saveCart();
  openCart();
}

function changeQty(id,amount){
  const item=cart.find(x=>x.id===id);
  if(!item)return;
  item.quantity+=amount;
  if(item.quantity<=0)cart=cart.filter(x=>x.id!==id);
  saveCart();
}

function removeItem(id){
  cart=cart.filter(x=>x.id!==id);
  saveCart();
}

function saveCart(){
  localStorage.setItem("patitasYaCartModern",JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const detailed=cart.map(i=>{
    const p=products.find(x=>x.id===i.id);
    return p?{...p,quantity:i.quantity}:null;
  }).filter(Boolean);
  const count=detailed.reduce((s,x)=>s+x.quantity,0);
  const total=detailed.reduce((s,x)=>s+x.price*x.quantity,0);
  $("cartCount").textContent=count;
  $("cartTotal").textContent=money(total);
  $("cartEmpty").classList.toggle("hidden",detailed.length>0);
  $("cartItems").innerHTML=detailed.map(x=>`
    <div class="cart-item">
      <img src="${x.image}" alt="${x.name}" onerror="this.style.visibility='hidden'">
      <div><h4>${x.name}</h4><small>${money(x.price)} c/u</small><button class="remove" onclick="removeItem(${x.id})">Eliminar</button></div>
      <div class="quantity"><button onclick="changeQty(${x.id},-1)">−</button><strong>${x.quantity}</strong><button onclick="changeQty(${x.id},1)">+</button></div>
    </div>`).join("");
}

function openCart(){
  $("cartDrawer").classList.add("open");
  $("overlay").classList.add("show");
  document.body.style.overflow="hidden";
}
function closeCart(){
  $("cartDrawer").classList.remove("open");
  updateOverlay();
}
function updateOverlay(){
  if(!$("cartDrawer").classList.contains("open")&&!$("productModal").classList.contains("open")&&!$("filtersPanel").classList.contains("open")){
    $("overlay").classList.remove("show");
    document.body.style.overflow="";
  }
}
function sendOrder(){
  if(!cart.length)return alert("Agrega productos al carrito.");
  const detailed=cart.map(i=>({...products.find(p=>p.id===i.id),quantity:i.quantity}));
  const total=detailed.reduce((s,x)=>s+x.price*x.quantity,0);
  const lines=detailed.map(x=>`• ${x.quantity} x ${x.name} — ${money(x.price*x.quantity)}`).join("\n");
  const text=`Hola, quiero hacer el siguiente pedido en Patitas Ya 🐾\n\n${lines}\n\nTotal estimado: ${money(total)}\n\n¿Me pueden confirmar stock y valor del despacho?`;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`,"_blank");
}

function resetFilters(){
  searchTerm="";
  $("searchInput").value="";
  $("categoryFilter").value="Todas";
  $("brandFilter").value="Todas";
  $("sortFilter").value="recommended";
  $("availableFilter").checked=false;
  visibleCount=CONFIG.pageSize;
  renderProducts();
}

$("searchInput").addEventListener("input",e=>{searchTerm=e.target.value;visibleCount=CONFIG.pageSize;renderProducts()});
$("clearSearch").addEventListener("click",()=>{searchTerm="";$("searchInput").value="";renderProducts()});
["categoryFilter","brandFilter","sortFilter","availableFilter"].forEach(id=>$(id).addEventListener("change",()=>{visibleCount=CONFIG.pageSize;renderProducts()}));
$("resetFilters").addEventListener("click",resetFilters);
$("loadMore").addEventListener("click",()=>{visibleCount+=CONFIG.pageSize;renderProducts()});
$("openCart").addEventListener("click",openCart);
$("closeCart").addEventListener("click",closeCart);
$("checkoutButton").addEventListener("click",sendOrder);
$("closeProductModal").addEventListener("click",closeProduct);
$("openFilters").addEventListener("click",()=>{$("filtersPanel").classList.add("open");$("overlay").classList.add("show");document.body.style.overflow="hidden"});
$("closeFilters").addEventListener("click",()=>{$("filtersPanel").classList.remove("open");updateOverlay()});
$("overlay").addEventListener("click",()=>{$("cartDrawer").classList.remove("open");$("productModal").classList.remove("open");$("filtersPanel").classList.remove("open");updateOverlay()});

init();
