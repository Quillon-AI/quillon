/* ===== HERO PARTICLES ===== */
(function(){
  const c=document.getElementById('hC');if(!c)return;
  const x=c.getContext('2d');let w,h,P=[],m={x:-1e3,y:-1e3};
  function rs(){const r=c.parentElement.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;c.width=w*d;c.height=h*d;c.style.width=w+'px';c.style.height=h+'px';x.setTransform(d,0,0,d,0,0)}
  function init(){rs();P=[];for(let i=0;i<55;i++)P.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*2+1})}
  function draw(){x.clearRect(0,0,w,h);for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const dx=P[i].x-P[j].x,dy=P[i].y-P[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){x.strokeStyle=`rgba(31,78,216,${.18*(1-d/140)})`;x.lineWidth=1;x.beginPath();x.moveTo(P[i].x,P[i].y);x.lineTo(P[j].x,P[j].y);x.stroke()}}
  P.forEach(p=>{const dx=p.x-m.x,dy=p.y-m.y,d=Math.sqrt(dx*dx+dy*dy);if(d<150){p.vx+=dx/d*.03;p.vy+=dy/d*.03}p.x+=p.vx;p.y+=p.vy;p.vx*=.999;p.vy*=.999;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fillStyle='rgba(96,165,250,0.5)';x.fill()});requestAnimationFrame(draw)}
  c.parentElement.addEventListener('mousemove',e=>{const r=c.parentElement.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top});
  window.addEventListener('resize',rs);init();draw();
})();

/* ===== SVG HELPERS ===== */
function svgPat(t){
  if(t==='grid')return '<svg viewBox="0 0 200 80"><defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0V20H0" fill="none" stroke="rgba(59,130,246,.35)"/></pattern></defs><rect width="200" height="80" fill="rgba(31,78,216,.08)"/><rect width="200" height="80" fill="url(#g)"/></svg>';
  if(t==='wave')return '<svg viewBox="0 0 200 80"><rect width="200" height="80" fill="rgba(124,58,237,.06)"/><path d="M0 50Q25 20 50 40T100 35T150 45T200 30" fill="none" stroke="rgba(124,58,237,.4)" stroke-width="2"/></svg>';
  if(t==='zigzag')return '<svg viewBox="0 0 200 80"><rect width="200" height="80" fill="rgba(245,158,11,.05)"/><polyline points="10,60 30,20 50,55 70,15 90,50 110,10 130,45 150,20 170,55 190,25" fill="none" stroke="rgba(245,158,11,.45)" stroke-width="2" stroke-linejoin="round"/></svg>';
  return '<svg viewBox="0 0 200 80"><rect width="200" height="80" fill="rgba(16,185,129,.05)"/><path d="M100 40A5 5 0 0 1 105 45A10 10 0 0 1 90 45A15 15 0 0 1 115 40A20 20 0 0 1 80 40A25 25 0 0 1 125 40" fill="none" stroke="rgba(16,185,129,.4)" stroke-width="1.5"/></svg>';
}

function svgMock(v){
  if(v==='good')return '<svg viewBox="0 0 180 280"><rect width="180" height="280" rx="16" fill="#0F1629"/><rect x="12" y="12" width="156" height="24" rx="6" fill="rgba(31,78,216,.15)"/><rect x="16" y="17" width="50" height="4" rx="2" fill="rgba(96,165,250,.6)"/><rect x="12" y="46" width="156" height="80" rx="10" fill="rgba(31,78,216,.1)" stroke="rgba(59,130,246,.2)"/><rect x="22" y="56" width="80" height="6" rx="3" fill="rgba(240,244,255,.5)"/><rect x="22" y="68" width="120" height="4" rx="2" fill="rgba(148,163,184,.3)"/><rect x="22" y="96" width="60" height="22" rx="6" fill="rgba(31,78,216,.8)"/><rect x="30" y="103" width="44" height="4" rx="2" fill="rgba(255,255,255,.7)"/></svg>';
  return '<svg viewBox="0 0 180 280"><rect width="180" height="280" rx="16" fill="#0F1629"/><rect x="12" y="46" width="156" height="80" rx="10" fill="rgba(239,68,68,.08)" stroke="rgba(239,68,68,.25)" stroke-dasharray="4 3"/><line x1="12" y1="46" x2="168" y2="126" stroke="rgba(239,68,68,.2)"/><text x="90" y="92" text-anchor="middle" font-size="10" fill="rgba(239,68,68,.5)" font-family="monospace">404</text><rect x="60" y="158" width="110" height="22" rx="6" fill="rgba(239,68,68,.15)" stroke="rgba(239,68,68,.3)"/></svg>';
}

/* ===== MAZE ===== */
const MC=12, MR=7;
let mazeGrid;

function genMaze(){
  mazeGrid=[];
  for(let y=0;y<MR;y++){mazeGrid[y]=[];for(let x=0;x<MC;x++)mazeGrid[y][x]={x,y,w:{t:1,r:1,b:1,l:1},v:0}}
  const s=[];mazeGrid[0][0].v=1;s.push(mazeGrid[0][0]);
  while(s.length){
    const c=s[s.length-1],n=[];const{x,y}=c;
    if(y>0&&!mazeGrid[y-1][x].v)n.push(mazeGrid[y-1][x]);
    if(x<MC-1&&!mazeGrid[y][x+1].v)n.push(mazeGrid[y][x+1]);
    if(y<MR-1&&!mazeGrid[y+1][x].v)n.push(mazeGrid[y+1][x]);
    if(x>0&&!mazeGrid[y][x-1].v)n.push(mazeGrid[y][x-1]);
    if(n.length){
      const nx=n[Math.floor(Math.random()*n.length)];
      if(nx.y<c.y){c.w.t=0;nx.w.b=0}else if(nx.x>c.x){c.w.r=0;nx.w.l=0}else if(nx.y>c.y){c.w.b=0;nx.w.t=0}else{c.w.l=0;nx.w.r=0}
      nx.v=1;s.push(nx);
    }else s.pop();
  }
  mazeGrid[0][0].w.l=0;mazeGrid[MR-1][MC-1].w.r=0;
}

function drawMazeGrid(ctx,w,h){
  const cw=w/MC,ch=h/MR;ctx.strokeStyle='rgba(59,130,246,.5)';ctx.lineWidth=2;ctx.lineCap='round';
  for(let y=0;y<MR;y++)for(let x=0;x<MC;x++){
    const c=mazeGrid[y][x],px=x*cw,py=y*ch;
    if(c.w.t){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+cw,py);ctx.stroke()}
    if(c.w.r){ctx.beginPath();ctx.moveTo(px+cw,py);ctx.lineTo(px+cw,py+ch);ctx.stroke()}
    if(c.w.b){ctx.beginPath();ctx.moveTo(px,py+ch);ctx.lineTo(px+cw,py+ch);ctx.stroke()}
    if(c.w.l){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+ch);ctx.stroke()}
  }
  ctx.font='bold 12px Syne';ctx.fillStyle='#10B981';ctx.fillText('ВХОД',4,ch/2+4);
  ctx.fillStyle='#F59E0B';ctx.fillText('ВЫХОД',w-52,h-ch/2+4);
}
