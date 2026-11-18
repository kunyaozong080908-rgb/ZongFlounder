/* ================= 引擎：常量 / 随机 / 题目工具 / 池子构建 ================= */
const STAGE_COUNT = 10;
const STAGE_LEN = 10;
const SUBJECTS = {
  chinese:{name:'语文', color:'#ff7a4d',
    icon:"<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19.5A2.5 2.5 0 016.5 17H20'/><path d='M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z'/></svg>",
    desc:'拼音 · 字词 · 古诗 · 成语'},
  math:{name:'数学', color:'#2f93ea',
    icon:"<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 21h18'/><path d='M5 21V7l7-4 7 4v14'/><path d='M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01'/></svg>",
    desc:'口算 · 比大小 · 图形 · 规律'},
  english:{name:'英语', color:'#2fae83',
    icon:"<svg width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='M2 12h20'/><path d='M12 2a15 15 0 010 20 15 15 0 010-20z'/></svg>",
    desc:'字母 · 单词 · 句型 · 对话'}
};
const LEVELS = [
  {id:'easy', name:'低年级', sub:'小学一、二年级', badge:'1-2', color:'#43c59e'},
  {id:'mid',  name:'中年级', sub:'小学三、四年级', badge:'3-4', color:'#3da9fc'},
  {id:'hard', name:'高年级', sub:'小学五、六年级', badge:'5-6', color:'#ff8a5c'}
];
const SUB_CODE={chinese:11, math:23, english:37};
const LVL_CODE={easy:3, mid:7, hard:13};
const PRAISE_GOOD=['太棒了！','答对啦，真厉害！','好聪明，继续加油！','完全正确！','你真是小学霸！'];
const PRAISE_BAD=['别灰心，再想想！','差一点点，记住它！','没关系，下次一定对！'];

/* 种子随机：同一 seed 得到确定序列 */
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRnd(seed){
  const r = mulberry32(seed);
  return {
    int:(min,max)=> Math.floor(r()*(max-min+1))+min,
    pick:arr=>arr[Math.floor(r()*arr.length)],
    shuffle:arr=>{
      const a=arr.slice();
      for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]];}
      return a;
    },
    sample:(arr,n)=>{
      const a=[]; arr.forEach(x=>a.push(x));
      const out=[];
      for(let i=0;i<n && a.length;i++){ const j=Math.floor(r()*a.length); out.push(a.splice(j,1)[0]); }
      return out;
    }
  };
}

/* 题目工具：正确答案 + 干扰项构造四选一，洗牌并回算正确索引 */
function buildChoice(R, q, answer, distractors, tip){
  const set=[];
  for(let i=0;i<distractors.length;i++){
    const d=distractors[i];
    if(d!==answer && set.indexOf(d)===-1) set.push(d);
  }
  const opts=R.shuffle([answer].concat(set.slice(0,3)));
  return {q, opts, a:opts.indexOf(answer), tip};
}
/* 语料批量转四选一：干扰项取其他条目的不同答案 */
function corpusPool(R, items){
  const uniqA=[];
  items.forEach(x=>{ if(uniqA.indexOf(x.a)===-1) uniqA.push(x.a); });
  return items.map(it=>buildChoice(R,it.q,it.a,R.sample(uniqA.filter(x=>x!==it.a),3),it.tip));
}

/* 语文池：把语料组装成题目 */
function chineseEasyPool(R){
  const pinyin=PINYIN_EASY.map(x=>({q:'“'+x[0]+'”的正确读音是？',a:x[1],tip:'读准声母、韵母，注意声调。'}));
  const liang=LIANG_EASY.map(x=>({q:'一（ ）'+x[0],a:x[1],tip:'不同的事物要搭配合适的量词。'}));
  const fanyi=FANYI_EASY.map(x=>({q:'“'+x[0]+'”的反义词是？',a:x[1],tip:'意思相反的词叫反义词。'}));
  const poet=POET_EASY.map(x=>({q:x[0]+'的作者是谁？',a:x[1],tip:'记住古诗的作者。'}));
  return corpusPool(R,pinyin).concat(corpusPool(R,liang),corpusPool(R,fanyi),corpusPool(R,poet));
}
function chineseMidPool(R){
  const dy=DUOYIN_MID.map(x=>({q:'“'+x[0]+'”中“'+x[1]+'”的读音是？',a:x[2],tip:'多音字要根据词语意思确定读音。'}));
  const jy=JINYI_MID.map(x=>({q:'“'+x[0]+'”的近义词是？',a:x[1],tip:'意思相近的词叫近义词。'}));
  const poet=POET_MID.map(x=>({q:x[0]+'的作者是谁？',a:x[1],tip:'结合朝代和作品记住作者。'}));
  const idiom=IDIOM_MID.map(x=>({q:x[0],a:x[1],tip:'读懂意思，选出对应的成语。'}));
  return corpusPool(R,dy).concat(corpusPool(R,jy),corpusPool(R,poet),corpusPool(R,idiom));
}
function chineseHardPool(R){
  const poet=POET_HARD.map(x=>({q:x[0]+'的作者是谁？',a:x[1],tip:'结合作品和朝代记住作者。'}));
  const verse=VERSE_HARD.map(x=>({q:'“'+x[0]+'”的下一句是？',a:x[1],tip:'在理解的基础上背诵古诗。'}));
  const person=KNOW_PERSON_HARD.map(x=>({q:x[0],a:x[1],tip:'多读多记，积累文学常识。'}));
  const culture=KNOW_CULTURE_HARD.map(x=>({q:x[0],a:x[1],tip:'了解传统文化中的有趣说法。'}));
  const idiom=IDIOM_HARD.map(x=>({q:x[0],a:x[1],tip:'读懂意思，选出对应的成语。'}));
  return corpusPool(R,poet).concat(corpusPool(R,verse),corpusPool(R,person),
    corpusPool(R,culture),corpusPool(R,idiom));
}

const POOL_BUILDERS = {
  chinese:{ easy:chineseEasyPool, mid:chineseMidPool, hard:chineseHardPool },
  math:{ easy:mathEasyPool, mid:mathMidPool, hard:mathHardPool },
  english:{ easy:englishEasyPool, mid:englishMidPool, hard:englishHardPool }
};
/* 固定 base seed，保证同分组池稳定、关卡切片互不重复 */
function buildPool(sub,lv){
  const baseSeed = SUB_CODE[sub]*1000 + LVL_CODE[lv]*37 + 5;
  const R=makeRnd(baseSeed);
  return POOL_BUILDERS[sub][lv](R);
}
/* 程序化生成时按题干去重 */
function uniquePush(bag, item){
  if(bag.some(x=>x.q===item.q)) return false;
  bag.push(item); return true;
}

/* 英语池：把语料组装成题目 */
function englishEasyPool(R){
  const letters=LETTER_EASY.map(x=>({q:'大写字母“'+x[0]+'”对应的小写字母是？',a:x[1],tip:'记牢大小写字母。'}));
  const words=WORD_EASY.map(x=>({q:'“'+x[0]+'”的中文意思是？',a:x[1],tip:'把单词和图片、意思一起记。'}));
  const talk=TALK_EASY.map(x=>({q:x[0],a:x[1],tip:'在真实情境里学会说英语。'}));
  return corpusPool(R,letters).concat(corpusPool(R,words),corpusPool(R,talk));
}
function englishMidPool(R){
  const words=WORD_MID.map(x=>({q:'“'+x[0]+'”的中文意思是？',a:x[1],tip:'结合句子记单词。'}));
  const talk=TALK_MID.map(x=>({q:x[0],a:x[1],tip:'用学过的句型来回答。'}));
  return corpusPool(R,words).concat(corpusPool(R,talk));
}
function englishHardPool(R){
  const words=WORD_HARD.map(x=>({q:'“'+x[0]+'”的中文意思是？',a:x[1],tip:'用词造句，记得更牢。'}));
  const grammar=GRAMMAR_HARD.map(x=>({q:x[0],a:x[1],tip:'掌握语法规则。'}));
  return corpusPool(R,words).concat(corpusPool(R,grammar));
}
