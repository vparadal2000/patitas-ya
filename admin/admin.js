const PRODUCTS_KEY="patitasCmsProducts";
const CONFIG_KEY="patitasCmsConfig";
const PAGE_SIZE=25;

let products=[];
let config={};
let sourceProducts=[];
let sourceConfig={};
let visible=PAGE_SIZE;
let currentProductId=null;
let selectedImageFile=null;

const $=id=>document.getElementById(id);
const money=value=>value==null?"Sin precio":new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(value);
const slugify=text=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function init(){
  const [pr,cr]=await Promise.all([fetch("../data/productos.json"),fetch("../data/config.json")]);
  sourceProducts=await pr.json();
  sourceConfig=await cr.json();

  products=JSON.parse(localStorage.getItem(PRODUCTS_KEY)||"null")||structuredClone(sourceProducts);
  config=JSON.parse(localStorage.getItem(CONFIG_KEY)||"null")||structuredClone(sourceConfig);

  bindNavigation();
  bindActions();
  buildFilters();
  fillConfiguration();
  renderAll();
}

function bindNavigation(){
  document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.go)));
}
function showView(view){
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  const titles={dashboard:"Resumen",products:"Productos",promotions:"Promociones",settings:"Configuración"};
  $("viewTitle").textContent=titles[view];
  if(view==="products")renderProductTable();
  if(view==="promotions")renderFeaturedManager();
}

function bindActions(){
  ["searchInput","categoryFilter","statusFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",()=>{visible=PAGE_SIZE;renderProductTable()}));
  $("loadMore").addEventListener("click",()=>{visible+=PAGE_SIZE;renderProductTable()});
  $("newProduct").addEventListener("click",()=>openProductModal());
  $("closeModal").addEventListener("click",closeProductModal);
  $("cancelModal").addEventListener("click",closeProductModal);
  $("saveProduct").addEventListener("click",saveProduct);
  $("deleteProduct").addEventListener("click",deleteCurrentProduct);
  $("imageInput").addEventListener("change",handleImageSelection);
  $("searchImage").addEventListener("click",searchCurrentImage);
  $("downloadRenamed").addEventListener("click",downloadRenamedImage);
  $("savePromotions").addEventListener("click",saveConfigForm);
  $("saveSettings").addEventListener("click",saveConfigForm);
  $("publishChanges").addEventListener("click",openPublish);
  $("closePublish").addEventListener("click",closePublish);
  $("downloadProducts").addEventListener("click",()=>downloadJson(products,"productos.json"));
  $("downloadConfig").addEventListener("click",()=>downloadJson(config,"config.json"));
  $("discardLocal").addEventListener("click",discardLocalChanges);
  $("clearDrafts").addEventListener("click",discardLocalChanges);
  $("modalBackdrop").addEventListener("click",()=>{closeProductModal();closePublish()});
}

function persist(){
  localStorage.setItem(PRODUCTS_KEY,JSON.stringify(products));
  localStorage.setItem(CONFIG_KEY,JSON.stringify(config));
  $("saveStatus").textContent="Cambios guardados en este navegador";
  renderDashboard();
}

function discardLocalChanges(){
  if(!confirm("¿Descartar los cambios guardados en este navegador? Las imágenes que ya existen en assets/images seguirán mostrándose."))return;
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(CONFIG_KEY);
  products=structuredClone(sourceProducts);
  config=structuredClone(sourceConfig);
  buildFilters();
  fillConfiguration();
  renderAll();
  $("saveStatus").textContent="Borradores locales eliminados";
}

function renderAll(){
  renderDashboard();
  renderProductTable();
  renderFeaturedManager();
}

function renderDashboard(){
  const imageCount=products.filter(p=>p.imageReady).length;
  $("metricTotal").textContent=products.length;
  $("metricImages").textContent=imageCount;
  $("metricImagesPercent").textContent=`${products.length?Math.round(imageCount/products.length*100):0}% completado`;
  $("metricFeatured").textContent=products.filter(p=>p.featured).length;
  $("metricNoPrice").textContent=products.filter(p=>p.price==null).length;

  const categories=[...new Set(products.map(p=>p.category))].sort();
  $("categoryProgress").innerHTML=categories.map(category=>{
    const list=products.filter(p=>p.category===category);
    const done=list.filter(p=>p.imageReady).length;
    const pct=list.length?Math.round(done/list.length*100):0;
    return `<div class="progress-item"><div class="progress-item__top"><span>${category}</span><strong>${done}/${list.length}</strong></div><div class="progress-track"><span style="width:${pct}%"></span></div></div>`;
  }).join("");

  const tasks=[
    {icon:"🖼️",count:products.filter(p=>!p.imageReady).length,text:"productos sin imagen revisada"},
    {icon:"💰",count:products.filter(p=>p.price==null).length,text:"productos sin precio"},
    {icon:"✍️",count:products.filter(p=>!p.description).length,text:"productos sin descripción"},
    {icon:"⭐",count:products.filter(p=>p.featured).length,text:"productos destacados activos"}
  ];
  $("taskList").innerHTML=tasks.map(t=>`<div class="task"><span>${t.icon}</span><div><strong>${t.count}</strong><small>${t.text}</small></div></div>`).join("");

  $("quickProducts").innerHTML=products.slice(0,8).map(p=>`
    <div class="quick-product" onclick="openProductModal(${p.id})">
      <img src="../${p.image}" alt="" onload="this.parentElement.dataset.loaded='true'" onerror="this.style.visibility='hidden'">
      <div><strong>${p.name}</strong><small>${money(p.price)}</small></div>
    </div>`).join("");
}

function buildFilters(){
  const current=$("categoryFilter").value;
  const categories=[...new Set(products.map(p=>p.category))].sort();
  $("categoryFilter").innerHTML='<option value="all">Todas las categorías</option>'+categories.map(c=>`<option value="${c}">${c}</option>`).join("");
  if(categories.includes(current))$("categoryFilter").value=current;
}

function getFilteredProducts(){
  const q=$("searchInput").value.trim().toLowerCase();
  const category=$("categoryFilter").value;
  const status=$("statusFilter").value;
  return products.filter(p=>{
    const matchesText=[p.name,p.brand,p.category,p.weight].join(" ").toLowerCase().includes(q);
    const matchesCategory=category==="all"||p.category===category;
    const matchesStatus=status==="all"||
      (status==="withoutImage"&&!p.imageReady)||
      (status==="withImage"&&p.imageReady)||
      (status==="featured"&&p.featured)||
      (status==="withoutPrice"&&p.price==null);
    return matchesText&&matchesCategory&&matchesStatus;
  });
}

function renderProductTable(){
  const list=getFilteredProducts();
  $("productTableBody").innerHTML=list.slice(0,visible).map(p=>{
    const status=p.imageReady?'<span class="status-pill status-good">Imagen lista</span>':'<span class="status-pill status-warn">Falta imagen</span>';
    return `<tr>
      <td><div class="product-cell">
        <img src="../${p.image}" alt="" onload="this.style.visibility='visible'" onerror="this.style.visibility='hidden'">
        <div><strong>${p.name}</strong><small>${p.brand} · ${p.weight}</small></div>
      </div></td>
      <td>${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock??0}</td>
      <td>${status}${p.featured?' <span class="status-pill status-muted">Destacado</span>':''}</td>
      <td><div class="row-menu"><button class="icon-button" onclick="openProductModal(${p.id})">✎</button></div></td>
    </tr>`;
  }).join("");
  $("loadMore").style.display=visible>=list.length?"none":"block";
}

function renderFeaturedManager(){
  const featuredFirst=[...products].sort((a,b)=>Number(b.featured)-Number(a.featured));
  $("featuredManager").innerHTML=featuredFirst.slice(0,30).map(p=>`
    <label class="featured-toggle">
      <img src="../${p.image}" alt="" onerror="this.style.visibility='hidden'">
      <div><strong>${p.name}</strong><small>${p.category} · ${money(p.price)}</small></div>
      <input type="checkbox" ${p.featured?"checked":""} onchange="toggleFeatured(${p.id},this.checked)">
    </label>`).join("");
}

window.toggleFeatured=function(id,value){
  const p=products.find(x=>x.id===id);
  if(!p)return;p.featured=value;persist();renderProductTable();
}

function openProductModal(id=null){
  selectedImageFile=null;
  $("downloadRenamed").disabled=true;
  currentProductId=id;
  const p=id?products.find(x=>x.id===id):{
    id:null,name:"",brand:"",category:"Perros",weight:"",price:null,oldPrice:null,stock:0,badge:"",
    shortDescription:"",description:"",benefits:[],featured:false,imageReady:false,image:"assets/images/nuevo-producto.webp"
  };

  $("modalTitle").textContent=id?"Editar producto":"Nuevo producto";
  $("productId").value=p.id??"";
  $("fieldName").value=p.name||"";
  $("fieldBrand").value=p.brand||"";
  $("fieldCategory").value=p.category||"";
  $("fieldWeight").value=p.weight||"";
  $("fieldPrice").value=p.price??"";
  $("fieldOldPrice").value=p.oldPrice??"";
  $("fieldStock").value=p.stock??0;
  $("fieldBadge").value=p.badge||"";
  $("fieldShort").value=p.shortDescription||"";
  $("fieldDescription").value=p.description||"";
  $("fieldBenefits").value=(p.benefits||[]).join("\n");
  $("fieldFeatured").checked=!!p.featured;
  $("fieldImageReady").checked=!!p.imageReady;
  $("deleteProduct").style.display=id?"block":"none";

  const filename=p.image.split("/").pop();
  $("imageFilename").textContent=filename;
  const preview=$("imagePreview");
  const img=$("productImagePreview");
  preview.classList.remove("has-image");
  img.src="../"+p.image;
  img.onload=()=>preview.classList.add("has-image");
  img.onerror=()=>preview.classList.remove("has-image");

  $("productModal").classList.add("open");
  $("modalBackdrop").classList.add("show");
  document.body.style.overflow="hidden";
}

function closeProductModal(){
  $("productModal").classList.remove("open");
  if(!$("publishModal").classList.contains("open"))$("modalBackdrop").classList.remove("show");
  document.body.style.overflow="";
}

function saveProduct(){
  const name=$("fieldName").value.trim();
  if(!name)return alert("Debes ingresar el nombre del producto.");

  let p=currentProductId?products.find(x=>x.id===currentProductId):null;
  if(!p){
    p={id:Math.max(0,...products.map(x=>Number(x.id)||0))+1};
    products.unshift(p);
  }
  const oldImage=p.image;
  Object.assign(p,{
    name,
    brand:$("fieldBrand").value.trim(),
    category:$("fieldCategory").value.trim()||"Sin categoría",
    weight:$("fieldWeight").value.trim(),
    price:nullableNumber($("fieldPrice").value),
    oldPrice:nullableNumber($("fieldOldPrice").value),
    stock:Number($("fieldStock").value||0),
    badge:$("fieldBadge").value.trim(),
    shortDescription:$("fieldShort").value.trim(),
    description:$("fieldDescription").value.trim(),
    benefits:$("fieldBenefits").value.split("\n").map(x=>x.trim()).filter(Boolean),
    featured:$("fieldFeatured").checked,
    imageReady:$("fieldImageReady").checked
  });
  if(!oldImage||oldImage.includes("nuevo-producto"))p.image=`assets/images/${slugify(name)}.webp`;

  persist();buildFilters();renderAll();closeProductModal();
}

function deleteCurrentProduct(){
  if(!currentProductId)return;
  const p=products.find(x=>x.id===currentProductId);
  if(confirm(`¿Eliminar "${p.name}" del catálogo?`)){
    products=products.filter(x=>x.id!==currentProductId);
    persist();buildFilters();renderAll();closeProductModal();
  }
}

function nullableNumber(value){return value===""?null:Number(value)}

function handleImageSelection(){
  const file=$("imageInput").files[0];
  if(!file)return;
  selectedImageFile=file;
  const reader=new FileReader();
  reader.onload=e=>{
    $("productImagePreview").src=e.target.result;
    $("imagePreview").classList.add("has-image");
  };
  reader.readAsDataURL(file);
  $("downloadRenamed").disabled=false;
}

function searchCurrentImage(){
  const name=$("fieldName").value.trim();
  if(!name)return alert("Primero escribe el nombre del producto.");
  window.open(`https://www.bing.com/images/search?q=${encodeURIComponent(name+" producto alimento mascota")}`,"_blank");
}

async function downloadRenamedImage(){
  if(!selectedImageFile)return;
  const name=$("fieldName").value.trim();
  if(!name)return alert("Primero escribe el nombre del producto.");
  const filename=`${slugify(name)}.webp`;
  const blob=await convertToWebp(selectedImageFile);
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  $("imageFilename").textContent=filename;
  $("fieldImageReady").checked=true;
  const p=currentProductId?products.find(x=>x.id===currentProductId):null;
  if(p){p.image=`assets/images/${filename}`;p.imageReady=true;persist();}
}

async function convertToWebp(file){
  const bitmap=await createImageBitmap(file);
  const max=1200;
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.88));
}

function fillConfiguration(){
  $("heroTitle").value=config.heroTitle||"";
  $("heroSubtitle").value=config.heroSubtitle||"";
  $("announcement").value=config.announcement||"";
  $("deliveryText").value=config.deliveryText||"";
  $("storeName").value=config.storeName||"";
  $("whatsapp").value=config.whatsapp||"";
}

function saveConfigForm(){
  Object.assign(config,{
    heroTitle:$("heroTitle").value.trim(),
    heroSubtitle:$("heroSubtitle").value.trim(),
    announcement:$("announcement").value.trim(),
    deliveryText:$("deliveryText").value.trim(),
    storeName:$("storeName").value.trim(),
    whatsapp:$("whatsapp").value.trim()
  });
  persist();alert("Configuración guardada localmente.");
}

function openPublish(){
  $("publishModal").classList.add("open");$("modalBackdrop").classList.add("show");document.body.style.overflow="hidden";
}
function closePublish(){
  $("publishModal").classList.remove("open");
  if(!$("productModal").classList.contains("open"))$("modalBackdrop").classList.remove("show");
  document.body.style.overflow="";
}
function downloadJson(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

window.openProductModal=openProductModal;
init();
