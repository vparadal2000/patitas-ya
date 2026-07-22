const STATE_KEY="patitasImageProgress";
const PAGE_SIZE=20;

let products=[];
let filtered=[];
let visible=PAGE_SIZE;
let progress=JSON.parse(localStorage.getItem(STATE_KEY)||"{}");
let preparedFiles={};

const $=id=>document.getElementById(id);

async function init(){
  const response=await fetch("../data/productos.json");
  products=await response.json();
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
  $("resetProgress").addEventListener("click",()=>{
    if(confirm("¿Seguro que deseas reiniciar el progreso?")){
      progress={};localStorage.removeItem(STATE_KEY);applyFilters();
    }
  });
}

function applyFilters(){
  const q=$("searchInput").value.trim().toLowerCase();
  const status=$("statusFilter").value;
  const category=$("categoryFilter").value;

  filtered=products.filter(p=>{
    const matchesText=[p.name,p.brand,p.category].join(" ").toLowerCase().includes(q);
    const isDone=!!progress[p.id];
    const matchesStatus=status==="all"||(status==="done"&&isDone)||(status==="pending"&&!isDone);
    const matchesCategory=category==="all"||p.category===category;
    return matchesText&&matchesStatus&&matchesCategory;
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
  const preview=template.querySelector(".preview");
  const img=template.querySelector("img");
  const meta=template.querySelector(".meta");
  const title=template.querySelector("h2");
  const filename=template.querySelector(".filename");
  const searchBtn=template.querySelector(".btn-search");
  const fileInput=template.querySelector(".file-input");
  const downloadBtn=template.querySelector(".btn-download");
  const doneBtn=template.querySelector(".btn-done");

  const targetName=product.image.split("/").pop();

  meta.textContent=`${product.brand} · ${product.category} · ${product.weight}`;
  title.textContent=product.name;
  filename.textContent=targetName;

  if(progress[product.id]){
    row.classList.add("done");
    doneBtn.textContent="✓ Completado";
  }

  searchBtn.addEventListener("click",()=>{
    const query=encodeURIComponent(`${product.name} alimento mascota producto`);
    window.open(`https://www.bing.com/images/search?q=${query}`,"_blank");
  });

  fileInput.addEventListener("change",()=>{
    const file=fileInput.files[0];
    if(!file)return;

    const reader=new FileReader();
    reader.onload=e=>{
      img.src=e.target.result;
      preview.classList.add("has-image");
    };
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
    a.href=url;
    a.download=targetName;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);

    progress[product.id]=true;
    saveProgress();
    row.classList.add("done");
    doneBtn.textContent="✓ Completado";
    updateStats();
  });

  doneBtn.addEventListener("click",()=>{
    progress[product.id]=!progress[product.id];
    saveProgress();
    applyFilters();
  });

  return template;
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

function saveProgress(){
  localStorage.setItem(STATE_KEY,JSON.stringify(progress));
}

function updateStats(){
  const done=products.filter(p=>progress[p.id]).length;
  $("totalProducts").textContent=products.length;
  $("completedProducts").textContent=done;
  $("pendingProducts").textContent=products.length-done;
}

function exportJson(){
  const updated=products.map(p=>({...p,imageReady:!!progress[p.id]}));
  const blob=new Blob([JSON.stringify(updated,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="productos.json";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

init();
