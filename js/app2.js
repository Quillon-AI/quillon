/* ===== QUIZ DATA ===== */
const QZ=[
  {type:'pat',q:'Какой паттерн тебе ближе?',sub:'Выбери интуитивно',opts:[{p:'grid',t:'Чёткая структура',s:{py:2,fl:0,qa:1}},{p:'wave',t:'Плавные формы',s:{py:0,fl:2,qa:0}},{p:'zigzag',t:'Резкие ритмы',s:{py:1,fl:1,qa:1}},{p:'spiral',t:'Свободная абстракция',s:{py:1,fl:2,qa:0}}],aa:1},
  {type:'iface',q:'Какой интерфейс сделан правильно?',sub:'Сравни два экрана',opts:[{v:'good',t:'Вариант A',s:{py:0,fl:1,qa:2}},{v:'bad',t:'Вариант B',s:{py:0,fl:0,qa:0}}],aa:1},
  {type:'cards',q:'Ты строишь дом. С чего начинаешь?',opts:[{i:'🧱',t:'Фундамент',s:{py:2,fl:0,qa:1}},{i:'📋',t:'Планировка',s:{py:2,fl:0,qa:1}},{i:'🏛️',t:'Фасад',s:{py:0,fl:2,qa:0}},{i:'👥',t:'Собираю команду',s:{py:1,fl:1,qa:1}}],aa:1},
  {type:'maze',q:'Найди выход из лабиринта',sub:'Проведи линию от входа до выхода'},
  {type:'drag',q:'Расставь приоритеты запуска продукта',sub:'Перетащи в порядке важности',items:[{id:'d',t:'🎨 Красивый дизайн',s:{py:0,fl:2,qa:0}},{id:'c',t:'⚙️ Работающий код',s:{py:2,fl:0,qa:1}},{id:'b',t:'🛡️ Нет багов',s:{py:0,fl:0,qa:2}},{id:'s',t:'🚀 Быстрая загрузка',s:{py:1,fl:1,qa:1}}]},
  {type:'cards',q:'Задача без инструкций. Твой подход:',opts:[{i:'📝',t:'Разбиваю на шаги',s:{py:1,fl:0,qa:2}},{i:'🔍',t:'Гуглю решение',s:{py:1,fl:1,qa:1}},{i:'🗣️',t:'Спрашиваю коллег',s:{py:0,fl:1,qa:1}},{i:'🧪',t:'Пробую всё подряд',s:{py:2,fl:1,qa:0}}],aa:1},
  {type:'cards',q:'Цель через 1 год?',opts:[{i:'💼',t:'Получить оффер',s:{py:1,fl:1,qa:1}},{i:'🌍',t:'Фриланс на удалёнке',s:{py:1,fl:2,qa:0}},{i:'🚀',t:'Свой продукт',s:{py:2,fl:1,qa:0}},{i:'🔥',t:'Всё и сразу',s:{py:1,fl:1,qa:1}}],aa:1},
  {type:'cards',q:'Сколько тебе лет?',opts:[{i:'🎓',t:'18 — 24'},{i:'💼',t:'25 — 34'},{i:'🔄',t:'35 — 44'},{i:'🌟',t:'45+'}],aa:1},
  {type:'cards',q:'Что сейчас не так?',sub:'Выбери самое важное',opts:[{i:'😔',t:'Работа не по душе'},{i:'💰',t:'Мало зарабатываю'},{i:'🏠',t:'Хочу удалёнку'},{i:'🚀',t:'Хочу своё дело'}],aa:1},
  {type:'cards',q:'Кем ты сейчас работаешь?',opts:[{i:'🏢',t:'Офис'},{i:'🛠️',t:'Производство'},{i:'🎨',t:'Творчество'},{i:'🛒',t:'Продажи'},{i:'📚',t:'Студент'},{i:'🔍',t:'Ищу работу'}],aa:1,cols:'c3'},
  {type:'city',q:'В каком городе ты живёшь?',sub:'Это влияет на зарплатные рекомендации',cities:['Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Казань','Краснодар','Нижний Новгород','Самара','Ростов-на-Дону','Челябинск']},
  {type:'cards',q:'Есть ли семья и дети?',sub:'От этого зависит доступное время',opts:[{i:'👤',t:'Нет семьи'},{i:'👫',t:'Есть партнёр'},{i:'👨‍👩‍👦',t:'Семья, 1 ребёнок'},{i:'👨‍👩‍👧‍👦',t:'2+ детей'}],aa:1}
];

const TQ=QZ.length;
let cur=0, ans=[], scr={py:0,fl:0,qa:0}, dragItems=[], autoTimer=null;

/* ===== QUIZ ENGINE ===== */
function go(){
  // Reset quiz state
  cur=0; ans=[]; scr={py:0,fl:0,qa:0};
  // Hide all screens, show quiz
  document.getElementById('hero').style.display='none';
  document.getElementById('res').classList.remove('on');
  document.getElementById('anl').classList.remove('on');
  document.getElementById('quiz').classList.add('on');
  document.getElementById('pT').textContent=TQ;
  renderQ();
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderQ(){
  const s=QZ[cur], el=document.getElementById('qC');
  const pct=Math.round(cur/TQ*100);
  document.getElementById('pC').textContent=cur+1;
  document.getElementById('pP').textContent=pct+'%';
  document.getElementById('pF').style.width=pct+'%';
  document.getElementById('bB').style.display=cur>0?'inline-flex':'none';
  const bn=document.getElementById('bN');
  const showNext = s.type==='drag' || s.type==='maze' || s.type==='city';
  bn.style.display = showNext ? 'inline-flex' : 'none';
  bn.disabled = s.type==='city' && !ans[cur];

  let h='<div class="qq"><h2>'+s.q+'</h2>'+(s.sub?'<p>'+s.sub+'</p>':'')+'</div>';

  if(s.type==='cards'){
    h+='<div class="qg'+(s.cols?' '+s.cols:'')+'">';
    s.opts.forEach(function(o,i){h+='<div class="qc'+(ans[cur]===i?' sel':'')+'" onclick="sel('+i+')"><span class="qi">'+o.i+'</span><span class="qt">'+o.t+'</span></div>'});
    h+='</div>';
  } else if(s.type==='pat'){
    h+='<div class="qg">';
    s.opts.forEach(function(o,i){h+='<div class="qc'+(ans[cur]===i?' sel':'')+'" onclick="sel('+i+')"><div class="psvg">'+svgPat(o.p)+'</div><span class="qt">'+o.t+'</span></div>'});
    h+='</div>';
  } else if(s.type==='iface'){
    h+='<div class="qg">';
    s.opts.forEach(function(o,i){h+='<div class="qc'+(ans[cur]===i?' sel':'')+'" onclick="sel('+i+')" style="padding:12px"><div class="mlbl">'+o.t+'</div><div class="mscr">'+svgMock(o.v)+'</div></div>'});
    h+='</div>';
  } else if(s.type==='city'){
    h+='<div class="qg c1">';
    s.cities.forEach(function(c){h+='<div class="qc'+(ans[cur]===c?' sel':'')+'" onclick="selCity(\''+c+'\')"><span class="qt">'+c+'</span></div>'});
    h+='<div class="qc'+(ans[cur]==='__o'?' sel':'')+'" onclick="selCityOther()"><span class="qi">✏️</span><span class="qt">Другой город</span></div></div>';
    h+='<div class="co-wrap'+(ans[cur]==='__o'?' vis':'')+'" id="cow"><input class="co-in" id="coI" placeholder="Введи свой город" oninput="onCityInput(this.value)"></div>';
  } else if(s.type==='maze'){
    h+='<div class="mzw" id="mW"><canvas id="mC"></canvas><span class="mzh">Проведи линию пальцем или мышью</span></div>';
  } else if(s.type==='drag'){
    var items = ans[cur] || s.items.map(function(x,i){return Object.assign({},x,{order:i})});
    h+='<div class="dl" id="dL">';
    items.forEach(function(x,i){h+='<div class="di" draggable="true" data-idx="'+i+'"><span class="dh">⠿</span><span class="dn">'+(i+1)+'</span><span class="dt">'+x.t+'</span></div>'});
    h+='</div>';
    dragItems=items;
  }
  el.innerHTML=h;
  if(s.type==='maze') setupMaze();
  if(s.type==='drag') setupDrag();
  if(s.type==='city'&&ans[cur]==='__o') setTimeout(function(){var i=document.getElementById('coI');if(i)i.focus()},50);
}

function sel(i){
  if(autoTimer)clearTimeout(autoTimer);
  ans[cur]=i;
  document.querySelectorAll('.qc').forEach(function(c,j){c.classList.toggle('sel',j===i)});
  if(QZ[cur].aa) autoTimer=setTimeout(function(){qNext()},350);
}

function selCity(c){
  if(autoTimer)clearTimeout(autoTimer);
  ans[cur]=c; renderQ();
  autoTimer=setTimeout(function(){qNext()},350);
}

function selCityOther(){
  if(autoTimer)clearTimeout(autoTimer);
  ans[cur]='__o'; renderQ();
  document.getElementById('bN').style.display='inline-flex';
  document.getElementById('bN').disabled=true;
  setTimeout(function(){var i=document.getElementById('coI');if(i)i.focus()},50);
}

function onCityInput(v){
  if(v.trim()){ans[cur]=v;document.getElementById('bN').disabled=false}
  else{document.getElementById('bN').disabled=true}
}

function qBack(){
  if(autoTimer){clearTimeout(autoTimer);autoTimer=null}
  if(cur>0){cur--;renderQ()}
}

function qNext(){
  if(autoTimer){clearTimeout(autoTimer);autoTimer=null}
  var s=QZ[cur];
  if((s.type==='cards'||s.type==='pat'||s.type==='iface')&&s.opts){
    var o=s.opts[ans[cur]];
    if(o&&o.s){scr.py+=(o.s.py||0);scr.fl+=(o.s.fl||0);scr.qa+=(o.s.qa||0)}
  }
  if(s.type==='drag'&&dragItems.length){
    dragItems.forEach(function(x,i){var m=i===0?2:1;if(x.s){scr.py+=(x.s.py||0)*m;scr.fl+=(x.s.fl||0)*m;scr.qa+=(x.s.qa||0)*m}});
  }
  cur++;
  if(cur<QZ.length) renderQ(); else showAnalysis();
}

/* ===== MAZE SETUP ===== */
function setupMaze(){
  genMaze();
  var wr=document.getElementById('mW'), c=document.getElementById('mC');
  if(!c)return;
  var r=wr.getBoundingClientRect();c.width=r.width;c.height=r.height;
  drawMazeGrid(c.getContext('2d'),c.width,c.height);
  var dl=document.createElement('canvas');dl.width=c.width;dl.height=c.height;
  dl.style.cssText='width:100%;height:100%;position:absolute;top:0;left:0;z-index:2';
  wr.appendChild(dl);
  var dx=dl.getContext('2d');dx.strokeStyle='#10B981';dx.lineWidth=3;dx.lineCap='round';
  var drawing=false;
  function gp(e){var r=dl.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(dl.width/r.width),y:(t.clientY-r.top)*(dl.height/r.height)}}
  function st(e){e.preventDefault();drawing=true;wr.classList.add('dr');var p=gp(e);dx.beginPath();dx.moveTo(p.x,p.y)}
  function mv(e){if(!drawing)return;e.preventDefault();var p=gp(e);dx.lineTo(p.x,p.y);dx.stroke()}
  function en(){drawing=false;ans[cur]='drawn'}
  dl.addEventListener('mousedown',st);dl.addEventListener('mousemove',mv);dl.addEventListener('mouseup',en);dl.addEventListener('mouseleave',en);
  dl.addEventListener('touchstart',st,{passive:false});dl.addEventListener('touchmove',mv,{passive:false});dl.addEventListener('touchend',en);
}

/* ===== DRAG SETUP ===== */
function setupDrag(){
  var l=document.getElementById('dL');if(!l)return;
  var dIdx=null;
  l.querySelectorAll('.di').forEach(function(it){
    it.addEventListener('dragstart',function(e){dIdx=+it.dataset.idx;it.classList.add('dg')});
    it.addEventListener('dragend',function(){it.classList.remove('dg')});
    it.addEventListener('dragover',function(e){e.preventDefault()});
    it.addEventListener('drop',function(e){e.preventDefault();var d2=+it.dataset.idx;if(dIdx!==null&&dIdx!==d2){var t=dragItems[dIdx];dragItems.splice(dIdx,1);dragItems.splice(d2,0,t);ans[cur]=dragItems.slice();renderQ()}});
  });
  // Touch drag
  var touchItem=null,touchClone=null,touchIdx=null;
  l.querySelectorAll('.di').forEach(function(it){
    it.addEventListener('touchstart',function(e){
      touchIdx=+it.dataset.idx;touchItem=it;
      touchClone=it.cloneNode(true);
      touchClone.style.cssText='position:fixed;z-index:999;opacity:.8;pointer-events:none;width:'+it.offsetWidth+'px';
      document.body.appendChild(touchClone);
      var t=e.touches[0];touchClone.style.left=(t.clientX-it.offsetWidth/2)+'px';touchClone.style.top=(t.clientY-24)+'px';
      it.style.opacity='.3';
    },{passive:true});
    it.addEventListener('touchmove',function(e){if(!touchClone)return;e.preventDefault();var t=e.touches[0];touchClone.style.left=(t.clientX-touchClone.offsetWidth/2)+'px';touchClone.style.top=(t.clientY-24)+'px'},{passive:false});
    it.addEventListener('touchend',function(e){
      if(!touchClone)return;if(touchItem)touchItem.style.opacity='1';
      var t=e.changedTouches[0];touchClone.remove();touchClone=null;
      var els=l.querySelectorAll('.di');var d2=touchIdx;
      els.forEach(function(el,i){var r=el.getBoundingClientRect();if(t.clientY>r.top&&t.clientY<r.bottom)d2=i});
      if(touchIdx!==null&&touchIdx!==d2){var tmp=dragItems[touchIdx];dragItems.splice(touchIdx,1);dragItems.splice(d2,0,tmp);ans[cur]=dragItems.slice();renderQ()}
      touchItem=null;touchIdx=null;
    });
  });
}
