const CONFIG={productsUrl:"data/productos.json",configUrl:"data/config.json",pageSize:24,whatsapp:"56956736785"};
let products=[],siteConfig={},cart=JSON.parse(localStorage.getItem("patitasYaCartV4"))||[];
let visibleCount=CONFIG.pageSize,searchTerm="";

const $=id=>document.getElementById(id);
const money=v=>v==null?"Consultar":new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(v);

async function init(){
  try{
    const [pRes,cRes]=await Promise.all([fetch(CONFIG.productsUrl),fetch(CONFIG.configUrl)]);
    products=await pRes.json();
    if(cRes.ok)siteConfig=await cRes.json();
    applyConfig();
    buildFilters();
    renderCategories();
    renderFeatured();
    renderProducts();
    renderCart();
    bindNavCategories();
  }catch(e){
    console.error(e);
    $("resultsCount").textContent="No fue posible cargar el catálogo.";
  }
}

function applyConfig(){
  CONFIG.whatsapp=siteConfig.whatsapp||CONFIG.whatsapp;
  $("storeName").textContent=siteConfig.storeName||"Patitas Ya";
  $("storeTagline").textContent=siteConfig.tagline||"Todo para tus mascotas";
  $("announcementText").textContent=siteConfig.announcement||"🐾 Todo para tus mascotas";
  $("deliveryTop").textContent=siteConfig.deliveryText||"🚚 Delivery coordinado";
  $("heroTitle").textContent=siteConfig.heroTitle||"Lo mejor para quienes más quieres";
  $("heroSubtitle").textContent=siteConfig.heroSubtitle||"Productos para tus mascotas";
  $("deliveryText").textContent=siteConfig.deliveryText||"Delivery coordinado";
  $("cartIcon").textContent=siteConfig.cartIcon||"🛒";
  $("drawerCartIcon").textContent=siteConfig.cartIcon||"🛒";

  const logo=$("siteLogo");
  logo.src=siteConfig.logo||"assets/images/logo-patitas.png";
  logo.onerror=()=>logo.parentElement.classList.add("image-error");

  if(siteConfig.heroImage){
    $("heroSection").style.backgroundImage=
      `linear-gradient(90deg,rgba(247,246,236,.96) 0%,rgba(247,246,236,.72) 42%,rgba(247,246,236,.12) 72%),url("${siteConfig.heroImage}")`;
  }

  const msg=encodeURIComponent("Hola, me gustaría saber más de sus productos");
  const url=`https://wa.me/${CONFIG.whatsapp}?text=${msg}`;
  ["topWhatsapp","heroWhatsapp","floatingWhatsapp","coverageWhatsapp"].forEach(id=>$(id).href=url);
  $("topWhatsapp").textContent=`WhatsApp +${CONFIG.whatsapp}`;
}

function bindNavCategories(){
  document.querySelectorAll("[data-category-nav]").forEach(a=>a.addEventListener("click",()=>{
    chooseCategory(a.dataset.categoryNav);
  }));
  $("showAllProducts").addEventListener("click",()=>{
    resetFilters();
    $("catalogo").scrollIntoView({behavior:"smooth"});
  });
}

function buildFilters(){
  const cats=[...new Set(products.map(p=>p.category))].sort();
  const brands=[...new Set(products.map(p=>p.brand))].sort();
  $("categoryFilter").innerHTML='<option value="Todas">Todas</option>'+cats.map(x=>`<option>${x}</option>`).join("");
  $("brandFilter").innerHTML='<option value="Todas">Todas</option>'+brands.map(x=>`<option>${x}</option>`).join("");
}

function renderCategories(){
  const icons={Todos:"🐾",Perros:"🐶",Gatos:"🐱",Higiene:"🧼",Snacks:"🦴",Aves:"🐦",Roedores:"🐰"};
  const categories=["Todos",...[...new Set(products.map(p=>p.category))]];
  $("categoryGrid").innerHTML=categories.map(category=>{
    const img=siteConfig.categoryImages?.[category];
    return `<button class="category-card ${category==="Todos"?"active":""}" data-category="${category}" onclick="chooseCategory('${category}')">
      <div class="category-image ${img?"":"image-error"}">
        ${img?`<img src="${img}" alt="${category}" onerror="this.parentElement.classList.add('image-error')">`:""}
        <span>${icons[category]||"🐾"}</span>
      </div>
      <strong>${category}</strong>
    </button>`;
  }).join("");
}

function chooseCategory(category){
  $("categoryFilter").value=category==="Todos"?"Todas":category;
  document.querySelectorAll(".category-card").forEach(x=>x.classList.toggle("active",x.dataset.category===category));
  visibleCount=CONFIG.pageSize;
  renderProducts();
  $("catalogo").scrollIntoView({behavior:"smooth",block:"start"});
}

function imageMarkup(p){
  return `<img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('image-error')">
  <div class="image-fallback"><div>Imagen pendiente<br><strong>${p.image.split("/").pop()}</strong></div></div>`;
}

function priceMarkup(p){
  if(p.price==null)return '<span class="consult-price">Consultar precio</span>';
  return `${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:""}<span class="price">${money(p.price)}</span>`;
}

function cardMarkup(p,featured=false){
  return `<article class="${featured?"featured-card":"product-card"}">
    <div class="${featured?"featured-card__image":"product-card__image"}" onclick="openProduct(${p.id})">
      ${p.badge||p.featured?`<span class="badge">${p.badge||"Destacado"}</span>`:""}
      ${imageMarkup(p)}
    </div>
    <div class="${featured?"featured-card__content":"product-card__content"}">
      <span class="meta">${p.brand} · ${p.weight}</span>
      <h3>${p.name}</h3>
      ${!featured?`<p>${p.category}</p>`:""}
      <div class="price-row">${priceMarkup(p)}</div>
      <div class="card-actions">
        <button class="details" onclick="openProduct(${p.id})">Ver producto</button>
        <button class="add" onclick="addToCart(${p.id})" ${p.price==null?"disabled":""}>+</button>
      </div>
    </div>
  </article>`;
}

function renderFeatured(){
  $("featuredGrid").innerHTML=products.filter(p=>p.featured).slice(0,10).map(p=>cardMarkup(p,true)).join("");
}

function filteredProducts(){
  const category=$("categoryFilter").value,brand=$("brandFilter").value,only=$("availableFilter").checked,sort=$("sortFilter").value;
  let list=products.filter(p=>{
    const text=[p.name,p.brand,p.category,p.weight].join(" ").toLowerCase();
    return text.includes(searchTerm.toLowerCase())&&(category==="Todas"||p.category===category)&&(brand==="Todas"||p.brand===brand)&&(!only||p.price!=null);
  });
  if(sort==="priceAsc")list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  if(sort==="priceDesc")list.sort((a,b)=>(b.price??-1)-(a.price??-1));
  if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==="recommended")list.sort((a,b)=>Number(b.featured)-Number(a.featured));
  return list;
}

function renderProducts(){
  const list=filteredProducts(),visible=list.slice(0,visibleCount);
  $("resultsCount").textContent=`${list.length} producto${list.length===1?"":"s"} encontrados`;
  $("productGrid").innerHTML=visible.map(p=>cardMarkup(p)).join("");
  $("emptyState").classList.toggle("hidden",list.length>0);
  $("loadMore").classList.toggle("hidden",visible.length>=list.length);
  $("activeSearch").classList.toggle("hidden",!searchTerm);
  $("activeSearch").textContent=searchTerm?`Resultados para “${searchTerm}”`:"";
}

function openProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  $("productDetail").innerHTML=`<div class="product-detail">
    <div class="product-detail__visual">${imageMarkup(p)}</div>
    <div class="product-detail__copy">
      <span class="meta">${p.brand} · ${p.category} · ${p.weight}</span>
      <h2>${p.name}</h2>
      <p>${p.description||"Consulta disponibilidad, características y recomendaciones por WhatsApp."}</p>
      ${p.benefits?.length?`<ul>${p.benefits.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}
      <div class="price-row">${priceMarkup(p)}</div>
      <button class="add-detail" onclick="addToCart(${p.id});closeProduct()" ${p.price==null?"disabled":""}>Agregar al carrito</button>
    </div></div>`;
  $("productModal").classList.add("open");$("overlay").classList.add("show");document.body.style.overflow="hidden";
}
function closeProduct(){$("productModal").classList.remove("open");updateOverlay()}

function addToCart(id){
  const p=products.find(x=>x.id===id);if(!p||p.price==null)return;
  const item=cart.find(x=>x.id===id);item?item.quantity++:cart.push({id,quantity:1});saveCart();openCart();
}
function changeQty(id,n){const item=cart.find(x=>x.id===id);if(!item)return;item.quantity+=n;if(item.quantity<=0)cart=cart.filter(x=>x.id!==id);saveCart()}
function removeItem(id){cart=cart.filter(x=>x.id!==id);saveCart()}
function saveCart(){localStorage.setItem("patitasYaCartV4",JSON.stringify(cart));renderCart()}
function renderCart(){
  const detailed=cart.map(i=>{const p=products.find(x=>x.id===i.id);return p?{...p,quantity:i.quantity}:null}).filter(Boolean);
  $("cartCount").textContent=detailed.reduce((s,x)=>s+x.quantity,0);
  $("cartTotal").textContent=money(detailed.reduce((s,x)=>s+x.price*x.quantity,0));
  $("cartEmpty").classList.toggle("hidden",detailed.length>0);
  $("cartItems").innerHTML=detailed.map(x=>`<div class="cart-item">
    <img src="${x.image}" alt="${x.name}" onerror="this.style.visibility='hidden'">
    <div><h4>${x.name}</h4><small>${money(x.price)} c/u</small><button class="remove" onclick="removeItem(${x.id})">Eliminar</button></div>
    <div class="quantity"><button onclick="changeQty(${x.id},-1)">−</button><strong>${x.quantity}</strong><button onclick="changeQty(${x.id},1)">+</button></div>
  </div>`).join("");
}
function openCart(){$("cartDrawer").classList.add("open");$("overlay").classList.add("show");document.body.style.overflow="hidden"}
function closeCart(){$("cartDrawer").classList.remove("open");updateOverlay()}
function updateOverlay(){if(!$("cartDrawer").classList.contains("open")&&!$("productModal").classList.contains("open")&&!$("filtersPanel").classList.contains("open")){$("overlay").classList.remove("show");document.body.style.overflow=""}}
function sendOrder(){
  if(!cart.length)return alert("Agrega productos al carrito.");
  const detailed=cart.map(i=>({...products.find(p=>p.id===i.id),quantity:i.quantity}));
  const total=detailed.reduce((s,x)=>s+x.price*x.quantity,0);
  const lines=detailed.map(x=>`• ${x.quantity} x ${x.name} — ${money(x.price*x.quantity)}`).join("\n");
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Hola, quiero hacer este pedido en Patitas Ya 🐾\n\n${lines}\n\nTotal estimado: ${money(total)}\n\n¿Me confirman stock y despacho?`)}`,"_blank");
}
function resetFilters(){
  searchTerm="";$("searchInput").value="";$("categoryFilter").value="Todas";$("brandFilter").value="Todas";$("sortFilter").value="recommended";$("availableFilter").checked=false;visibleCount=CONFIG.pageSize;
  document.querySelectorAll(".category-card").forEach(x=>x.classList.toggle("active",x.dataset.category==="Todos"));renderProducts();
}

$("searchInput").addEventListener("input",e=>{searchTerm=e.target.value;visibleCount=CONFIG.pageSize;renderProducts()});
$("clearSearch").addEventListener("click",()=>{searchTerm="";$("searchInput").value="";renderProducts()});
["categoryFilter","brandFilter","sortFilter","availableFilter"].forEach(id=>$(id).addEventListener("change",()=>{visibleCount=CONFIG.pageSize;renderProducts()}));
$("resetFilters").addEventListener("click",resetFilters);$("loadMore").addEventListener("click",()=>{visibleCount+=CONFIG.pageSize;renderProducts()});
$("openCart").addEventListener("click",openCart);$("closeCart").addEventListener("click",closeCart);$("checkoutButton").addEventListener("click",sendOrder);
$("closeProductModal").addEventListener("click",closeProduct);$("openFilters").addEventListener("click",()=>{$("filtersPanel").classList.add("open");$("overlay").classList.add("show")});
$("closeFilters").addEventListener("click",()=>{$("filtersPanel").classList.remove("open");updateOverlay()});
$("overlay").addEventListener("click",()=>{$("cartDrawer").classList.remove("open");$("productModal").classList.remove("open");$("filtersPanel").classList.remove("open");updateOverlay()});

init();
