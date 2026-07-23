const PRODUCT_KEY="patitasAdminProducts";
const IMAGE_KEY="patitasImageProgress";
const PAGE_SIZE=20;

let products=[];
let filtered=[];
let visible=PAGE_SIZE;
let preparedFiles={};
let imageProgress=JSON.parse(localStorage.getItem(IMAGE_KEY)||"{}");
let editedIds=new Set();

const $=id=>document.getElementById(id);

async function init(){
  const response=await fetch("../data/productos.json");
  const sourceProducts=await response.json();
  const saved=localStorage.getItem(PRODUCT_KEY);
  products=saved?JSON.parse(saved):sourceProducts;

  products.forEach(p=>{
    if(imageProgress[p.id])p.imageReady=true;
  });

  buildCategories();
  applyFilters();
  bindEvents();
}

function buildCategories(){
  const categories=[...new Set(products.map(p=>p.category))].sort();
  $("categoryFilter").innerHTML='<option value="all">Todas las categorías</option>'+
    categories.map(c=>`<option value="${c}">${c}</option>`).join("");
}

function bindEvents(){
  $("searchInput").addEventListener("input",()=>{visible=PAGE_SIZE;applyFilters()});
  $("statusFilter").addEventListener("change",()=>{visible=PAGE_SIZE;applyFilters()});
  $("categoryFilter").addEventListener("change",()=>{visible=PAGE_SIZE;applyFilters()});
  $("loadMore").addEventListener("click",()=>{visible+=PAGE_SIZE;render()});
  $("exportJson").addEventListener("click",exportJson);
  $("resetChanges").addEventListener("click",()=>{
    if(confirm("¿Descartar todos los cambios guardados en este navegador?")){
      localStorage.removeItem(PRODUCT_KEY);
      localStorage.removeItem(IMAGE_KEY);
      location.reload();
    }
  });
}

function persist(){
  localStorage.setItem(PRODUCT_KEY,JSON.stringify(products));
  localStorage.setItem(IMAGE_KEY,JSON.stringify(imageProgress));
}

function applyFilters(){
  const q=$("searchInput").value.trim().toLowerCase();
  const status=$("statusFilter").value;
  const category=$("categoryFilter").value;

  filtered=products.filter(p=>{
    const text=[p.name,p.brand,p.category,p.weight,p.description,p.shortDescription].join(" ").toLowerCase();
    const hasImage=!!(p.imageReady||imageProgress[p.id]);
    const matchesStatus=status==="all"||
      (status==="done"&&hasImage)||
      (status==="pending"&&!hasImage)||
      (status==="edited"&&editedIds.has(p.id));
    return text.includes(q)&&matchesStatus&&(category==="all"||p.category===category);
  });
  render();
}

function render(){
  const container=$("productList");
  container.innerHTML="";
  filtered.slice(0,visible).forEach(product=>container.appendChild(createRow(product)));
  $("loadMore").classList.toggle("hidden",visible>=filtered.length);
  updateStats();
}

function createRow(product){
  const template=$("productTemplate").content.cloneNode(true);
  const row=template.querySelector(".product-row");
  const editor=template.querySelector(".editor");
  const preview=template.querySelector(".preview");
  const img=template.querySelector("img");
  const meta=template.querySelector(".meta");
  const title=template.querySelector("h2");
  const filename=template.querySelector(".filename");
  const searchBtn=template.querySelector(".btn-search");
  const fileInput=template.querySelector(".file-input");
  const downloadBtn=template.querySelector(".btn-download");
  const editBtn=template.querySelector(".btn-edit");

  if(editedIds.has(product.id))row.classList.add("edited");

  const targetName=product.image.split("/").pop();
  meta.textContent=`${product.brand} · ${product.category} · ${product.weight}`;
  title.textContent=product.name;
  filename.textContent=targetName;

  if(product.imageReady||imageProgress[product.id]){
    preview.classList.add("has-image");
    img.src="../"+product.image;
    img.onerror=()=>preview.classList.remove("has-image");
  }

  searchBtn.addEventListener("click",()=>{
    const query=encodeURIComponent(`${product.name} alimento mascota producto`);
    window.open(`https://www.bing.com/images/search?q=${query}`,"_blank");
  });

  fileInput.addEventListener("change",()=>{
    const file=fileInput.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{img.src=e.target.result;preview.classList.add("has-image")};
    reader.readAsDataURL(file);
    preparedFiles[product.id]=file;
    downloadBtn.disabled=false;
  });

  downloadBtn.addEventListener("click",async()=>{
    const file=preparedFiles[product.id];
    if(!file)return;
    const blob=await convertToWebp(file);
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=targetName;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    product.imageReady=true;
    imageProgress[product.id]=true;
    editedIds.add(product.id);
    persist();
    updateStats();
  });

  editBtn.addEventListener("click",()=>{
    editor.classList.toggle("hidden");
    if(!editor.classList.contains("hidden"))fillEditor(editor,product);
  });

  editor.querySelector(".btn-cancel").addEventListener("click",()=>editor.classList.add("hidden"));
  editor.querySelector(".btn-save").addEventListener("click",()=>{
    saveEditor(editor,product);
    editedIds.add(product.id);
    row.classList.add("edited");
    persist();
    editor.classList.add("hidden");
    applyFilters();
  });

  return template;
}

function fillEditor(editor,p){
  editor.querySelector(".field-name").value=p.name||"";
  editor.querySelector(".field-brand").value=p.brand||"";
  editor.querySelector(".field-category").value=p.category||"";
  editor.querySelector(".field-weight").value=p.weight||"";
  editor.querySelector(".field-price").value=p.price??"";
  editor.querySelector(".field-old-price").value=p.oldPrice??"";
  editor.querySelector(".field-stock").value=p.stock??0;
  editor.querySelector(".field-badge").value=p.badge||"";
  editor.querySelector(".field-short").value=p.shortDescription||"";
  editor.querySelector(".field-description").value=p.description||"";
  editor.querySelector(".field-benefits").value=(p.benefits||[]).join("\n");
  editor.querySelector(".field-featured").checked=!!p.featured;
  editor.querySelector(".field-image-ready").checked=!!(p.imageReady||imageProgress[p.id]);
}

function saveEditor(editor,p){
  p.name=editor.querySelector(".field-name").value.trim();
  p.brand=editor.querySelector(".field-brand").value.trim();
  p.category=editor.querySelector(".field-category").value.trim();
  p.weight=editor.querySelector(".field-weight").value.trim();
  p.price=parseNullableNumber(editor.querySelector(".field-price").value);
  p.oldPrice=parseNullableNumber(editor.querySelector(".field-old-price").value);
  p.stock=Number(editor.querySelector(".field-stock").value||0);
  p.badge=editor.querySelector(".field-badge").value.trim();
  p.shortDescription=editor.querySelector(".field-short").value.trim();
  p.description=editor.querySelector(".field-description").value.trim();
  p.benefits=editor.querySelector(".field-benefits").value.split("\n").map(x=>x.trim()).filter(Boolean);
  p.featured=editor.querySelector(".field-featured").checked;
  p.imageReady=editor.querySelector(".field-image-ready").checked;
  imageProgress[p.id]=p.imageReady;
}

function parseNullableNumber(value){
  return value===""?null:Number(value);
}

async function convertToWebp(file){
  const bitmap=await createImageBitmap(file);
  const max=1200;
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(bitmap.width*scale);
  canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.88));
}

function updateStats(){
  const withImage=products.filter(p=>p.imageReady||imageProgress[p.id]).length;
  $("totalProducts").textContent=products.length;
  $("completedProducts").textContent=withImage;
  $("editedProducts").textContent=editedIds.size;
}

function exportJson(){
  const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="productos.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

init();
