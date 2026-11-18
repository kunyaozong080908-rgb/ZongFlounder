/* ================= 应用层：状态 / 持久化 / 音效 / 视图渲染 ================= */
let totalStars = parseInt(localStorage.getItem('zf_total_stars')||'0',10);
if(isNaN(totalStars)) totalStars=0;
let muted = localStorage.getItem('zf_muted')==='1';
let progress = {};
try{ progress=JSON.parse(localStorage.getItem('zf_progress')||'{}'); }catch(e){ progress={}; }
let wrongBook=[];
try{ wrongBook=JSON.parse(localStorage.getItem('zf_wrong')||'[]'); }catch(e){ wrongBook=[]; }

const state={ subject:'',level:'',mode:'stage',stageIndex:0,questions:[],
  index:0,score:0,correctCount:0,streak:0,locked:false };

function saveStars(){ localStorage.setItem('zf_total_stars',String(totalStars)); }
function saveMuted(){ localStorage.setItem('zf_muted',muted?'1':'0'); }
function saveProgress(){ localStorage.setItem('zf_progress',JSON.stringify(progress)); }
function saveWrong(){ localStorage.setItem('zf_wrong',JSON.stringify(wrongBook)); }

/* 音效（Web Audio，首次点击后才启动） */
let audioCtx=null;
function ensureAudio(){
  if(!audioCtx){
    try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audioCtx=null; }
  }
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
}
function tone(freq,dur,type){
  if(muted) return;
  try{
    ensureAudio();
    if(!audioCtx) return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(0.001,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22,audioCtx.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime+dur);
  }catch(e){ /* 音频不可用时静默忽略，不影响游戏逻辑 */ }
}
function playRight(){ tone(660,0.12,'sine'); setTimeout(()=>tone(880,0.16,'sine'),90); }
function playWrong(){ tone(200,0.25,'triangle'); }
function playWin(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine'),i*120)); }

/* 视图切换 */
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}
function starSvg(filled){
  return "<svg viewBox='0 0 24 24'><path d='M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z' fill='"+(filled?'#ffc93c':'#d7deea')+"'/></svg>";
}
function subjDot(subKey){
  const s=SUBJECTS[subKey||state.subject];
  if(!s) return "<span class='subj-dot' style='background:#8aa0bd'></span>";
  return "<span class='subj-dot' style='background:"+s.color+"'>"+s.icon+"</span>";
}

/* 首页 */
function renderHome(){
  document.getElementById('totalStars').textContent=totalStars;
  document.getElementById('wrongCount').textContent=wrongBook.length;
  const grid=document.getElementById('subjectGrid');
  grid.innerHTML='';
  Object.keys(SUBJECTS).forEach(key=>{
    const s=SUBJECTS[key];
    const btn=document.createElement('button');
    btn.className='subject-card '+key;
    btn.innerHTML="<span class='ico'>"+s.icon+"</span><span><h3>"+s.name+"</h3><p>"+s.desc+"</p></span>";
    btn.onclick=()=>pickSubject(key);
    grid.appendChild(btn);
  });
  document.getElementById('soundOnIco').style.display=muted?'none':'block';
  document.getElementById('soundOffIco').style.display=muted?'block':'none';
}
function pickSubject(key){
  state.subject=key;
  const tag=document.getElementById('levelTag');
  tag.style.background=SUBJECTS[key].color;
  tag.innerHTML=SUBJECTS[key].icon;
  document.getElementById('levelTitle').textContent=SUBJECTS[key].name+' · 选年级';
  document.getElementById('levelDesc').textContent='题目参照人教版课本，难度循序渐进。';
  const grid=document.getElementById('levelGrid');
  grid.innerHTML='';
  LEVELS.forEach(lv=>{
    const btn=document.createElement('button');
    btn.className='level-card';
    btn.innerHTML="<span class='lv-badge' style='background:"+lv.color+"'>"+lv.badge+"</span>"+
      "<span class='lv-text'><h4>"+lv.name+"</h4><p>"+lv.sub+"</p></span>"+
      "<span class='arrow'><svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18l6-6-6-6'/></svg></span>";
    btn.onclick=()=>pickLevel(lv.id);
    grid.appendChild(btn);
  });
  showView('view-level');
}
function pickLevel(lvId){
  state.level=lvId;
  const lv=LEVELS.find(x=>x.id===lvId);
  const tag=document.getElementById('modeTag');
  tag.style.background=lv.color;
  tag.innerHTML="<span style='font-weight:900;font-size:18px'>"+lv.badge+"</span>";
  document.getElementById('modeTitle').textContent=SUBJECTS[state.subject].name+' · '+lv.name;
  document.getElementById('modeDesc').textContent='选一种方式开始练习。';
  const grid=document.getElementById('modeGrid');
  grid.innerHTML='';
  const modes=[
    {id:'stage',title:'分组闯关',desc:'10关、每关10题，按顺序通关，集齐星星。',
      ico:"<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'/><path d='M9 22V12h6v10'/></svg>", bg:'#3da9fc'},
    {id:'random',title:'随机练习',desc:'每次从题库随机抽10题，适合反复巩固。',
      ico:"<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M16 3h5v5'/><path d='M4 20L21 3'/><path d='M21 16v5h-5'/><path d='M15 15l6 6'/><path d='M4 4l5 5'/></svg>", bg:'#43c59e'}
  ];
  modes.forEach(m=>{
    const card=document.createElement('button');
    card.className='mode-card';
    card.innerHTML="<span class='m-ico' style='background:"+m.bg+"'>"+m.ico+"</span><h4>"+m.title+"</h4><p>"+m.desc+"</p>";
    card.onclick=()=>{ if(m.id==='stage'){openStages();}else{startRandom();} };
    grid.appendChild(card);
  });
  showView('view-mode');
}
function openStages(){
  const lv=LEVELS.find(x=>x.id===state.level);
  const key=state.subject+'_'+state.level;
  const stars=progress[key]||[];
  let html="<div class='level-head'>"+subjDot()+
    "<div><h2>"+SUBJECTS[state.subject].name+' · '+lv.name+" · 10关</h2>"+
    "<p>每关10题，完成后按正确率点亮星星。</p></div></div>";
  html+="<div class='stage-grid' id='stageGrid'>";
  for(let i=0;i<STAGE_COUNT;i++){
    const st=stars[i]||0;
    let starTxt='';
    for(let k=0;k<3;k++){ starTxt += k<st?'★':'☆'; }
    html+="<div class='stage-cell"+(st>0?' done':'')+"' data-stage='"+i+"'><div class='num'>"+(i+1)+"</div><div class='st'>"+starTxt+"</div></div>";
  }
  html+="</div><div class='back-row'><button class='btn-ghost' onclick='backToMode()'>← 返回模式</button></div>";
  document.getElementById('view-stages').innerHTML=html;
  document.querySelectorAll('#view-stages .stage-cell').forEach(cell=>{
    cell.onclick=()=>startStage(parseInt(cell.getAttribute('data-stage'),10));
  });
  showView('view-stages');
}
function backToMode(){ showView('view-mode'); }
function goHome(){ showView('view-home'); }
function backToLevel(){ showView('view-level'); }

document.getElementById('muteBtn').addEventListener('click',()=>{
  muted=!muted; saveMuted();
  document.getElementById('soundOnIco').style.display=muted?'none':'block';
  document.getElementById('soundOffIco').style.display=muted?'block':'none';
  if(!muted){ ensureAudio(); tone(660,0.1,'sine'); }
});

function init(){ renderHome(); showView('view-home'); }
document.addEventListener('DOMContentLoaded',init);
