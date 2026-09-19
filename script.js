const grid=document.getElementById("projects-grid");
const modal=document.getElementById("project-modal");
const modalTitle=document.getElementById("modal-title");
const modalMeta=document.getElementById("modal-meta");
const modalDescription=document.getElementById("modal-description");
const modalGallery=document.getElementById("modal-gallery");
const modalClose=document.getElementById("modal-close");

function placeholder(){return `<div class="placeholder-cover" aria-hidden="true"><span class="placeholder-a">A</span><span class="placeholder-b">J</span><p>IDENTITÉ VISUELLE<br>PICTOGRAMMES<br>PRINT + DIGITAL</p></div>`}

function card(p){
  const a=document.createElement("article");
  a.className="project-card";
  a.innerHTML=`<button class="project-button" type="button" data-project="${p.id}">
    <div class="project-visual">${p.placeholder?placeholder():`<img src="${p.cover}" alt="Aperçu du projet ${p.title}" loading="lazy">`}</div>
    <div class="project-info">
      <div class="project-line"><span>${p.number}</span><span>${p.year}</span></div>
      <h3>${p.title}</h3>
      <p class="project-type">${p.type}</p>
    </div>
  </button>`;
  return a;
}
portfolioProjects.forEach(p=>grid.appendChild(card(p)));

function mirrorStyle(source,target,props){
  if(!source||!target)return;
  const cs=getComputedStyle(source);
  props.forEach(prop=>target.style[prop]=cs[prop]);
}

function openProject(p){
  const sourceCard=grid.querySelector(`[data-project="${p.id}"]`);
  const sourceTitle=sourceCard?.querySelector("h3");
  const sourceType=sourceCard?.querySelector(".project-type");
  const sourceLine=sourceCard?.querySelector(".project-line");
  const lineParts=sourceLine?.querySelectorAll("span");

  modalTitle.removeAttribute("style");
  modalMeta.removeAttribute("style");
  modalDescription.removeAttribute("style");

  modalTitle.innerHTML=sourceTitle?.innerHTML||p.title;
  const number=lineParts?.[0]?.textContent||p.number;
  const year=lineParts?.[1]?.textContent||p.year;
  const type=sourceType?.textContent||p.type;
  modalMeta.textContent=`${number} · ${type} · ${year}`;
  modalDescription.textContent=p.description;

  mirrorStyle(sourceTitle,modalTitle,["color","fontFamily","fontWeight","fontStyle","letterSpacing","textTransform"]);
  mirrorStyle(sourceType,modalMeta,["color","fontFamily","fontSize","fontWeight","letterSpacing","textTransform"]);

  modalGallery.innerHTML="";
  if(!p.images.length){
    const e=document.createElement("div");
    e.className="modal-empty";
    e.innerHTML='<div class="modal-empty-art">AJAM</div><p>Emplacement prêt pour les nouveaux visuels.</p>';
    modalGallery.appendChild(e);
  }else{
    p.images.forEach((src,i)=>{
      const f=document.createElement("figure");
      f.className="modal-image-wrap";
      const im=document.createElement("img");
      im.src=src;
      im.alt=`${p.title} — visuel ${i+1}`;
      im.loading="lazy";
      f.appendChild(im);
      modalGallery.appendChild(f);
    });
  }

  modal.dataset.project=p.id;
  modal.showModal();
  document.body.classList.add("modal-open");
  window.dispatchEvent(new CustomEvent("portfolio:project-open",{detail:{id:p.id}}));
}

grid.addEventListener("click",e=>{
  const b=e.target.closest("[data-project]");
  if(!b)return;
  const p=portfolioProjects.find(x=>x.id===b.dataset.project);
  if(p)openProject(p);
});
function close(){modal.close();document.body.classList.remove("modal-open")}
modalClose.addEventListener("click",close);
modal.addEventListener("click",e=>{if(e.target===modal)close()});
modal.addEventListener("close",()=>document.body.classList.remove("modal-open"));
