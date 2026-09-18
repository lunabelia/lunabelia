
(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get("edit")!=="1") return;

  document.documentElement.classList.add("portfolio-editor-active");

  const STORAGE_KEY="anastasiia_portfolio_visual_edits_v1";
  let edits={};
  try{edits=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch(_){edits={}}

  const staticTargets=[
    ["header.brand",".brand-name","Имя в шапке"],
    ["header.projects",'.main-nav a[href="#projets"]',"Меню — Projets"],
    ["header.about",'.main-nav a[href="#apropos"]',"Меню — À propos"],
    ["header.contact",'.main-nav a[href="#contact"]',"Меню — Contact"],
    ["hero.eyebrow",".hero .eyebrow","Надпись над именем"],
    ["hero.name",".hero h1","Имя"],
    ["hero.role",".hero-role","GRAPHISTE"],
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

  const targets=new Map();

  function addTarget(key,el,label){
    if(!el) return;
    el.dataset.peKey=key;
    el.dataset.peLabel=label||key;
    targets.set(key,el);
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

  const styleProps=["color","fontFamily","fontSize","fontWeight","letterSpacing","lineHeight","textAlign","marginTop","maxWidth","transform","display"];

  function applyEdit(el,data){
    if(!el||!data) return;
    if(typeof data.html==="string") el.innerHTML=data.html;
    if(data.style){
      styleProps.forEach(p=>{
        if(Object.prototype.hasOwnProperty.call(data.style,p)) el.style[p]=data.style[p]||"";
      });
    }
  }

  targets.forEach((el,key)=>applyEdit(el,edits[key]));

  let selected=null;
  let selectedKey=null;

  const panel=document.createElement("aside");
  panel.className="pe-panel";
  panel.innerHTML=`
    <div class="pe-head">
      <div class="pe-title">✦ Редактор сайта</div>
      <button class="pe-close" type="button" title="Свернуть">×</button>
    </div>
    <p class="pe-help">Кликни по тексту на странице. Двойной клик — сразу редактировать текст.</p>
    <div class="pe-selected-name">Ничего не выбрано</div>

    <div class="pe-row one">
      <button class="pe-btn pink pe-edit-text" type="button">Редактировать текст</button>
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
      <div class="pe-field"><label>Размер, px</label><input type="number" data-control="fontSize" min="6" max="240" step="1"></div>
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
      <div class="pe-field"><label>Сдвиг X, px</label><input type="number" data-control="x" min="-500" max="500" step="1"></div>
      <div class="pe-field"><label>Сдвиг Y, px</label><input type="number" data-control="y" min="-500" max="500" step="1"></div>
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
      <button class="pe-btn primary pe-save" type="button">Сохранить</button>
      <button class="pe-btn pe-download wide" type="button">Скачать правки для публикации</button>
      <button class="pe-btn pe-reset-all wide" type="button">Сбросить все локальные правки</button>
    </div>
    <div class="pe-status">«Сохранить» сохраняет визуальную версию только в этом браузере. Файл из «Скачать правки» можно отправить в ChatGPT, чтобы опубликовать её на GitHub.</div>
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
    const raw=el.style.transform||"";
    const m=raw.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    return m?[parseFloat(m[1]),parseFloat(m[2])]:[0,0];
  }

  function syncControls(){
    if(!selected){
      nameBox.textContent="Ничего не выбрано";
      return;
    }
    const cs=getComputedStyle(selected);
    nameBox.textContent=selected.dataset.peLabel+"  ·  "+selectedKey;
    controls.fontFamily.value=selected.style.fontFamily.replace(/["']/g,"").split(",")[0]||"";
    if(!["","Montserrat","Medino"].includes(controls.fontFamily.value)) controls.fontFamily.value="";
    controls.color.value=rgbToHex(selected.style.color||cs.color);
    controls.fontSize.value=pxNum(selected.style.fontSize||cs.fontSize);
    controls.fontWeight.value=selected.style.fontWeight||"";
    controls.letterSpacing.value=cs.letterSpacing==="normal"?"":pxNum(selected.style.letterSpacing||cs.letterSpacing);
    controls.lineHeight.value=cs.lineHeight==="normal"?"":(parseFloat(cs.lineHeight)/parseFloat(cs.fontSize)).toFixed(2);
    controls.marginTop.value=pxNum(selected.style.marginTop||cs.marginTop);
    controls.maxWidth.value=selected.style.maxWidth?pxNum(selected.style.maxWidth):"";
    controls.textAlign.value=selected.style.textAlign||"";
    controls.display.value=selected.style.display==="none"?"none":"";
    const [x,y]=currentTranslate(selected);
    controls.x.value=x; controls.y.value=y;
  }

  function select(el){
    if(selected) selected.classList.remove("pe-selected");
    selected=el;
    selectedKey=el?.dataset.peKey||null;
    if(selected) selected.classList.add("pe-selected");
    syncControls();
  }

  function recordSelected(){
    if(!selected||!selectedKey) return;
    const style={};
    styleProps.forEach(p=>{
      if(selected.style[p]) style[p]=selected.style[p];
    });
    edits[selectedKey]={html:selected.innerHTML,style};
  }

  function saveLocal(message="Сохранено локально ✓"){
    if(selected) recordSelected();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(edits));
    const status=panel.querySelector(".pe-status");
    const old=status.textContent;
    status.textContent=message;
    setTimeout(()=>status.textContent=old,1800);
  }

  document.addEventListener("click",e=>{
    if(e.target.closest(".pe-panel,.pe-mini")) return;
    const target=e.target.closest("[data-pe-key]");
    if(target){
      e.preventDefault();
      e.stopPropagation();
      select(target);
    }
  },true);

  document.addEventListener("dblclick",e=>{
    if(e.target.closest(".pe-panel,.pe-mini")) return;
    const target=e.target.closest("[data-pe-key]");
    if(!target) return;
    e.preventDefault();e.stopPropagation();
    select(target);
    target.contentEditable="true";
    target.focus();
  },true);

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&selected?.isContentEditable){
      selected.contentEditable="false";
      recordSelected();
    }
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){
      e.preventDefault();
      saveLocal();
    }
  });

  panel.querySelector(".pe-edit-text").addEventListener("click",()=>{
    if(!selected) return;
    selected.contentEditable="true";
    selected.focus();
    const r=document.createRange();r.selectNodeContents(selected);r.collapse(false);
    const s=window.getSelection();s.removeAllRanges();s.addRange(r);
  });

  document.addEventListener("focusout",e=>{
    if(e.target?.matches?.("[data-pe-key][contenteditable='true']")){
      e.target.contentEditable="false";
      recordSelected();
    }
  });

  function setStyle(prop,value){
    if(!selected) return;
    selected.style[prop]=value;
    recordSelected();
  }

  controls.fontFamily.addEventListener("change",()=>setStyle("fontFamily",controls.fontFamily.value?('"'+controls.fontFamily.value+'"'):""));
  controls.color.addEventListener("input",()=>setStyle("color",controls.color.value));
  controls.fontSize.addEventListener("input",()=>setStyle("fontSize",controls.fontSize.value?controls.fontSize.value+"px":""));
  controls.fontWeight.addEventListener("change",()=>setStyle("fontWeight",controls.fontWeight.value));
  controls.letterSpacing.addEventListener("input",()=>setStyle("letterSpacing",controls.letterSpacing.value!==""?controls.letterSpacing.value+"px":""));
  controls.lineHeight.addEventListener("input",()=>setStyle("lineHeight",controls.lineHeight.value));
  controls.marginTop.addEventListener("input",()=>setStyle("marginTop",controls.marginTop.value!==""?controls.marginTop.value+"px":""));
  controls.maxWidth.addEventListener("input",()=>setStyle("maxWidth",controls.maxWidth.value?controls.maxWidth.value+"px":""));
  controls.textAlign.addEventListener("change",()=>setStyle("textAlign",controls.textAlign.value));
  controls.display.addEventListener("change",()=>setStyle("display",controls.display.value));

  function updateTranslate(){
    if(!selected) return;
    const x=parseFloat(controls.x.value)||0,y=parseFloat(controls.y.value)||0;
    setStyle("transform",(x||y)?`translate(${x}px, ${y}px)`:"");
  }
  controls.x.addEventListener("input",updateTranslate);
  controls.y.addEventListener("input",updateTranslate);

  panel.querySelector(".pe-save").addEventListener("click",()=>saveLocal());

  panel.querySelector(".pe-reset-one").addEventListener("click",()=>{
    if(!selectedKey||!selected) return;
    delete edits[selectedKey];
    location.reload();
  });

  panel.querySelector(".pe-reset-all").addEventListener("click",()=>{
    if(!confirm("Точно удалить все локальные правки?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  panel.querySelector(".pe-download").addEventListener("click",()=>{
    saveLocal("Правки подготовлены ✓");
    const payload={
      format:"anastasiia-portfolio-edits-v1",
      createdAt:new Date().toISOString(),
      page:location.pathname,
      edits
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="portfolio-edits.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  panel.querySelector(".pe-close").addEventListener("click",()=>{
    panel.hidden=true;mini.hidden=false;
  });
  mini.addEventListener("click",()=>{mini.hidden=true;panel.hidden=false});

  // Prevent accidental navigation while editing.
  document.addEventListener("click",e=>{
    if(e.target.closest(".pe-panel,.pe-mini")) return;
    if(e.target.closest("a,button")&&!e.target.closest("[data-pe-key]")){
      e.preventDefault();
    }
  },true);
})();
