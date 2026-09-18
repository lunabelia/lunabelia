const grid=document.getElementById("projects-grid");
const modal=document.getElementById("project-modal");
const modalTitle=document.getElementById("modal-title");
const modalMeta=document.getElementById("modal-meta");
const modalDescription=document.getElementById("modal-description");
const modalGallery=document.getElementById("modal-gallery");
const modalClose=document.getElementById("modal-close");

function placeholder(){return `<div class="placeholder-cover" aria-hidden="true"><span class="placeholder-a">A</span><span class="placeholder-b">J</span><p>IDENTITÉ VISUELLE<br>PICTOGRAMMES<br>PRINT + DIGITAL</p></div>`}
function card(p){const a=document.createElement("article");a.className="project-card";a.innerHTML=`<button class="project-button" type="button" data-project="${p.id}"><div class="project-visual">${p.placeholder?placeholder():`<img src="${p.cover}" alt="Aperçu du projet ${p.title}" loading="lazy">`}</div><div class="project-info"><div class="project-line"><span>${p.number}</span><span>${p.year}</span></div><h3>${p.title}</h3><p class="project-type">${p.type}</p><p class="project-summary" style="display:none">${p.summary}</p><span class="project-open" style="display:none">Voir le projet ↗</span></div></button>`;return a}
portfolioProjects.forEach(p=>grid.appendChild(card(p)));

function openProject(p){
  modalTitle.textContent=p.title;
  modalMeta.textContent=`${p.number} · ${p.type} · ${p.year}`;
  modalDescription.textContent=p.description;
  modalGallery.innerHTML="";
  if(!p.images.length){
    const e=document.createElement("div");e.className="modal-empty";e.innerHTML='<div class="modal-empty-art">AJAM</div><p>Emplacement prêt pour les nouveaux visuels.</p>';modalGallery.appendChild(e)
  }else p.images.forEach((src,i)=>{const f=document.createElement("figure");f.className="modal-image-wrap";const im=document.createElement("img");im.src=src;im.alt=`${p.title} — visuel ${i+1}`;im.loading="lazy";f.appendChild(im);modalGallery.appendChild(f)});
  modal.dataset.project=p.id;modal.showModal();document.body.classList.add("modal-open");window.dispatchEvent(new CustomEvent("portfolio:project-open",{detail:{id:p.id}}))
}
grid.addEventListener("click",e=>{const b=e.target.closest("[data-project]");if(!b)return;const p=portfolioProjects.find(x=>x.id===b.dataset.project);if(p)openProject(p)});
function close(){modal.close();document.body.classList.remove("modal-open")}
modalClose.addEventListener("click",close);
modal.addEventListener("click",e=>{if(e.target===modal)close()});
modal.addEventListener("close",()=>document.body.classList.remove("modal-open"));
