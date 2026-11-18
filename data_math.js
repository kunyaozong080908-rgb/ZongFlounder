/* 数学生成器（人教版小学数学，程序化确定性生成） */
function factorsOf(n){ const out=[]; for(let i=1;i<=n;i++){ if(n%i===0) out.push(i); } return out; }

function mathEasyPool(R){
  const bag=[]; let guard=0;
  while(bag.length<110 && guard<3000){
    guard++;
    const t=R.int(1,6); let item=null;
    if(t===1){
      const a=R.int(2,11), b=R.int(1,20-a), ans=a+b;
      item=buildChoice(R,a+' + '+b+' = ？',String(ans),[ans+1,ans-1,ans+2,ans-2].map(String),'加法：把两个数合起来。');
    }else if(t===2){
      const a=R.int(5,20), b=R.int(1,a-1), ans=a-b;
      item=buildChoice(R,a+' - '+b+' = ？',String(ans),[ans+1,ans-1,ans+2,ans+3].map(String),'减法：从总数里去掉一部分。');
    }else if(t===3){
      const a=R.int(3,19), b=R.int(3,19);
      if(a===b) continue;
      item=buildChoice(R,a+' （ ） '+b+'，括号里填什么？',a>b?'>':'<',['>','<','=','≠'],'大口对着大数，尖角对着小数。');
    }else if(t===4){
      const shapes=[{n:'三角形',d:'有3条直直的边、3个角'},{n:'正方形',d:'4条边一样长、4个直角'},
        {n:'长方形',d:'对边一样长、4个直角'},{n:'圆',d:'边是弯弯的、没有角'}];
      const cur=R.pick(shapes);
      item=buildChoice(R,'哪个图形“'+cur.d+'”？',cur.n,shapes.map(s=>s.n).filter(x=>x!==cur.n),'根据边和角的特点认图形。');
    }else if(t===5){
      const h=R.int(1,12), next=h===12?1:h+1, prev=h===1?12:h-1;
      item=buildChoice(R,'分针指向12，时针指向'+h+'，现在是几时？',h+'时',[next+'时',prev+'时',h+'时半'],'分针指12、时针指几就是几时。');
    }else{
      const a=R.int(1,9);
      item=buildChoice(R,a+'元 = （ ）角',String(a*10),[String(a),String(a*100),String(a+10)],'1元=10角。');
    }
    if(item) uniquePush(bag,item);
  }
  return bag;
}

function mathMidPool(R){
  const bag=[]; let guard=0;
  while(bag.length<110 && guard<3000){
    guard++;
    const t=R.int(1,7); let item=null;
    if(t===1){
      const a=R.int(2,9), b=R.int(2,9), ans=a*b;
      item=buildChoice(R,a+' × '+b+' = ？',String(ans),[ans+a,ans-b,ans+b,ans+a+b].map(String),'乘法口诀要背熟。');
    }else if(t===2){
      const b=R.int(2,9), q=R.int(2,9), a=b*q;
      item=buildChoice(R,a+' ÷ '+b+' = ？',String(q),[q+1,q-1,q+2,q+3].map(String),'想口诀：几乘除数等于被除数。');
    }else if(t===3){
      const a=R.int(20,70), b=R.int(10,99-a), ans=a+b;
      item=buildChoice(R,a+' + '+b+' = ？',String(ans),[ans+1,ans-1,ans+10,ans-10].map(String),'相同数位对齐，满十进一。');
    }else if(t===4){
      const w=R.int(3,9), h=R.int(2,8), ans=2*(w+h);
      item=buildChoice(R,'长方形长'+h+'、宽'+w+'，周长是多少？',String(ans),[String(ans+2),String(ans-2),String(ans+4),String(ans-4)],'长方形周长=(长+宽)×2。');
    }else if(t===5){
      const s=R.int(3,12), ans=4*s;
      item=buildChoice(R,'正方形边长'+s+'，周长是多少？',String(ans),[String(ans+4),String(ans-4),String(ans+8),String(ans-8)],'正方形周长=边长×4。');
    }else if(t===6){
      const n=R.int(2,9);
      item=buildChoice(R,n+'米 = （ ）厘米',String(n*100),[String(n),String(n*10),String(n+100)],'1米=100厘米。');
    }else{
      const d=R.int(2,9);
      item=buildChoice(R,'把蛋糕平均分成'+d+'份，每份是它的几分之几？','1/'+d,['1/'+(d+1),'1/'+(d+2),(d+1)+'/'+d],'平均分，分母是总份数，分子是取的份数。');
    }
    if(item) uniquePush(bag,item);
  }
  return bag;
}

function mathHardPool(R){
  const bag=[]; let guard=0;
  const r2=x=>Math.round(x*100)/100;
  while(bag.length<110 && guard<3000){
    guard++;
    const t=R.int(1,8); let item=null;
    if(t===1){
      const a=R.int(11,89)/10, b=R.int(11,Math.max(12,99-a*10))/10, ans=Math.round((a+b)*10)/10;
      item=buildChoice(R,a+' + '+b+' = ？',String(ans),[ans+.1,ans-.1,ans+.2,ans+1].map(x=>String(Math.round(x*10)/10)),'小数点对齐再相加。');
    }else if(t===2){
      const a=R.int(2,9)/10, b=R.int(2,9), ans=r2(a*b);
      item=buildChoice(R,a+' × '+b+' = ？',String(ans),[ans+.1,ans+.01,ans*10,ans+1].map(x=>String(r2(x))),'先按整数乘，再点小数点。');
    }else if(t===3){
      const base=R.int(4,12), h=R.int(3,10), ans=base*h/2;
      item=buildChoice(R,'三角形底'+base+'、高'+h+'，面积是多少？',String(ans),[String(base*h),String(base+h),String(base*h*2),String(ans+base)],'三角形面积=底×高÷2。');
    }else if(t===4){
      const base=R.int(4,12), h=R.int(3,10), ans=base*h;
      item=buildChoice(R,'平行四边形底'+base+'、高'+h+'，面积是多少？',String(ans),[String(ans+2),String(ans-2),String(ans+4),String(ans-4)],'平行四边形面积=底×高。');
    }else if(t===5){
      const w=R.int(2,8), h=R.int(2,8), l=R.int(2,8), ans=w*h*l;
      item=buildChoice(R,'长方体长'+l+'、宽'+w+'、高'+h+'，体积是多少？',String(ans),[String(ans+4),String(ans-4),String(ans+8),String(ans-8)],'长方体体积=长×宽×高。');
    }else if(t===6){
      const n=R.pick([6,8,12,18,24,30,36]);
      item=buildChoice(R,'下面哪个数是'+n+'的因数？',String(R.pick(factorsOf(n))),[String(n+1),String(n+2),String(n*2)],'能整除这个数的数就是它的因数。');
    }else if(t===7){
      const b=R.int(3,20), x=R.int(2,15), ans=b+x;
      item=buildChoice(R,'解方程：x + '+b+' = '+ans+'，x = ？',String(x),[String(x+1),String(x-1),String(x+2),String(ans)],'等式两边同时减去 '+b+'。');
    }else{
      const primes=[2,3,5,7,11,13,17,19,23];
      const cur=R.pick([2,4,9,11,15,17,21,23]), isP=primes.includes(cur);
      const sayPrime=cur+'是质数', sayComp=cur+'是合数', sayNeither=cur+'既不是质数也不是合数';
      if(isP) item=buildChoice(R,'关于 '+cur+'，哪个说法正确？',sayPrime,[sayComp,sayNeither,cur+'是偶数']);
      else item=buildChoice(R,'关于 '+cur+'，哪个说法正确？',sayComp,[sayPrime,sayNeither,cur+'是偶数']);
      if(item) item.tip='只有1和它本身两个因数的数叫质数。';
    }
    if(item) uniquePush(bag,item);
  }
  return bag;
}
