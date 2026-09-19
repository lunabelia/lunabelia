(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get("edit")!=="1") return;

  document.documentElement.classList.add("portfolio-editor-active");

  const STORAGE_KEY="anastasiia_portfolio_visual_edits_v4";
  const styleProps=["color","fontFamily","fontSize","fontWeight","letterSpacing","lineHeight","textAlign","marginTop","maxWidth","translate","display"];

  let edits={};
  let addedTexts={};
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    if(saved&&saved.edits) edits=saved.edits||{};
    if(saved&&saved.addedTexts) addedTexts=saved.addedTexts||{};
  }catch(_){}

  const targets=new Map();
  const baseStates=new Map();
  const undoStack=[];
  let selected=null;
  let selectedKey=null;
  let currentProjectId=null;
  let textEditBefore=null;
  let dragState=null;
  let suppressNextClick=false;

  const staticTargets=[
    ["header.projects",'.main-nav a[href="#projets"]',"Меню — Projets"],
    ["header.about",'.main-nav a[href="#apropos"]',"Меню — À propos"],
    ["header.contact",'.main-nav a[href="#contact"]',"Меню — Contact"],
    ["hero.eyebrow",".hero .eyebrow","Надпись над PORTFOLIO"],
    ["hero.name",".hero h1","PORTFOLIO"],
    ["hero.role",".hero-role","Graphiste"],
    ["hero.intro",".hero-intro","Приветствие"],
    ["hero.email",".hero-meta a","E-mail"],
    ["hero.place",".hero-meta span","Город"],
    ["hero.scroll",".scroll-link","Voir les projets"],
    ["projects.kicker",".projects-section .section-kicker","Sélection"],
    ["projects.title",".projects-section .section-heading h2","Заголовок Projets"],
    ["projects.note",".section-note","Описание проектов"],
    ["about.kicker",".about-section .section-kicker","Profil"],
    ["about.title",".about-label h2","À propos"],
    ["about.lead",".about-lead","Главный текст À propos"],
    ["about.text",".about-copy > p:not(.about-lead)","Текст À propos"],
    ["contact.kicker",".contact-section .section-kicker","Contact"],
    ["contact.title",".contact-section h2","Un projet, une idée ?"],
    ["contact.mail",".contact-mail","Почта внизу"],
    ["contact.place",".contact-place","Место внизу"]
  ];

  function cloneState(){
    return JSON.stringify({edits,addedTexts});
  }

  function persist(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({edits,addedTexts}));
  }

  function updateUndoButton(){
    const b=document.querySelector(".pe-undo");
    if(b) b.disabled=!undoStack.length;
  }

  function commitAction(before){
    const after=cloneState();
    if(before&&before!==after){
      undoStack.push(before);
      if(undoStack.length>80) undoStack.shift();
      persist();
      updateUndoButton();
    }
  }

  function captureBase(el){
    const style={};
    styleProps.forEach(p=>style[p]=el.style[p]||"");
    return {html:el.innerHTML,style};
  }

  function restoreBase(key,el){
    const base=baseStates.get(key);
    if(!base||!el) return;
    el.innerHTML=base.html;
    styleProps.forEach(p=>el.style[p]=base.style[p]||"");
  }

  function applyEdit(el,data){
    if(!el||!data) return;
    if(typeof data.html==="string") el.innerHTML=data.html;
    if(data.style){
      styleProps.forEach(p=>{
        if(Object.prototype.hasOwnProperty.call(data.style,p)) el.style[p]=data.style[p]||"";
      });
    }
  }

  function addTarget(key,el,label,{freshBase=false}={}){
    if(!el) return;
    el.dataset.peKey=key;
    el.dataset.peLabel=label||key;
    targets.set(key,el);
    if(freshBase||!baseStates.has(key)) baseStates.set(key,captureBase(el));
    if(edits[key]) applyEdit(el,edits[key]);
  }

  function removeAddedElements(){
    document.querySelectorAll("[data-pe-added='1']").forEach(el=>el.remove());
    [...targets.keys()].filter(k=>k.startsWith("added.")).forEach(k=>{
      targets.delete(k);
      baseStates.delete(k);
    });
  }

  function rebuildAddedTexts(){
    removeAddedElements();
    Object.entries(addedTexts).forEach(([id,spec])=>{
      const key="added."+id;
      const anchor=targets.get(spec.anchorKey);
      if(!anchor||!document.contains(anchor)) return;
      const el=document.createElement("p");
      el.className="pe-added-text";
      el.dataset.peAdded="1";
      el.dataset.peScope=spec.scope||"page";
      const data=edits[key]||{html:"Новый текст",style:{}};
      el.innerHTML=data.html||"Новый текст";
      if(data.style) styleProps.forEach(p=>{if(data.style[p]) el.style[p]=data.style[p]});
      anchor.insertAdjacentElement("afterend",el);
      addTarget(key,el,"Добавленный текст",{freshBase:true});
    });
  }

  function applyAll(){
    targets.forEach((el,key)=>{
      if(key.startsWith("added.")) return;
      restoreBase(key,el);
      if(edits[key]) applyEdit(el,edits[key]);
    });
    rebuildAddedTexts();
    if(selectedKey&&targets.has(selectedKey)) select(targets.get(selectedKey));
    else select(null);
  }

  function undo(){
    if(!undoStack.length) return;
    if(selected?.isContentEditable) selected.contentEditable="false";
    const snap=undoStack.pop();
    try{
      const state=JSON.parse(snap);
      edits=state.edits||{};
      addedTexts=state.addedTexts||{};
    }catch(_){return}
    persist();
    applyAll();
    updateUndoButton();
    flashStatus("Последнее действие отменено ↶");
  }

  staticTargets.forEach(([k,s,l])=>addTarget(k,document.querySelector(s),l));

  document.querySelectorAll(".project-button").forEach(btn=>{
    const id=btn.dataset.project||Math.random().toString(36).slice(2);
    addTarget("project."+id+".title",btn.querySelector("h3"),"Проект — название");
    addTarget("project."+id+".type",btn.querySelector(".project-type"),"Проект — тип");
    addTarget("project."+id+".summary",btn.querySelector(".project-summary"),"Проект — описание");
    addTarget("project."+id+".open",btn.querySelector(".project-open"),"Проект — кнопка");
    const line=btn.querySelector(".project-line");
    if(line){
      const spans=line.querySelectorAll("span");
      addTarget("project."+id+".number",spans[0],"Проект — номер");
      addTarget("project."+id+".year",spans[1],"Проект — год");
    }
  });

  document.querySelectorAll(".skills span").forEach((el,i)=>addTarget("about.skill."+i,el,"Навык "+(i+1)));

  const panel=document.createElement("aside");
  panel.className="pe-panel";
  panel.innerHTML=`
    <div class="pe-head">
      <div class="pe-title">✦ Редактор сайта</div>
      <div class="pe-head-actions">
        <button class="pe-icon-btn pe-undo" type="button" title="Отменить последнее действие (Ctrl+Z)" disabled>↶</button>
        <button class="pe-icon-btn pe-close" type="button" title="Свернуть">×</button>
      </div>
    </div>
    <p class="pe-help"><b>Хватай текст мышкой и тащи.</b> Клик — выбрать, двойной клик — редактировать. Чтобы войти внутрь проекта, кликни по его картинке.</p>
    <div class="pe-selected-name">Ничего не выбрано</div>

    <div class="pe-toolbar">
      <button class="pe-btn pink pe-edit-text" type="button">Редактировать текст</button>
      <button class="pe-btn pe-add-text" type="button">＋ Новый текст</button>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Шрифт</label><select data-control="fontFamily">
        <option value="">Как сейчас</option>
        <option value="Montserrat">Montserrat</option>
        <option value="Medino">Medino</option>
      </select></div>
      <div class="pe-field"><label>Цвет</label><input type="color" data-control="color" value="#111111"></div>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Размер, px</label><input type="number" data-control="fontSize" min="6" max="260" step="1"></div>
      <div class="pe-field"><label>Жирность</label><select data-control="fontWeight">
        <option value="">Как сейчас</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option>
      </select></div>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Интервал букв, px</label><input type="number" data-control="letterSpacing" min="-20" max="50" step=".1"></div>
      <div class="pe-field"><label>Интерлиньяж</label><input type="number" data-control="lineHeight" min=".5" max="4" step=".05"></div>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Отступ сверху, px</label><input type="number" data-control="marginTop" min="-300" max="500" step="1"></div>
      <div class="pe-field"><label>Макс. ширина, px</label><input type="number" data-control="maxWidth" min="0" max="2000" step="5"></div>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Сдвиг X, px</label><input type="number" data-control="x" min="-1000" max="1000" step="1"></div>
      <div class="pe-field"><label>Сдвиг Y, px</label><input type="number" data-control="y" min="-1000" max="1000" step="1"></div>
    </div>

    <div class="pe-row">
      <div class="pe-field"><label>Выравнивание</label><select data-control="textAlign">
        <option value="">Как сейчас</option><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option>
      </select></div>
      <div class="pe-field"><label>Видимость</label><select data-control="display">
        <option value="">Как сейчас</option><option value="none">Скрыть</option>
      </select></div>
    </div>

    <div class="pe-actions">
      <button class="pe-btn pe-reset-one" type="button">Сбросить элемент</button>
      <button class="pe-btn pe-delete-text" type="button" disabled>Удалить новый текст</button>
      <button class="pe-btn primary pe-save wide" type="button">Сохранить</button>
      <button class="pe-btn pe-download wide" type="button">Скачать правки для публикации</button>
      <button class="pe-btn pe-reset-all wide" type="button">Сбросить все локальные правки</button>
    </div>
    <div class="pe-status">Правки автоматически сохраняются в этом браузере. Ctrl+Z или ↶ отменяет последнее действие. Для публикации скачай файл и пришли его в ChatGPT.</div>
  `;
  document.body.appendChild(panel);

  const mini=document.createElement("button");
  mini.className="pe-mini";
  mini.type="button";
  mini.textContent="✦ Редактор";
  mini.hidden=true;
  document.body.appendChild(mini);

  const nameBox=panel.querySelector(".pe-selected-name");
  const controls={};
  panel.querySelectorAll("[data-control]").forEach(el=>controls[el.dataset.control]=el);

  function flashStatus(message){
    const status=panel.querySelector(".pe-status");
    const old=status.textContent;
    status.textContent=message;
    clearTimeout(flashStatus.t);
    flashStatus.t=setTimeout(()=>status.textContent=old,1800);
  }

  function pxNum(v){
    const n=parseFloat(v);
    return Number.isFinite(n)?n:"";
  }

  function rgbToHex(rgb){
    if(!rgb) return "#111111";
    if(rgb.startsWith("#")) return rgb.slice(0,7);
    const m=rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if(!m) return "#111111";
    return "#"+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,"0")).join("");
  }

  function currentTranslate(el){
    const raw=(el.style.translate||"").trim();
    if(!raw||raw==="none") return [0,0];
    const nums=raw.match(/-?[\d.]+/g)||[];
    return [parseFloat(nums[0])||0,parseFloat(nums[1])||0];
  }

  function recordSelected(){
    if(!selected||!selectedKey) return;
    const style={};
    styleProps.forEach(p=>{if(selected.style[p]) style[p]=selected.style[p]});
    edits[selectedKey]={html:selected.innerHTML,style};
  }

  function syncControls(){
    const del=panel.querySelector(".pe-delete-text");
    if(!selected){
      nameBox.textContent="Ничего не выбрано";
      del.disabled=true;
      return;
    }
    const cs=getComputedStyle(selected);
    nameBox.textContent=selected.dataset.peLabel+"  ·  "+selectedKey;
    const fam=(selected.style.fontFamily||cs.fontFamily||"").replace(/["']/g,"");
    controls.fontFamily.value=fam.includes("Medino")?"Medino":fam.includes("Montserrat")?"Montserrat":"";
    controls.color.value=rgbToHex(selected.style.color||cs.color);
    controls.fontSize.value=pxNum(selected.style.fontSize||cs.fontSize);
    controls.fontWeight.value=["400","500","600","700"].includes(String(selected.style.fontWeight||cs.fontWeight))?String(selected.style.fontWeight||cs.fontWeight):"";
    controls.letterSpacing.value=cs.letterSpacing==="normal"?"":pxNum(selected.style.letterSpacing||cs.letterSpacing);
    controls.lineHeight.value=cs.lineHeight==="normal"?"":(parseFloat(cs.lineHeight)/parseFloat(cs.fontSize)).toFixed(2);
    controls.marginTop.value=pxNum(selected.style.marginTop||cs.marginTop);
    controls.maxWidth.value=selected.style.maxWidth?pxNum(selected.style.maxWidth):"";
    controls.textAlign.value=selected.style.textAlign||"";
    controls.display.value=selected.style.display==="none"?"none":"";
    const [x,y]=currentTranslate(selected);
    controls.x.value=x;
    controls.y.value=y;
    del.disabled=!selectedKey.startsWith("added.");
  }

  function select(el){
    if(selected&&selected!==el) selected.classList.remove("pe-selected");
    selected=el||null;
    selectedKey=el?.dataset.peKey||null;
    if(selected) selected.classList.add("pe-selected");
    syncControls();
  }

  function startTextEdit(el){
    if(!el) return;
    select(el);
    if(!el.isContentEditable) textEditBefore=cloneState();
    el.contentEditable="true";
    el.focus();
    const r=document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const s=window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  function finishTextEdit(el){
    if(!el?.isContentEditable) return;
    el.contentEditable="false";
    if(el===selected) recordSelected();
    if(textEditBefore){
      commitAction(textEditBefore);
      textEditBefore=null;
    }
  }

  function setStyle(prop,value){
    if(!selected) return;
    selected.style[prop]=value;
    recordSelected();
  }

  function setTranslate(x,y){
    if(!selected) return;
    const xx=parseFloat(x)||0;
    const yy=parseFloat(y)||0;
    setStyle("translate",(xx||yy)?xx+"px "+yy+"px":"");
  }

  function clearModalTargets(){
    [...targets.keys()].filter(k=>k.startsWith("modal.")).forEach(k=>{
      targets.delete(k);
      baseStates.delete(k);
    });
    document.querySelectorAll("#project-modal [data-pe-key]").forEach(el=>{
      if(el.dataset.peKey?.startsWith("modal.")){
        delete el.dataset.peKey;
        delete el.dataset.peLabel;
      }
    });
  }

  function registerModalProject(id){
    currentProjectId=id;
    if(selectedKey?.startsWith("modal.")) select(null);
    clearModalTargets();
    document.querySelectorAll("#project-modal [data-pe-added='1']").forEach(el=>el.remove());

    const modalTitle=document.getElementById("modal-title");
    const modalMeta=document.getElementById("modal-meta");
    const modalDescription=document.getElementById("modal-description");
    addTarget("modal."+id+".meta",modalMeta,"Внутри проекта — строка сверху",{freshBase:true});
    addTarget("modal."+id+".title",modalTitle,"Внутри проекта — заголовок",{freshBase:true});
    addTarget("modal."+id+".description",modalDescription,"Внутри проекта — описание",{freshBase:true});
    rebuildAddedTexts();
  }

  window.addEventListener("portfolio:project-open",e=>{
    const id=e.detail?.id;
    if(id) registerModalProject(id);
  });

  document.getElementById("project-modal")?.addEventListener("close",()=>{
    if(selectedKey?.startsWith("modal.")||selectedKey?.startsWith("added.")) select(null);
    currentProjectId=null;
  });

  document.addEventListener("click",e=>{
    if(e.target.closest(".pe-panel,.pe-mini")) return;

    if(suppressNextClick){
      suppressNextClick=false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const target=e.target.closest("[data-pe-key]");
    if(target){
      e.preventDefault();
      e.stopPropagation();
      select(target);
      return;
    }

    if(e.target.closest(".project-visual,.modal-close")) return;

    if(e.target.closest("a,button")){
      e.preventDefault();
    }
  },true);

  document.addEventListener("dblclick",e=>{
    if(e.target.closest(".pe-panel,.pe-mini")) return;
    const target=e.target.closest("[data-pe-key]");
    if(!target) return;
    e.preventDefault();
    e.stopPropagation();
    startTextEdit(target);
  },true);

  document.addEventListener("pointerdown",e=>{
    if(e.button!==0||e.target.closest(".pe-panel,.pe-mini")) return;
    const target=e.target.closest("[data-pe-key]");
    if(!target||target.isContentEditable) return;
    const [tx,ty]=currentTranslate(target);
    dragState={
      el:target,
      key:target.dataset.peKey,
      startX:e.clientX,
      startY:e.clientY,
      tx,ty,
      moved:false,
      before:cloneState()
    };
  },true);

  document.addEventListener("pointermove",e=>{
    if(!dragState) return;
    const dx=e.clientX-dragState.startX;
    const dy=e.clientY-dragState.startY;
    if(!dragState.moved&&Math.hypot(dx,dy)<4) return;
    dragState.moved=true;
    document.body.classList.add("pe-dragging");
    select(dragState.el);
    dragState.el.style.translate=(dragState.tx+dx)+"px "+(dragState.ty+dy)+"px";
    recordSelected();
    syncControls();
    e.preventDefault();
  },{capture:true,passive:false});

  document.addEventListener("pointerup",()=>{
    if(!dragState) return;
    if(dragState.moved){
      recordSelected();
      commitAction(dragState.before);
      suppressNextClick=true;
    }
    document.body.classList.remove("pe-dragging");
    dragState=null;
  },true);

  document.addEventListener("input",e=>{
    const el=e.target.closest?.("[data-pe-key][contenteditable='true']");
    if(el&&el===selected) recordSelected();
  });

  document.addEventListener("focusout",e=>{
    const el=e.target.closest?.("[data-pe-key][contenteditable='true']");
    if(el) finishTextEdit(el);
  });

  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!e.shiftKey){
      e.preventDefault();
      if(selected?.isContentEditable) finishTextEdit(selected);
      undo();
      return;
    }
    if(e.key==="Escape"&&selected?.isContentEditable){
      finishTextEdit(selected);
      return;
    }
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){
      e.preventDefault();
      if(selected?.isContentEditable) finishTextEdit(selected);
      persist();
      flashStatus("Сохранено ✓");
    }
  });

  panel.querySelector(".pe-edit-text").addEventListener("click",()=>startTextEdit(selected));

  panel.querySelector(".pe-add-text").addEventListener("click",()=>{
    const before=cloneState();
    let anchorKey=selectedKey;
    if(!anchorKey||!targets.has(anchorKey)){
      anchorKey=currentProjectId?"modal."+currentProjectId+".description":"hero.intro";
    }
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const key="added."+id;
    addedTexts[id]={anchorKey,scope:currentProjectId?"modal:"+currentProjectId:"page"};
    edits[key]={
      html:"Новый текст",
      style:{fontFamily:"Montserrat",fontSize:"16px",fontWeight:"400"}
    };
    rebuildAddedTexts();
    const el=targets.get(key);
    select(el);
    commitAction(before);
    startTextEdit(el);
  });

  panel.querySelector(".pe-delete-text").addEventListener("click",()=>{
    if(!selectedKey?.startsWith("added.")) return;
    const before=cloneState();
    const id=selectedKey.slice("added.".length);
    delete edits[selectedKey];
    delete addedTexts[id];
    select(null);
    rebuildAddedTexts();
    commitAction(before);
  });

  const numericLive=[
    ["color",v=>setStyle("color",v)],
    ["fontSize",v=>setStyle("fontSize",v?v+"px":"")],
    ["letterSpacing",v=>setStyle("letterSpacing",v!==""?v+"px":"")],
    ["lineHeight",v=>setStyle("lineHeight",v)],
    ["marginTop",v=>setStyle("marginTop",v!==""?v+"px":"")],
    ["maxWidth",v=>setStyle("maxWidth",v?v+"px":"")]
  ];
  const inputSnapshots=new WeakMap();
  numericLive.forEach(([name,fn])=>{
    const el=controls[name];
    el.addEventListener("focus",()=>inputSnapshots.set(el,cloneState()));
    el.addEventListener("input",()=>fn(el.value));
    el.addEventListener("change",()=>{
      const before=inputSnapshots.get(el);
      if(before) commitAction(before);
      inputSnapshots.delete(el);
    });
  });

  [controls.x,controls.y].forEach(el=>{
    el.addEventListener("focus",()=>inputSnapshots.set(el,cloneState()));
    el.addEventListener("input",()=>setTranslate(controls.x.value,controls.y.value));
    el.addEventListener("change",()=>{
      const before=inputSnapshots.get(el);
      if(before) commitAction(before);
      inputSnapshots.delete(el);
    });
  });

  controls.fontFamily.addEventListener("change",()=>{
    const before=cloneState();
    setStyle("fontFamily",controls.fontFamily.value?'"'+controls.fontFamily.value+'"':"");
    commitAction(before);
  });
  controls.fontWeight.addEventListener("change",()=>{
    const before=cloneState();
    setStyle("fontWeight",controls.fontWeight.value);
    commitAction(before);
  });
  controls.textAlign.addEventListener("change",()=>{
    const before=cloneState();
    setStyle("textAlign",controls.textAlign.value);
    commitAction(before);
  });
  controls.display.addEventListener("change",()=>{
    const before=cloneState();
    setStyle("display",controls.display.value);
    commitAction(before);
  });

  panel.querySelector(".pe-undo").addEventListener("click",undo);

  panel.querySelector(".pe-reset-one").addEventListener("click",()=>{
    if(!selectedKey||!selected) return;
    const before=cloneState();
    if(selectedKey.startsWith("added.")){
      const id=selectedKey.slice("added.".length);
      delete edits[selectedKey];
      delete addedTexts[id];
      select(null);
      rebuildAddedTexts();
    }else{
      delete edits[selectedKey];
      restoreBase(selectedKey,selected);
      select(selected);
    }
    commitAction(before);
  });

  panel.querySelector(".pe-save").addEventListener("click",()=>{
    if(selected?.isContentEditable) finishTextEdit(selected);
    persist();
    flashStatus("Сохранено ✓");
  });

  panel.querySelector(".pe-reset-all").addEventListener("click",()=>{
    if(!confirm("Точно удалить все локальные правки?")) return;
    const before=cloneState();
    edits={};
    addedTexts={};
    applyAll();
    commitAction(before);
    flashStatus("Все локальные правки сброшены");
  });

  panel.querySelector(".pe-download").addEventListener("click",()=>{
    if(selected?.isContentEditable) finishTextEdit(selected);
    persist();
    const payload={
      format:"anastasiia-portfolio-edits-v2",
      editorVersion:4,
      createdAt:new Date().toISOString(),
      page:location.pathname,
      edits,
      addedTexts
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="portfolio-edits.json";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    flashStatus("Файл правок скачан ✓");
  });

  panel.querySelector(".pe-close").addEventListener("click",()=>{
    panel.hidden=true;
    mini.hidden=false;
  });
  mini.addEventListener("click",()=>{
    mini.hidden=true;
    panel.hidden=false;
  });

  rebuildAddedTexts();
  updateUndoButton();
})();