/* ================= 游戏流程：闯关 / 随机 / 答题 / 结算 / 错题集 ================= */
function startStage(stage){
  state.mode='stage';
  state.stageIndex=stage;
  const pool=buildPool(state.subject,state.level);
  state.questions=pool.slice(stage*STAGE_LEN,stage*STAGE_LEN+STAGE_LEN);
  beginQuiz();
}
function startRandom(){
  state.mode='random';
  const pool=buildPool(state.subject,state.level);
  const R=makeRnd(Date.now()^(SUB_CODE[state.subject]*7+LVL_CODE[state.level]*13));
  state.questions=R.sample(pool,STAGE_LEN);
  beginQuiz();
}
function beginQuiz(){
  state.index=0; state.score=0; state.correctCount=0; state.streak=0; state.locked=false;
  renderQuestion();
  showView('view-quiz');
}
function renderQuestion(){
  const q=state.questions[state.index];
  const total=state.questions.length;
  document.getElementById('quizDot').innerHTML=subjDot();
  document.getElementById('quizMode').textContent=
    state.mode==='stage'?('第'+(state.stageIndex+1)+'关'):
    (state.mode==='random'?'随机练习':'错题复习');
  document.getElementById('quizProgress').textContent=(state.index+1)+' / '+total;
  document.getElementById('quizFill').style.width=((state.index)/total*100)+'%';
  document.getElementById('quizScore').textContent=state.score+' 分';
  document.getElementById('questionText').textContent=q.q;
  const box=document.getElementById('optionsBox');
  box.innerHTML='';
  const keys=['A','B','C','D'];
  q.opts.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='opt';
    btn.innerHTML="<span class='key'>"+keys[i]+"</span><span>"+opt+"</span>";
    btn.onclick=()=>choose(i,btn);
    box.appendChild(btn);
  });
  const fb=document.getElementById('feedback');
  fb.className='feedback'; fb.innerHTML='';
  const nextBtn=document.getElementById('nextBtn');
  nextBtn.style.display='none';
  state.locked=false;
}
function addToWrongBook(q,picked){
  if(wrongBook.some(x=>x.q===q.q)) return;
  wrongBook.push({q:q.q,opts:q.opts,a:q.a,tip:q.tip,picked:picked,
    sub:state.subject,lv:state.level});
  saveWrong();
}
function choose(i,btn){
  if(state.locked) return;
  state.locked=true;
  const q=state.questions[state.index];
  const btns=document.querySelectorAll('#optionsBox .opt');
  const isRight=(i===q.a);
  btns.forEach((b,bi)=>{
    b.disabled=true;
    if(bi===q.a) b.classList.add('correct');
    if(bi===i && !isRight) b.classList.add('wrong');
    if(bi!==q.a && bi!==i) b.classList.add('dim');
  });
  const fb=document.getElementById('feedback');
  if(isRight){
    state.correctCount++; state.streak++;
    let gain=10;
    if(state.streak>=3) gain+=5;
    state.score+=gain;
    playRight();
    if(state.mode==='wrong') removeFromWrong(q.q);
    fb.className='feedback good show';
    fb.innerHTML="<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#1f9d6b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6L9 17l-5-5'/></svg><div>"+
      makeRnd(Date.now()).pick(PRAISE_GOOD)+' +'+gain+'分</div>';
    if(state.streak>=3) confetti();
  }else{
    state.streak=0;
    playWrong();
    addToWrongBook(q,i);
    fb.className='feedback bad show';
    fb.innerHTML="<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#d9534f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M18 6L6 18M6 6l12 12'/></svg><div>"+
      makeRnd(Date.now()).pick(PRAISE_BAD)+
      "<div class='tip-line'>正确答案："+q.opts[q.a]+'。'+q.tip+'</div></div>';
  }
  const nextBtn=document.getElementById('nextBtn');
  nextBtn.textContent=state.index<state.questions.length-1?'下一题':'查看结果';
  nextBtn.style.display='inline-flex';
}
function nextQuestion(){
  if(state.index<state.questions.length-1){
    state.index++; renderQuestion();
  }else{
    finish();
  }
}
function finish(){
  const total=state.questions.length;
  const rate=state.correctCount/total;
  let stars=1;
  if(rate>=0.9) stars=3; else if(rate>=0.6) stars=2;
  if(state.mode==='stage'){
    const key=state.subject+'_'+state.level;
    if(!progress[key]) progress[key]=[];
    const old=progress[key][state.stageIndex]||0;
    if(stars>old){
      progress[key][state.stageIndex]=stars;
      totalStars+=(stars-old); saveStars(); saveProgress();
    }
  }
  if(rate>=0.9) playWin();
  let starHtml='';
  for(let k=0;k<3;k++){
    starHtml+="<span class='"+(k<stars?'':'off')+"'>"+starSvg(k<stars)+"</span>";
  }
  document.getElementById('resultStars').innerHTML=starHtml;
  document.getElementById('resultTitle').textContent=
    rate>=0.9?'太厉害啦！':(rate>=0.6?'完成得不错！':'继续加油哦！');
  document.getElementById('statCorrect').textContent=state.correctCount+' / '+total;
  document.getElementById('statRate').textContent=Math.round(rate*100)+'%';
  document.getElementById('statScore').textContent=state.score;
  const actions=document.getElementById('resultActions');
  let html='';
  if(state.mode==='stage'){
    html+="<button class='btn-ghost' onclick='goHome()'>回首页</button>";
    if(state.stageIndex<STAGE_COUNT-1)
      html+="<button class='btn-primary' onclick='startStage("+(state.stageIndex+1)+")'>下一关</button>";
    else
      html+="<button class='btn-primary' onclick='openStages()'>查看关卡</button>";
  }else if(state.mode==='random'){
    html+="<button class='btn-ghost' onclick='goHome()'>回首页</button>";
    html+="<button class='btn-primary' onclick='startRandom()'>再随机一组</button>";
  }else{
    html+="<button class='btn-ghost' onclick='openWrongBook()'>返回错题集</button>";
    html+="<button class='btn-primary' onclick='startWrongReview()'>再做一遍</button>";
  }
  actions.innerHTML=html;
  showView('view-result');
}

/* 错题集 */
function openWrongBook(){
  const wrap=document.getElementById('wrongList');
  if(wrongBook.length===0){
    wrap.innerHTML="<div class='empty-state'>还没有错题，去答题闯关吧！</div>";
  }else{
    let html='';
    wrongBook.forEach((w,i)=>{
      const pickedText=(w.picked!=null && w.opts[w.picked])?w.opts[w.picked]:'（未作答）';
      html+="<div class='wr-item'><b>"+(i+1)+". "+w.q+"</b><br>"+
        "你的选择：<span class='pick'>"+pickedText+"</span><br>"+
        "正确答案：<span class='ans'>"+w.opts[w.a]+"</span><br>"+
        "<span style='color:var(--soft)'>讲解："+w.tip+"</span></div>";
    });
    wrap.innerHTML=html;
  }
  showView('view-wrong');
}
function startWrongReview(){
  if(wrongBook.length===0){ openWrongBook(); return; }
  state.mode='wrong';
  state.questions=wrongBook.map(w=>({q:w.q,opts:w.opts,a:w.a,tip:w.tip}));
  beginQuiz();
}
function removeFromWrong(qText){
  const idx=wrongBook.findIndex(x=>x.q===qText);
  if(idx>=0){ wrongBook.splice(idx,1); saveWrong(); }
}
function clearWrongBook(){
  if(wrongBook.length===0) return;
  wrongBook=[]; saveWrong();
  openWrongBook();
}

/* 答对撒花 */
function confetti(){
  const colors=['#ff8a5c','#3da9fc','#43c59e','#ffc93c','#ef6f6c'];
  for(let i=0;i<24;i++){
    const el=document.createElement('div');
    el.className='confetti';
    el.style.background=colors[i%colors.length];
    el.style.left='50%'; el.style.top='50%';
    document.body.appendChild(el);
    const angle=Math.random()*Math.PI*2;
    const dist=80+Math.random()*180;
    const dx=Math.cos(angle)*dist;
    const dy=Math.sin(angle)*dist-60;
    el.animate([
      {transform:'translate(0,0) rotate(0)',opacity:1},
      {transform:'translate('+dx+'px,'+(dy+160)+'px) rotate('+(Math.random()*720)+'deg)',opacity:0}
    ],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>el.remove();
  }
}
