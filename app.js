(function(){
'use strict';
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const T=(h,m=0)=>h*60+m, p2=n=>String(n).padStart(2,'0');
const d24=t=>{t=((t%1440)+1440)%1440;return p2(Math.floor(t/60))+':'+p2(t%60)};
const d12=t=>{t=((t%1440)+1440)%1440;const h=Math.floor(t/60),m=t%60;return ((h%12)||12)+':'+p2(m)+' '+(h<12?'a.m.':'p.m.')};
const ap=t=>((t%1440)<720?'a.m.':'p.m.');
const hm=n=>{const h=Math.floor(n/60),m=n%60,o=[];if(h)o.push(h+(h===1?' hour':' hours'));if(m||!h)o.push(m+(m===1?' minute':' minutes'));return o.join(' ')};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const NS='http://www.w3.org/2000/svg';

/* ---------- answer parsing ---------- */
function parseTime(v){ // returns {t, padded}
  v=String(v).trim().replace(/[.\s]/g,':').replace(/:+/g,':');
  if(/^\d{4}$/.test(v))v=v.slice(0,2)+':'+v.slice(2);
  const m=/^(\d{1,2}):(\d{2})$/.exec(v);if(!m)return null;
  return {t:T(+m[1],+m[2]),padded:m[1].length===2};
}
const num=v=>{v=String(v).trim().replace(/[,\s\u00A0]/g,'').replace(/[\u2212\u2013]/g,'-');return /^-?\d+(\.\d+)?$/.test(v)?Number(v):NaN};

/* ---------- question building blocks ---------- */
function inputs(box,spec){ // spec: [{id,label,suffix,w}]
  const row=document.createElement('div');row.className='row';const refs={};
  spec.forEach(s=>{
    if(s.label){const l=document.createElement('label');l.textContent=s.label;row.appendChild(l)}
    const i=document.createElement('input');i.type='text';i.inputMode=s.mode||'text';i.autocomplete='off';i.setAttribute('aria-label',s.aria||s.label||'answer');
    if(s.w)i.style.width=s.w;refs[s.id]=i;row.appendChild(i);
    if(s.suffix){const x=document.createElement('span');x.textContent=s.suffix;row.appendChild(x)}
  });
  box.appendChild(row);return refs;
}
function choices(box,opts,answer){
  const wrap=document.createElement('div');wrap.className='opts';let sel=null;const btns=[];
  opts.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='opt';b.textContent=o;
    b.onclick=()=>{if(b.disabled)return;btns.forEach(x=>x.classList.remove('sel'));b.classList.add('sel');sel=o};
    wrap.appendChild(b);btns.push(b)});
  box.appendChild(wrap);
  return {btns,get:()=>sel,lock:()=>btns.forEach(b=>{b.disabled=true;if(b.textContent===answer)b.classList.add('right')}),reveal:()=>btns.forEach(b=>{if(b.textContent===answer)b.classList.add('right')})};
}

/* ---------- shared helpers (units 1 and 3) ---------- */
const sample=(a,n)=>shuffle(a).slice(0,n);
const fmt=n=>{const neg=n<0,s=String(Math.abs(n));const t=Math.abs(n)>=10000?s.replace(/\B(?=(\d{3})+(?!\d))/g,' '):s;return (neg?'−':'')+t};
const plain=n=>String(n);
const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function words(n){if(n<20)return ONES[n];if(n<100)return TENS[Math.floor(n/10)]+(n%10?'-'+ONES[n%10]:'');
  if(n<1000)return ONES[Math.floor(n/100)]+' hundred'+(n%100?' and '+words(n%100):'');
  const th=Math.floor(n/1000),r=n%1000;return words(th)+' thousand'+(r?(r<100?' and '+words(r):', '+words(r)):'')}
const r10=n=>Math.floor((n+5)/10)*10, r100=n=>Math.floor((n+50)/100)*100, r1000=n=>Math.floor((n+500)/1000)*1000;
const same=(a,b)=>String(a)===String(b);
function ask(prompt,spec,ans,hint,o){o=o||{};
  return{prompt,
    render(b){if(o.pre)b.insertAdjacentHTML('beforeend',typeof o.pre==='function'?o.pre():o.pre);this.r=inputs(b,spec)},
    check(){const bad=[];for(const s of spec){const v=this.r[s.id].value.trim();if(!v)return{ok:false,hint:'Fill in every box first.'};
        const want=ans[s.id];const okk=typeof want==='number'?num(v)===want:v.toLowerCase().replace(/\s+/g,' ')===String(want).toLowerCase();if(!okk)bad.push(s)}
      return bad.length?{ok:false,hint:typeof hint==='function'?hint(bad.map(s=>s.id)):hint}:{ok:true}},
    answer:o.answer||spec.map(s=>(s.label?s.label+' ':'')+(typeof ans[s.id]==='number'?fmt(ans[s.id]):ans[s.id])+(s.suffix?' '+s.suffix:'')).join(' · '),
    auto(){spec.forEach(s=>{this.r[s.id].value=String(ans[s.id])})}}}
function mc(prompt,pre,opts,correct,hint,answer){
  return{prompt,render(b){if(pre)b.insertAdjacentHTML('beforeend',typeof pre==='function'?pre():pre);this.c=choices(b,opts,correct)},
    check(){const g=this.c.get();if(g===null)return{ok:false,hint:'Tap an answer first.'};return g===correct?{ok:true}:{ok:false,hint}},
    answer:answer||correct,auto(){this.c.btns.find(x=>x.textContent===correct).click()}}}
function nlSVG(lo,hi,marks,o){o=o||{};const W=360,H=74,L=18,pw=W-2*L,n=hi-lo;const X=v=>L+pw*(v-lo)/n;const lab=o.every||1;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="number line"><line x1="'+(L-8)+'" y1="46" x2="'+(W-L+8)+'" y2="46" stroke="var(--ink)" stroke-width="2.5"/>';
  for(let v=lo;v<=hi;v++){const x=X(v),big=(v%lab===0);s+='<line x1="'+x+'" y1="'+(big?39:42)+'" x2="'+x+'" y2="52" stroke="var(--ink)" stroke-width="'+(v===0?3:1.5)+'"/>';
    if(big)s+='<text x="'+x+'" y="68" font-size="'+(o.fs||10)+'" font-weight="800" text-anchor="middle" fill="var(--ink)">'+(v<0?'−'+(-v):v)+'</text>'}
  (marks||[]).forEach(m=>{const x=X(m.v);s+='<circle cx="'+x+'" cy="46" r="5" fill="#C8452F" stroke="var(--ink)" stroke-width="1.5"/><text x="'+x+'" y="26" font-size="15" font-weight="900" text-anchor="middle" fill="#C8452F">'+m.l+'</text>'});
  return s+'</svg>'}
function colHTML(a,b,op){const A=fmt(a).replace(' ',' '),B=fmt(b).replace(' ',' ');const w=Math.max(A.length,B.length)+1;
  const pad=s=>' '.repeat(w-s.length)+s;return '<pre class="colsum">'+pad(A)+'\n'+op+pad(B).slice(1)+'\n'+'─'.repeat(w)+'</pre>'}
const lead=(a,b)=>a<b?'<':a>b?'>':'=';
/* ---------- shared game helpers ---------- */
function optQ(play,api,html,ans,wrongs){const h=document.createElement('div');h.className='big';h.innerHTML=html;const A=String(ans);
  let w=[...new Set(wrongs.map(String))].filter(x=>x!==A);const base=parseFloat(A.replace(/\u00A0/g,'').replace(/\u2212/g,'-'));
  for(let k=1;w.length<2&&!isNaN(base);k++){[base+k,base-k].forEach(c=>{const t=Math.abs(c)>=10000||c<0?fmt(c):String(c);if(t!==A&&!w.includes(t)&&w.length<2)w.push(t)})}
  w=w.slice(0,2);
  const o=document.createElement('div');o.className='opts';shuffle([A,...w]).forEach(v=>{const b=mkbtn(v,()=>{if(v===A)api.right();else api.wrong(b)},'opt');o.append(b)});play.append(h,o)}
function near(ans,cands){const s=new Set();cands.forEach(x=>{if(x!==ans&&x!==undefined)s.add(x)});return shuffle([...s]).slice(0,2)}
function memGame(body,rkey,lskey,makePairs,np){
  const info=document.createElement('div');info.className='big';info.textContent='Best: '+(R[rkey]?R[rkey]+' moves':'–');
  const grid=document.createElement('div');grid.className='mem';let moves=0,open=[],lock=false,found=0;
  const startB=mkbtn('Start',deal);
  function deal(){startB.hidden=true;moves=0;open=[];found=0;lock=false;grid.innerHTML='';info.textContent='Moves: 0';
    const pr=makePairs(np);const cards=shuffle(pr.flatMap((p,i)=>[{i,k:0,h:p[0]},{i,k:1,h:p[1]}]));
    cards.forEach(c=>{const el=document.createElement('button');el.type='button';el.className='card';el.innerHTML='<span class="qm">?</span>';el.setAttribute('aria-label','Hidden card');
      el.onclick=()=>{if(lock||el.classList.contains('up')||el.classList.contains('gone'))return;
        el.classList.add('up');el.innerHTML='<b style="font-size:13px;line-height:1.15">'+c.h+'</b>';open.push({el,c});
        if(open.length===2){moves++;info.textContent='Moves: '+moves;lock=true;const[a,b]=open;
          if(a.c.i===b.c.i&&a.c.k!==b.c.k){setTimeout(()=>{[a,b].forEach(x=>{x.el.classList.remove('up');x.el.classList.add('gone')});open=[];lock=false;found++;
            if(found===np){if(!R[rkey]||moves<R[rkey]){R[rkey]=moves;ls(lskey,moves)}info.textContent='You did it in '+moves+' moves! Best: '+R[rkey];confetti();queueSave();startB.hidden=false;startB.textContent='Play again'}},500)}
          else setTimeout(()=>{[a,b].forEach(x=>{x.el.classList.remove('up');x.el.innerHTML='<span class="qm">?</span>'});open=[];lock=false},900)}};
      grid.append(el)})}
  body.append(info,grid,startB)}
/* ---------- fractions helpers (unit 6) ---------- */
const fr=(n,d)=>'<span class="fr"><i>'+n+'</i><i>'+d+'</i></span>';
const ft=(n,d)=>n+'/'+d;
const DENS=[2,3,4,5,6,8,10,12];
const FNAME={2:'half',3:'third',4:'quarter',5:'fifth',6:'sixth',8:'eighth',10:'tenth',12:'twelfth'};
const FPL={2:'halves',3:'thirds',4:'quarters',5:'fifths',6:'sixths',8:'eighths',10:'tenths',12:'twelfths'};
function barFrac(d,k,cuts){const W=340,H=46,x0=4;const cs=cuts||Array.from({length:d-1},(_,i)=>(i+1)/d);const pts=[0,...cs,1];
  let s='<svg class="chart" viewBox="0 0 '+(W+8)+' '+(H+8)+'" role="img" aria-label="fraction bar">';
  for(let i=0;i<d;i++){const a=x0+W*pts[i],b=x0+W*pts[i+1];s+='<rect x="'+a+'" y="4" width="'+(b-a)+'" height="'+H+'" fill="'+(i<k?'#E0A21B':'#fff')+'" stroke="var(--ink)" stroke-width="2.5"/>'}
  return s+'</svg>'}
function amountBar(total,d){const W=340,H=40;let s='<svg class="chart" viewBox="0 0 '+(W+8)+' '+(H+34)+'" role="img" aria-label="bar model"><text x="'+(4+W/2)+'" y="16" font-size="15" font-weight="900" text-anchor="middle" fill="var(--ink)">'+total+'</text><line x1="4" y1="23" x2="'+(4+W)+'" y2="23" stroke="var(--ink)" stroke-width="2"/>';
  for(let i=0;i<d;i++){const a=4+W*i/d,w=W/d;s+='<rect x="'+a+'" y="30" width="'+w+'" height="'+H+'" fill="#fff" stroke="var(--ink)" stroke-width="2.5"/><text x="'+(a+w/2)+'" y="'+(30+H/2+6)+'" font-size="16" font-weight="900" text-anchor="middle" fill="var(--muted)">?</text>'}
  return s+'</svg>'}
function shadeBar(box,d,k){const st=[];const wrap=document.createElement('div');wrap.className='shade';let locked=false;
  for(let i=0;i<d;i++){const c=document.createElement('button');c.type='button';c.className='cell';c.setAttribute('aria-label','part '+(i+1));c.onclick=()=>{if(locked)return;c.classList.toggle('on')};wrap.append(c);st.push(c)}
  const h=document.createElement('div');h.className='hint';h.textContent='Tap the parts to shade them.';box.append(wrap,h);
  return{count:()=>st.filter(c=>c.classList.contains('on')).length,auto:()=>st.forEach((c,i)=>c.classList.toggle('on',i<k)),lock:()=>{locked=true;st.forEach(c=>c.disabled=true)}}}

/* ---------- Unit 6 questions ---------- */
const SECTIONS=[
 {id:'prt',title:'Parts and Wholes',sub:'Equal parts, numerators, denominators and unit fractions.'},
 {id:'shr',title:'Equal Shares',sub:'Sharing and dividing to make fractions.'},
 {id:'amt',title:'Fractions of Amounts',sub:'Use a bar model to find a fraction of a number.'},
 {id:'eqv',title:'Equivalent Fractions',sub:'Fractions that have the same value. Use the fraction wall idea.'}
];
const QS=[];const add=(sec,gen,tag)=>QS.push({sec,gen,tag});
const ND=[{id:'n',label:'Numerator',w:'4em'},{id:'d',label:'Denominator',w:'4em'}];
const rk=d=>rnd(1,d-1);
/* A. parts and wholes */
add('prt',()=>{const d=pick(DENS),k=rk(d);
  return ask('What fraction of the bar is <b>shaded</b>? Write the numerator and the denominator.',ND,{n:k,d:d},'The denominator is the number of equal parts in the whole ('+d+'). The numerator is the number of parts that are shaded.',{pre:()=>'<div class="chartbox">'+barFrac(d,k)+'</div>'})});
add('prt',()=>{const d=pick(DENS),k=rk(d);
  return{prompt:'Shade <b>'+fr(k,d)+'</b> of the bar.',render(b){this.s=shadeBar(b,d,k)},
   check(){const c=this.s.count();return c===k?{ok:true}:{ok:false,hint:c===0?'Tap the parts to shade them.':'The denominator '+d+' tells you the bar has '+d+' equal parts. The numerator '+k+' tells you how many to shade. You shaded '+c+'.'}},
   answer:'Shade '+k+' of the '+d+' parts',auto(){this.s.auto()},lock(){this.s.lock()}}});
add('prt',()=>{const d=pick([3,4,5,6,8]),eq=Math.random()<.5;let cuts=Array.from({length:d-1},(_,i)=>(i+1)/d);if(!eq){const i=rnd(0,d-2);cuts[i]+=(Math.random()<.5?-1:1)*0.4/d}
  return mc('The bar is cut into '+d+' parts. Can we call each part <b>one '+FNAME[d]+'</b>?',()=>'<div class="chartbox">'+barFrac(d,0,cuts)+'</div>',['Yes, the parts are equal','No, the parts are not equal'],eq?'Yes, the parts are equal':'No, the parts are not equal','Fractions need equal parts. Look carefully: are all the parts the same size?')});
add('prt',()=>{const d=pick([5,6,8,10,12]),ks=sample([2,3,4,5,6,7,8,9,10,11].filter(x=>x<d),3),ans=ft(1,d);
  return mc('Which of these is a <b>unit fraction</b>?',null,shuffle([ans,...ks.map(k=>ft(k,d))]),ans,'A unit fraction has a numerator of 1.')});
add('prt',()=>{const d=pick(DENS);
  return ask('How many <b>'+FPL[d]+'</b> make one whole? And complete: <b>'+fr(d,d)+' = ___</b>',[{id:'a',label:'a)',w:'3.5em'},{id:'b',label:'b)',w:'3.5em'}],{a:d,b:1},'When the numerator and the denominator are the same, you have the whole: '+d+' '+FPL[d]+' = 1.')});
add('prt',()=>{const d1=pick([2,3,4,5,6]),d2=d1+pick([2,3,4]),k=rnd(1,d1-1),big=ft(k,d1),small=ft(k,d2);
  return mc('Elok says: “'+small+' is greater than '+big+' because '+d2+' is greater than '+d1+'.” Is Elok right?',null,['Yes, Elok is right','No, '+big+' is greater'],'No, '+big+' is greater','The numerators are the same. The bigger the denominator, the smaller each part. So the parts of '+big+' are bigger.')},'Think');
/* B. equal shares */
add('shr',()=>{const d=pick([3,4,5,6,8,10]);
  return ask('One slice of toast is shared equally among <b>'+d+'</b> children. <b>1 ÷ '+d+' = </b> a fraction. Write the numerator and the denominator.',ND,{n:1,d:d},'1 ÷ '+d+' = '+ft(1,d)+'. The number you divide by is the denominator.')});
add('shr',()=>{const d=pick([3,4,5,6,8,10]),k=rnd(2,d-1);
  return ask('<b>'+k+' ÷ '+d+' = </b> a fraction. Write the numerator and the denominator.',ND,{n:k,d:d},k+' ÷ '+d+' = '+ft(k,d)+'. The dividend is the numerator and the divisor is the denominator.')});
add('shr',()=>{const d=pick([3,4,5,6,8,10]),k=rnd(2,d-1),ans=k+' ÷ '+d,o=[ans,d+' ÷ '+k,k+' × '+d,d+' − '+k];
  return mc('Which division matches the fraction <b>'+fr(k,d)+'</b>?',null,shuffle(o),ans,'The numerator is divided by the denominator. '+ft(k,d)+' means '+k+' ÷ '+d+'.')});
add('shr',()=>{const ds=sample([4,5,6,8,10],3),k=rnd(2,ds[0]-1),t=[k+' ÷ '+ds[0],'1 ÷ '+ds[1],'1 ÷ '+ds[2]];
  return mc('Which of these is <b>not</b> a unit fraction? Change each division into a fraction first.',null,shuffle(t),t[0],'A unit fraction has a numerator of 1. Which division does not start with 1?',t[0]+' = '+ft(k,ds[0])+', its numerator is '+k+', not 1')});
add('shr',()=>{const d=rnd(3,6),k=rnd(2,d-1);
  return ask('<b>'+k+' pizzas</b> are shared equally among <b>'+d+' children</b>. Each pizza is cut into '+d+' equal slices. a) How many slices are there in total? b) Each child gets <b>'+k+' ÷ '+d+'</b> of a pizza. How many slices does each child get?',[{id:'a',label:'a) total',w:'4em'},{id:'b',label:'b) each',w:'4em'}],{a:k*d,b:k},'Total slices: '+k+' pizzas × '+d+' slices. Each child gets '+k+' slices of one '+FNAME[d]+', so '+ft(k,d)+'.')},'Think');
/* C. fractions of amounts */
add('amt',()=>{const d=pick([2,3,4,5,6,8,10]),u=rnd(2,9),n=d*u;
  return ask('Find <b>'+fr(1,d)+'</b> of <b>'+n+'</b>.',[{id:'a',w:'4.5em'}],{a:u},'Divide '+n+' by '+d+' (the denominator): '+n+' ÷ '+d+'.',{pre:()=>'<div class="chartbox">'+amountBar(n,d)+'</div>'})});
add('amt',()=>{const d=pick([3,4,5,6,8,10]),k=rnd(2,d-1),u=rnd(2,9),n=d*u;
  return ask('Find <b>'+fr(k,d)+'</b> of <b>'+n+'</b>.',[{id:'a',w:'4.5em'}],{a:k*u},'Step 1: find '+ft(1,d)+' of '+n+' by dividing by '+d+'. Step 2: multiply by '+k+'.',{pre:()=>'<div class="chartbox">'+amountBar(n,d)+'</div>'})});
add('amt',()=>{const d=pick([2,3,4,5,6,8,10]),u=rnd(2,9),n=d*u;
  return ask('<b>'+fr(1,d)+'</b> of a number is <b>'+u+'</b>. What is the number?',[{id:'a',w:'4.5em'}],{a:n},'If one part is '+u+' and there are '+d+' equal parts in the whole, multiply: '+u+' × '+d+'.')});
add('amt',()=>{const d=pick([4,5,6,8,10]),k=rnd(1,d-1),u=rnd(2,6),n=d*u;
  return ask('A box has <b>'+n+'</b> counters. <b>'+fr(k,d)+'</b> of them are red. How many counters are <b>not</b> red?',[{id:'a',suffix:'counters',w:'4em'}],{a:n-k*u},'Find the red counters first: '+ft(k,d)+' of '+n+'. Then take them away from '+n+'.')});
add('amt',()=>{for(;;){const d1=pick([3,4,5,6]),d2=pick([3,4,5,6,8]),u1=rnd(2,9),u2=rnd(2,9),n1=d1*u1,n2=d2*u2;if(u1===u2)continue;
  const x=ft(1,d1)+' of '+n1,y=ft(1,d2)+' of '+n2,A=u1>u2?x:y;
  return mc('Which is <b>greater</b>?',null,[x,y],A,'Work out both amounts: '+x+' = '+u1+' and '+y+' = '+u2+'.')}});
add('amt',()=>{const u=rnd(2,9),d=pick([3,4,5,6]),k=rnd(2,d-1),n=d*u;
  return ask('<b>'+fr(k,d)+'</b> of a number is <b>'+k*u+'</b>. Find the number. Then find <b>'+fr(1,d)+'</b> of the number.',[{id:'a',label:'Number',w:'4.5em'},{id:'b',label:ft(1,d)+' of it',w:'4.5em'}],{a:n,b:u},'First find what '+ft(1,d)+' is: '+k*u+' ÷ '+k+'. Then multiply by '+d+' to find the whole.')},'Think');
/* D. equivalent fractions */
add('eqv',()=>{const L=pick([[2,[4,6,8,10,12]],[3,[6,12]],[4,[8,12]],[5,[10]]]),d=L[0],D=pick(L[1]),m=D/d,n=1;
  return ask('Use the fraction wall idea. <b>'+fr(1,d)+' = '+fr('___',D)+'</b>',[{id:'a',label:'Numerator',w:'4em'}],{a:m},'There are '+m+' times as many parts. Multiply the numerator by '+m+' too.',{pre:()=>'<div class="chartbox">'+barFrac(d,1)+barFrac(D,m)+'</div>'})});
add('eqv',()=>{const L=pick([[3,[6,12]],[4,[8,12]],[5,[10]],[6,[12]]]),d=L[0],D=pick(L[1]),m=D/d,k=rnd(2,d-1);
  return ask('Complete the equivalent fraction: <b>'+fr(k,d)+' = '+fr('___',D)+'</b>',[{id:'a',label:'Numerator',w:'4em'}],{a:k*m},'Multiply the numerator and the denominator by the same number. '+d+' × '+m+' = '+D+', so '+k+' × '+m+' = ?')});
add('eqv',()=>{const L=pick([[2,[4,6,8,10,12]],[3,[6,12]],[4,[8,12]],[5,[10]]]),d=L[0],D=pick(L[1]),m=D/d,k=rnd(1,d-1);
  return ask('Complete: <b>'+fr(k,d)+' = '+fr(k*m,'___')+'</b>',[{id:'a',label:'Denominator',w:'4em'}],{a:D},'The numerator went from '+k+' to '+k*m+', so it was multiplied by '+m+'. Multiply the denominator by '+m+' too: '+d+' × '+m+'.')});
add('eqv',()=>{const d=pick([2,3,4,5]),k=rnd(1,d-1),m=rnd(2,3),ans=ft(k*m,d*m),w=[ft(k+m,d+m),ft(k*m,d*m+1),ft(k+1,d*m)].filter(x=>x!==ans);
  return mc('Which fraction is equivalent to <b>'+fr(k,d)+'</b>?',null,shuffle([ans,...w]),ans,'Equivalent fractions have both numbers multiplied by the same amount. Adding the same amount does not work.')});
add('eqv',()=>{const d1=pick([2,3,4,5,6]),m=d1<=4?pick([2,3]):2,d2=d1*m,n1=rnd(1,d1-1),n2=Math.min(d2-1,Math.max(1,n1*m+pick([-1,0,0,1]))),x=ft(n1,d1),y=ft(n2,d2),ans=n1*m===n2?'They are equal':n1*m>n2?x:y;
  return mc('Compare <b>'+x+'</b> and <b>'+y+'</b>. Which is greater?',null,shuffle([x,y,'They are equal']),ans,'Change '+x+' into '+d2+'ths: multiply the numerator and the denominator by '+m+'. Then compare the numerators.')});
add('eqv',()=>{const L=pick([[1,2,5,12],[2,3,7,12],[1,3,5,12],[3,4,5,6],[1,2,3,8],[1,2,4,10]]),[a,b,c,d2]=L;
  const hv=a/b,sv=c/d2,ans=hv>sv?'Hana':hv<sv?'Sam':'The same';
  return mc('Hana ate <b>'+ft(a,b)+'</b> of a pizza. Sam ate <b>'+ft(c,d2)+'</b> of the <b>same size</b> pizza. Who ate more?',null,['Hana','Sam','The same'],ans,'Change both fractions to the same denominator. '+ft(a,b)+' and '+ft(c,d2)+' can both be changed to twelfths or to a common denominator.')},'Think');
const MISS_OF={prt:1,shr:2,amt:3,eqv:4,final:5};
SECTIONS.push({id:'final',title:'Unit 6 Challenge',sub:'10 mixed questions on everything in Unit 6. Two of them are hard (Think harder). Can you get all 10?'});
[0,1,3,5,7,9,12,16,18,21].forEach(i=>QS.push({sec:'final',gen:QS[i].gen,tag:QS[i].tag,src:i,fixed:false}));

/* ---------- storage, results ---------- */
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(_){return null}};
const R={xb:+ls('t6xb')||0,xm:+ls('t6xm')||0,xd:+ls('t6xd')||0,ff:+ls('t6ff')||0,sr:+ls('t6sr')||0,ar:+ls('t6ar')||0,er:+ls('t6er')||0,fm:+ls('t6fm')||0,solved:0,total:0};
document.getElementById('artog').onclick=()=>{const h=document.body.classList.toggle('noar');document.getElementById('artog').textContent=h?'إظهار الشرح بالعربي / Show Arabic help':'إخفاء الشرح بالعربي / Hide Arabic help'};
const nmEl=document.getElementById('nm');nmEl.value=ls('t6name')||ls('t4name')||'';
nmEl.addEventListener('input',()=>{ls('t6name',nmEl.value);queueSave()});
const myName=()=>(nmEl.value||'').trim()||'Student';
function resultText(only){const nm=n=>+ls('t6m'+n)||0;const tot=k=>secCount[k]||0;
  const q=n=>{const m=MIS.find(x=>x.n===n);return nm(n)+' / '+m.secs.reduce((s,k)=>s+tot(k),0)};
  const GM={1:' · Fraction Flash best score: '+(R.ff||'not played'),2:' · Share Race best score: '+(R.sr||'not played'),3:' · Amount Race best score: '+(R.ar||'not played'),4:' · Equal Race best score: '+(R.er||'not played')+' · Fraction Match: '+(R.fm?R.fm+' moves':'not played')};
  [{4:' · Mistake Detective: '+(R.xm||0)+' cases closed',5:' · Boss battles won: '+(R.xb||0),1:' · Fraction Builder best: '+(R.xd||0)+' / 6'}].forEach(o=>Object.keys(o).forEach(k=>GM[k]=(GM[k]||'')+o[k]));
  const sum=[1,2,3,4,5].reduce((s,n)=>s+nm(n),0),all=[1,2,3,4,5].reduce((s,n)=>s+MIS.find(x=>x.n===n).secs.reduce((t,k)=>t+tot(k),0),0);
  const line=n=>'Mission '+n+' · '+MIS.find(x=>x.n===n).title+': '+q(n)+(GM[n]||'');
  if(only)return 'ThinkUp Year 4 · Unit 6 Fractions\nName: '+myName()+'\n\n'+line(only);
  return 'ThinkUp Year 4 · Unit 6 Fractions\nName: '+myName()+'\n\n'+[1,2,3,4,5].map(line).join('\n')+'\n\nTotal questions: '+sum+' / '+all}
function confetti(){for(let i=0;i<18;i++){const e=document.createElement('div');e.className='conf';e.textContent=['⭐','🎉','✨','🌟'][i%4];e.style.left=Math.random()*100+'vw';e.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}}
function showResult(){const pg=document.body.dataset.page||'map',one=pg==='map'?0:+pg.slice(1);const txt=resultText(one);const w=document.getElementById('wa');if(w)w.href='https://wa.me/201026794126?text='+encodeURIComponent(txt);document.getElementById('resulttext').textContent=txt;if(one){const h=document.querySelector('#resultcard h2'),p=document.querySelector('#resultcard p');if(h)h.textContent='Send this mission\'s result to Miss Eman';if(p)p.textContent='Finished this mission? Type your name at the top, then press the green button.';const wa=document.getElementById('wa');if(wa)wa.textContent='Send this mission to Miss Eman (WhatsApp)';const cp=document.getElementById('copyres');if(cp)cp.textContent='Copy my result'}document.getElementById('resultcard').classList.add('show')}
function queueSave(){showResult()}
document.getElementById('copyres').onclick=()=>{const pg=document.body.dataset.page||'map',t=resultText(pg==='map'?0:+pg.slice(1)),fb=document.getElementById('copyfb');
  const ok=()=>{fb.className='fb good';fb.textContent='Copied! Send it to your teacher.'};const no=()=>{fb.className='fb info';fb.textContent='Select the text above and copy it.'};
  try{navigator.clipboard.writeText(t).then(ok,no)}catch(_){no()}};
{const note=document.getElementById('savenote');if(note){note.hidden=false;note.textContent='Type your name, play all the missions, then come back to the Mission Map and press the green button to send ALL your results to Miss Eman.'}}

/* ---------- games ---------- */
const gamesEl=document.getElementById('games');
function gcard(title,pill,desc,ar,em){const g=document.createElement('div');g.className='g';g.innerHTML='<div class="gribbon"><img alt="ThinkUp" src="logo.png"><span>ThinkUp Games · Think Better. Aim Higher.</span></div><h3><span class="mascot" style="font-size:34px">'+em+'</span>'+title+' <span class="pill">'+pill+'</span></h3><div class="gtip">'+desc+(ar?'<div class="ar" lang="ar">'+ar+'</div>':'')+'</div><div class="gbody"></div>';gamesEl.appendChild(g);return g.querySelector('.gbody')}
const mkbtn=(t,fn,cls)=>{const b=document.createElement('button');b.type='button';b.textContent=t;if(cls)b.className=cls;b.onclick=fn;return b};
function raceGame(body,key,best,qfn,seconds){
  const area=document.createElement('div');area.className='gbody';area.style.width='100%';const bar=document.createElement('div');bar.className='timer';bar.innerHTML='<i></i>';const fill=bar.firstChild;
  const info=document.createElement('div');info.className='big';info.textContent='Best: '+(R[best]||'–');
  let score=0,streak=0,left=0,iv=null;const play=document.createElement('div');play.className='gbody';
  const api={right(){streak++;score+=10+(streak>=3?5:0);info.textContent='Score: '+score;next()},wrong(b){streak=0;b.classList.add('shake');b.disabled=true;score=Math.max(0,score-2);info.textContent='Score: '+score}};
  function next(){play.innerHTML='';qfn(play,api)}
  function end(){clearInterval(iv);play.innerHTML='';if(score>R[best]){R[best]=score;ls(key,score)}info.textContent='Time! Score: '+score+(score>=R[best]?' ★ best':'')+' · Best: '+R[best];queueSave();startB.hidden=false;startB.textContent='Play again'}
  const startB=mkbtn('Start',()=>{score=0;streak=0;left=seconds;startB.hidden=true;info.textContent='Score: 0';next();fill.style.width='100%';clearInterval(iv);iv=setInterval(()=>{left-=0.25;fill.style.width=Math.max(0,left/seconds*100)+'%';if(left<=0)end()},250)});
  area.append(info,bar,play,startB);body.append(area)}
const RACEDESC='Each right answer gives 10 points (3 in a row gives bonus points). A wrong answer takes away 2 points.';
const RACEAR='كل إجابة صح 10 نقاط، وكل غلطة بتخصم نقطتين.';
/* Game 1: fraction flash */
(function(){
  const body=gcard('Fraction Flash','45 seconds','<b>How to play:</b> press <b>Start</b>. Look at the shaded bar and tap the fraction that is shaded. '+RACEDESC,'طريقة اللعب: دوس Start. بص على الشريط الملون واختار الكسر الصح. '+RACEAR,'🍕');
  raceGame(body,'t6ff','ff',(play,api)=>{const d=pick(DENS),k=rk(d),ans=ft(k,d);
    optQ(play,api,'<div class="chartbox" style="margin:0">'+barFrac(d,k)+'</div>',ans,[ft(d-k,d),ft(k,d+(d<12?2:-2)>0?d+(d<12?2:-2):d+2)])},45);
})();
/* Game 2: share race */
(function(){
  const body=gcard('Share Race','45 seconds','<b>How to play:</b> press <b>Start</b>. A division appears. Tap the fraction it makes. '+RACEDESC,'طريقة اللعب: دوس Start. هتلاقي قسمة، اختار الكسر اللي بتساويه. '+RACEAR,'🍫');
  raceGame(body,'t6sr','sr',(play,api)=>{const d=pick([3,4,5,6,8,10]),k=rnd(1,d-1);
    optQ(play,api,k+' ÷ '+d+' = ?',ft(k,d),[ft(d,k>1?k:d+1),ft(k,d+2)])},45);
})();
/* Game 3: amount race */
(function(){
  const body=gcard('Amount Race','45 seconds','<b>How to play:</b> press <b>Start</b>. Find the fraction of the amount and tap the right answer. '+RACEDESC,'طريقة اللعب: دوس Start. احسب الكسر من العدد واختار الإجابة الصح. '+RACEAR,'🔢');
  raceGame(body,'t6ar','ar',(play,api)=>{const d=pick([2,3,4,5,6,8,10]),k=d===2?1:rnd(1,Math.min(3,d-1)),u=rnd(2,9),n=d*u,ans=k*u;
    optQ(play,api,fr(k,d)+' of '+n,ans,[ans+u,ans-1>0?ans-1:ans+2])},45);
})();
/* Game 4: equal race */
(function(){
  const body=gcard('Equal Race','45 seconds','<b>How to play:</b> press <b>Start</b>. Find the missing number in the equivalent fraction. '+RACEDESC,'طريقة اللعب: دوس Start. دوّر على الرقم الناقص في الكسر المكافئ. '+RACEAR,'⚖️');
  raceGame(body,'t6er','er',(play,api)=>{const d=pick([2,3,4,5]),D=d*pick([2,3,4].filter(m=>d*m<=12)),m=D/d,k=rnd(1,d-1);
    optQ(play,api,fr(k,d)+' = '+fr('?',D),k*m,[k*m+1,k*m>1?k*m-1:k*m+2])},45);
})();
/* Game 5: fraction match */
(function(){
  const body=gcard('Fraction Match','6 pairs','<b>How to play:</b> press <b>Start</b>. Turn over two cards. If two fractions are equivalent, the pair stays. Find all 6 pairs with as few moves as you can.','طريقة اللعب: دوس Start. اقلب كارتين. لو الكسرين متكافئين الكارتين بيفضلوا. دوّر على الـ 6 أزواج بأقل عدد محاولات.','🧠');
  memGame(body,'fm','t6fm',np=>{const base=[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[5,6]].filter(([n,d])=>true),pr=[];const mm=sample(base,np);
    mm.forEach(([n,d])=>{const ms=[2,3,4].filter(m=>d*m<=12);const m=pick(ms.length?ms:[2]);pr.push([ft(n,d),ft(n*m,d*m)])});return pr},6);
})();

/* ---------- new game engines: boss battle, mistake detective, builders ---------- */
const NGf=n=>{const neg=n<0,s=String(Math.abs(n));return (neg?'−':'')+(Math.abs(n)>=10000?s.replace(/\B(?=(\d{3})+(?!\d))/g,' '):s)};
const NGfr=(n,d)=>'<span class="fr"><i>'+n+'</i><i>'+d+'</i></span>';
function NGopts(ans,wr){const A=String(ans),s=[A];shuffle(wr.map(String)).forEach(x=>{if(!s.includes(x)&&s.length<3)s.push(x)});
  const b=parseFloat(A.replace(/ /g,'').replace(/−/g,'-'));for(let k=1;s.length<3&&!isNaN(b);k++){[b+k,b-k].forEach(c=>{const t=NGf(c);if(!s.includes(t)&&s.length<3)s.push(t)})}return shuffle(s)}
function NGdragon(hp,col){return '<svg viewBox="0 0 200 190" aria-label="Boss" style="width:150px"><path d="M30 150 Q10 100 45 70 L40 25 L68 50 Q100 38 132 50 L160 25 L155 70 Q190 100 170 150 Q100 188 30 150Z" fill="'+col+'" stroke="#0F2742" stroke-width="5" stroke-linejoin="round"/><path d="M40 25 L52 55 L68 50Z M160 25 L148 55 L132 50Z" fill="#E0A21B" stroke="#0F2742" stroke-width="4" stroke-linejoin="round"/><ellipse cx="100" cy="140" rx="46" ry="30" fill="#FBE9B7" stroke="#0F2742" stroke-width="4"/><circle cx="76" cy="88" r="15" fill="#fff" stroke="#0F2742" stroke-width="4"/><circle cx="124" cy="88" r="15" fill="#fff" stroke="#0F2742" stroke-width="4"/><circle cx="79" cy="91" r="6" fill="#0F2742"/><circle cx="121" cy="91" r="6" fill="#0F2742"/><path d="M82 118 Q100 132 118 118" fill="none" stroke="#0F2742" stroke-width="5" stroke-linecap="round"/><text x="100" y="146" font-family="Baloo 2,Trebuchet MS,sans-serif" font-weight="800" font-size="26" text-anchor="middle" fill="#0F2742">'+hp+'/10</text></svg>'}
function NGboss(c){
  const body=gcard(c.title,'10 health points','<b>How to play:</b> press <b>Start battle</b>. Answer the question. A right answer hits the boss (it loses 1 health). A wrong answer lets it heal 1 health, and you get a hint. Beat the boss to win!','طريقة اللعب: دوس Start battle. جاوب على السؤال. الإجابة الصح بتضرب الزعيم، والغلط بيرجّع له نقطة وبتاخد تلميح. اهزم الزعيم!','🐉');
  const info=document.createElement('div');info.className='mdinfo';const boss=document.createElement('div');boss.className='bossbox';const hpEl=document.createElement('div');hpEl.className='hp5';
  const qEl=document.createElement('div');qEl.className='bbq';const oEl=document.createElement('div');oEl.className='opts';const fb=document.createElement('div');fb.className='fb';fb.setAttribute('aria-live','polite');
  const st=mkbtn('Start battle',()=>go());body.append(info,boss,hpEl,qEl,oEl,fb,st);
  let hp=10,streak=0,Q=null,on=false;
  const draw=()=>{boss.innerHTML=NGdragon(hp,c.color||'#1F7A7A');hpEl.innerHTML=Array.from({length:10},(_,i)=>'<i class="'+(i<hp?'':'off')+'"></i>').join('')};
  const ask=()=>{Q=pick(c.gens)();qEl.innerHTML=Q.h;oEl.innerHTML='';NGopts(Q.a,Q.wr).forEach(v=>{const b=mkbtn(v,()=>hit(b,v===String(Q.a)),'opt');b.innerHTML=Q.html?Q.html(v):v;oEl.append(b)});window.__NGB={ans:String(Q.a)}};
  function hit(b,ok){if(!on)return;
    if(ok){streak++;hp=Math.max(0,hp-1);fb.className='fb good';fb.textContent=streak>=3?'🔥 '+streak+' in a row! Direct hit!':'✓ Hit! The boss loses 1 health.';draw();
      if(hp===0){on=false;qEl.innerHTML='<b class="winb">🏆 You beat the boss!</b>';oEl.innerHTML='';fb.textContent='';R.xb=(R.xb||0)+1;ls(c.ls,R.xb);confetti();queueSave();st.hidden=false;st.textContent='Play again';info.textContent='Bosses beaten: '+R.xb;return}ask()}
    else{streak=0;hp=Math.min(10,hp+1);fb.className='fb bad';fb.innerHTML='Oops, the boss heals 1 health. Hint: '+Q.hint;b.disabled=true;draw()}
    info.textContent='Streak: '+streak+' · Bosses beaten: '+(R.xb||0)}
  function go(){hp=10;streak=0;on=true;st.hidden=true;fb.textContent='';info.textContent='Bosses beaten: '+(R.xb||0);draw();ask()}
  info.textContent='Bosses beaten: '+(R.xb||0);draw()}
/* mistake detective: a list of claims, 3 are wrong */
function NGclaims(c){
  const body=gcard('Mistake Detective','3 mistakes in every case','<b>How to play:</b> press <b>Start case</b>. Some answers are right and <b>3 are wrong</b>. Tap each wrong answer. If you tap a right one, you use up a try. Close as many cases as you can.','طريقة اللعب: دوس Start case. فيه إجابات صح و3 غلط. دوس على كل إجابة غلط. لو دوست على إجابة صح بتتحسب محاولة غلط. اقفل أكبر عدد من القضايا.','🕵️');
  const info=document.createElement('div');info.className='mdinfo';const stage=document.createElement('div');stage.className='mdstage';const fb=document.createElement('div');fb.className='fb';fb.setAttribute('aria-live','polite');const logEl=document.createElement('div');logEl.className='mdlog';
  const st=mkbtn('Start case',()=>next());body.append(info,stage,fb,logEl,st);
  let order=[],cur=null,found=0,miss=0,done=false,no=0;
  const upd=()=>{info.textContent='Case '+no+' · Found '+found+' / 3 · Wrong taps '+miss+' · Cases closed '+(R.xm||0)};
  function next(){if(!order.length)order=shuffle(c.gens.slice());const g=order.pop();const flags=shuffle([false,false,false,true,true,true,true,true]);
    cur=flags.map((ok,i)=>({i,ok,...g.item(ok)}));found=0;miss=0;done=false;no++;window.__NGC=cur;logEl.innerHTML='';fb.textContent='';fb.className='fb';
    stage.innerHTML='<div class="hint" style="margin:0 0 8px">'+g.intro+'</div><div class="claims">'+cur.map(x=>'<button type="button" class="claim" data-i="'+x.i+'">'+x.t+'</button>').join('')+'</div>';st.hidden=true;upd()}
  stage.addEventListener('click',e=>{if(done||!cur)return;const el=e.target.closest('.claim');if(!el||el.classList.contains('found'))return;const x=cur[+el.dataset.i];
    if(x.ok){miss++;fb.className='fb bad';fb.textContent='That one is correct. Look again!';upd();return}
    found++;el.classList.add('found');fb.className='fb good';fb.textContent='✓ You found a mistake!';logEl.insertAdjacentHTML('beforeend','<div class="item">✓ '+x.fix+'</div>');upd();
    if(found===3){done=true;const s=miss<=1?'⭐⭐⭐':miss<=3?'⭐⭐':'⭐';R.xm=(R.xm||0)+1;ls(c.ls,R.xm);fb.textContent='🏆 Case closed! '+s;confetti();queueSave();upd();st.hidden=false;st.textContent='Next case'}});
  info.textContent='Cases closed: '+(R.xm||0)}
/* number line builder */
function NGnumline(c){
  const body=gcard('Number Line Builder','8 numbers','<b>How to play:</b> press <b>Start</b>. A number appears. Tap the place on the number line where it belongs. Try to get all 8 on the first try.','طريقة اللعب: دوس Start. هيظهر رقم. دوس على مكانه على خط الأعداد. حاول تجيب الـ 8 من أول مرة.','📏');
  const info=document.createElement('div');info.className='mdinfo';const q=document.createElement('div');q.className='bbq';const area=document.createElement('div');area.className='chartbox';const fb=document.createElement('div');fb.className='fb';
  const st=mkbtn('Start',()=>go());body.append(info,q,area,fb,st);
  let n=0,score=0,tgt=0,tries=0,on=false;const lo=-10,hi=10;
  function line(){const W=360,L=18,pw=W-2*L;let s='<svg class="chart" viewBox="0 0 '+W+' 80" role="img" aria-label="number line"><line x1="8" y1="38" x2="352" y2="38" stroke="var(--ink)" stroke-width="2.5"/>';
    for(let v=lo;v<=hi;v++){const x=L+pw*(v-lo)/(hi-lo);s+='<line x1="'+x+'" y1="'+(v%5===0?28:32)+'" x2="'+x+'" y2="44" stroke="var(--ink)" stroke-width="'+(v===0?3:1.5)+'"/>';if(v%5===0)s+='<text x="'+x+'" y="62" font-size="12" font-weight="800" text-anchor="middle" fill="var(--ink)">'+(v<0?'−'+(-v):v)+'</text>';
      s+='<g class="nlhit" data-v="'+v+'" style="cursor:pointer"><rect x="'+(x-8)+'" y="18" width="16" height="40" fill="transparent"/></g>'}return s+'</svg>'}
  area.innerHTML=line();
  area.addEventListener('click',e=>{if(!on)return;const g=e.target.closest('.nlhit');if(!g)return;const v=+g.dataset.v;
    if(v===tgt){if(tries===0)score++;fb.className='fb good';fb.textContent='✓ Yes! '+NGf(tgt)+' is there.';n++;if(n>=8)return end();setTimeout(nextQ,500)}
    else{tries++;fb.className='fb bad';fb.textContent=(v>tgt?'Too far right. Numbers on the left are smaller.':'Too far left. Numbers on the right are bigger.')+(tgt<0?' '+NGf(tgt)+' is a negative number: it is left of zero.':'')}});
  function nextQ(){tgt=rnd(lo,hi);window.__NGN=tgt;tries=0;q.innerHTML='Tap <b>'+NGf(tgt)+'</b> on the number line.';fb.textContent='';info.textContent='Number '+(n+1)+' / 8 · First-try score '+score}
  function end(){on=false;q.innerHTML='<b class="winb">Done! First-try score: '+score+' / 8</b>';fb.textContent='';if(score>(R.xd||0)){R.xd=score;ls(c.ls,score)}if(score>=6)confetti();queueSave();info.textContent='Best score: '+(R.xd||0)+' / 8';st.hidden=false;st.textContent='Play again'}
  function go(){n=0;score=0;on=true;st.hidden=true;nextQ()}
  info.textContent='Best score: '+(R.xd||0)+' / 8';q.textContent='Press Start to begin.'}
/* fraction builder */
function NGfracbuild(c){
  const body=gcard('Fraction Builder','6 builds','<b>How to play:</b> press <b>Start</b>. Tap the parts to shade the fraction you are asked for. Then press <b>Check</b>.','طريقة اللعب: دوس Start. دوس على الأجزاء عشان تلوّن الكسر المطلوب. بعدين دوس Check.','🍰');
  const info=document.createElement('div');info.className='mdinfo';const q=document.createElement('div');q.className='bbq';const topEl=document.createElement('div');const bar=document.createElement('div');bar.className='shade';const fb=document.createElement('div');fb.className='fb';
  const chk=mkbtn('Check',()=>check());const st=mkbtn('Start',()=>go());body.append(info,q,topEl,bar,fb,chk,st);
  let n=0,score=0,tgt=0,tries=0,on=false;const DEN=[2,3,4,5,6,8,10,12];
  const cells=()=>[...bar.children];
  function build(d){bar.innerHTML='';for(let i=0;i<d;i++){const b=document.createElement('button');b.type='button';b.className='cell';b.setAttribute('aria-label','part '+(i+1));b.onclick=()=>{if(on)b.classList.toggle('on')};bar.append(b)}}
  function nextQ(){tries=0;fb.textContent='';topEl.innerHTML='';const eq=n%2===1;
    if(!eq){const d=pick(DEN),k=rnd(1,d-1);tgt=k;build(d);q.innerHTML='Shade <b>'+NGfr(k,d)+'</b> of the bar.'}
    else{const d=pick([2,3,4,5,6]),m=pick([2,3,4].filter(x=>d*x<=12)),k=rnd(1,d-1);tgt=k*m;
      topEl.innerHTML='<div class="shade static">'+Array.from({length:d},(_,i)=>'<span class="cell'+(i<k?' on':'')+'"></span>').join('')+'</div>';build(d*m);q.innerHTML='The top bar shows <b>'+NGfr(k,d)+'</b>. Shade the <b>same amount</b> on the bottom bar ('+NGfr('?',d*m)+').'}
    window.__NGF=tgt;info.textContent='Build '+(n+1)+' / 6 · First-try score '+score}
  function check(){if(!on)return;const k=cells().filter(x=>x.classList.contains('on')).length;
    if(k===tgt){if(tries===0)score++;fb.className='fb good';fb.textContent='✓ Correct!';n++;if(n>=6)return end();setTimeout(nextQ,500)}
    else{tries++;fb.className='fb bad';fb.textContent=k===0?'Tap the parts to shade them.':'You shaded '+k+' parts. Count again: the numerator tells you how many parts to shade.'}}
  function end(){on=false;q.innerHTML='<b class="winb">Done! First-try score: '+score+' / 6</b>';topEl.innerHTML='';bar.innerHTML='';fb.textContent='';if(score>(R.xd||0)){R.xd=score;ls(c.ls,score)}if(score>=5)confetti();queueSave();info.textContent='Best score: '+(R.xd||0)+' / 6';st.hidden=false;st.textContent='Play again';chk.hidden=true}
  function go(){n=0;score=0;on=true;st.hidden=true;chk.hidden=false;nextQ()}
  chk.hidden=true;info.textContent='Best score: '+(R.xd||0)+' / 6';q.textContent='Press Start to begin.'}
/* shape builder: area and perimeter on a grid */
function NGshape(c){
  const body=gcard('Shape Builder','6 builds','<b>How to play:</b> press <b>Start</b>. Tap squares on the grid to build a shape with the <b>area</b> and the <b>perimeter</b> you are asked for. The squares must touch along a side. Then press <b>Check</b>.','طريقة اللعب: دوس Start. دوس على المربعات عشان تبني شكل بالمساحة والمحيط المطلوبين. المربعات لازم تتلامس بالضلع. بعدين دوس Check.','🧱');
  const info=document.createElement('div');info.className='mdinfo';const q=document.createElement('div');q.className='bbq';const live=document.createElement('div');live.className='hint';const grid=document.createElement('div');grid.className='sgrid';const fb=document.createElement('div');fb.className='fb';
  const chk=mkbtn('Check',()=>check());const clr=mkbtn('Clear',()=>{[...grid.children].forEach(x=>x.classList.remove('on'));upd()},'ghost');const st=mkbtn('Start',()=>go());body.append(info,q,live,grid,fb,chk,clr,st);
  const N=6;let n=0,score=0,A=0,P=0,tries=0,on=false;
  const set=()=>{const s=new Set();[...grid.children].forEach((x,i)=>{if(x.classList.contains('on'))s.add(i)});return s};
  const per=s=>{let p=0;s.forEach(i=>{const r=Math.floor(i/N),cc=i%N;[[r-1,cc],[r+1,cc],[r,cc-1],[r,cc+1]].forEach(([a,b])=>{if(a<0||b<0||a>=N||b>=N||!s.has(a*N+b))p++})});return p};
  const conn=s=>{if(!s.size)return false;const f=[...s][0],seen=new Set([f]),qq=[f];while(qq.length){const i=qq.pop(),r=Math.floor(i/N),cc=i%N;[[r-1,cc],[r+1,cc],[r,cc-1],[r,cc+1]].forEach(([a,b])=>{if(a>=0&&b>=0&&a<N&&b<N){const j=a*N+b;if(s.has(j)&&!seen.has(j)){seen.add(j);qq.push(j)}}})}return seen.size===s.size};
  function upd(){const s=set();live.textContent='Your shape now: area '+s.size+' square units · perimeter '+per(s)+' units'}
  function target(){const a=rnd(4,8),s=new Set([rnd(0,N*N-1)]);while(s.size<a){const i=pick([...s]),r=Math.floor(i/N),cc=i%N,nb=[[r-1,cc],[r+1,cc],[r,cc-1],[r,cc+1]].filter(([x,y])=>x>=0&&y>=0&&x<N&&y<N).map(([x,y])=>x*N+y);s.add(pick(nb))}window.__NGS=[...s];return{a,p:per(s)}}
  function nextQ(){tries=0;const t=target();A=t.a;P=t.p;grid.innerHTML='';for(let i=0;i<N*N;i++){const b=document.createElement('button');b.type='button';b.className='sc';b.setAttribute('aria-label','square '+(i+1));b.onclick=()=>{if(on){b.classList.toggle('on');upd()}};grid.append(b)}
    q.innerHTML='Build a shape with area <b>'+A+'</b> square units and perimeter <b>'+P+'</b> units.';fb.textContent='';upd();info.textContent='Build '+(n+1)+' / 6 · First-try score '+score}
  function check(){if(!on)return;const s=set();
    if(s.size===A&&per(s)===P&&conn(s)){if(tries===0)score++;fb.className='fb good';fb.textContent='✓ Correct! Area '+A+' and perimeter '+P+'.';n++;if(n>=6)return end();setTimeout(nextQ,700)}
    else{tries++;fb.className='fb bad';fb.textContent=s.size!==A?'The area is the number of squares. You have '+s.size+', you need '+A+'.':!conn(s)?'The squares must touch along a side.':'Right area, but the perimeter is '+per(s)+'. Count the outside edges. Try moving a square.'}}
  function end(){on=false;q.innerHTML='<b class="winb">Done! First-try score: '+score+' / 6</b>';grid.innerHTML='';live.textContent='';fb.textContent='';if(score>(R.xd||0)){R.xd=score;ls(c.ls,score)}if(score>=5)confetti();queueSave();info.textContent='Best score: '+(R.xd||0)+' / 6';st.hidden=false;st.textContent='Play again';chk.hidden=true;clr.hidden=true}
  function go(){n=0;score=0;on=true;st.hidden=true;chk.hidden=false;clr.hidden=false;nextQ()}
  chk.hidden=true;clr.hidden=true;info.textContent='Best score: '+(R.xd||0)+' / 6';q.textContent='Press Start to begin.'}

NGboss({title:'Boss Battle: The Denominator Dragon',ls:'t6xb',color:'#1F7A7A',gens:[
 ()=>{const d=pick([2,3,4,5,6,8,10]),u=rnd(2,9),n=d*u;return{h:NGfr(1,d)+' of '+n+' = ?',a:String(u),wr:[String(u+1),String(u*2),String(Math.max(1,u-1))],hint:'Divide '+n+' by '+d+'. '+n+' ÷ '+d+' = '+u+'.'}},
 ()=>{const d=pick([3,4,5,6,8,10]),k=rnd(2,3),u=rnd(2,7),n=d*u,a=k*u;return{h:NGfr(k,d)+' of '+n+' = ?',a:String(a),wr:[String(u),String(a+u),String(a-1)],hint:'Find '+NGfr(1,d)+' of '+n+' = '+u+', then multiply by '+k+'.'}},
 ()=>{const d=pick([2,3,4,5]),D=d*pick([2,3,4].filter(m=>d*m<=12)),m=D/d,k=rnd(1,d-1),a=k*m;return{h:NGfr(k,d)+' = '+NGfr('?',D),a:String(a),wr:[String(a+1),String(a>1?a-1:a+2),String(k+m)],hint:'The denominator was multiplied by '+m+', so multiply the numerator by '+m+'.'}},
 ()=>{const d=pick([3,4,5,6,8]),k=rnd(1,d-1);return{h:k+' ÷ '+d+' = ?',a:k+'/'+d,wr:[d+'/'+k,'1/'+(k+d),k+'/'+(d+1),(k+1)+'/'+d,k+'/'+(d+2)],html:v=>{const[n,m]=v.split('/');return NGfr(n,m)},hint:'The number you divide by is the denominator: '+k+' ÷ '+d+' = '+NGfr(k,d)+'.'}},
 ()=>{const d=pick([2,3,4,5,6,8,10,12]),k=rnd(1,d-1);return{h:'<div class="chartbox" style="margin:0">'+barFracNG(d,k)+'</div>What fraction is shaded?',a:k+'/'+d,wr:[(d-k)+'/'+d,k+'/'+(d+2),'1/'+d,(k+1)+'/'+d,d+'/'+k,k+'/'+(d+1),'1/'+(d+1)],html:v=>{const[n,m]=v.split('/');return NGfr(n,m)},hint:'Denominator = number of equal parts. Numerator = shaded parts.'}}]});
function barFracNG(d,k){let s='<svg class="chart" viewBox="0 0 348 54">';for(let i=0;i<d;i++){const a=4+340*i/d,w=340/d;s+='<rect x="'+a+'" y="4" width="'+w+'" height="46" fill="'+(i<k?'#E0A21B':'#fff')+'" stroke="var(--ink)" stroke-width="2.5"/>'}return s+'</svg>'}
NGclaims({ls:'t6xm',gens:[
 {intro:'Naomi wrote equivalent fractions. Tap the <b>wrong</b> ones.',item:ok=>{const d=pick([2,3,4,5]),m=pick([2,3,4].filter(x=>d*x<=12)),k=rnd(1,d-1),w=k*m+pick([1,-1]);const nn=ok?k*m:(w<1?k*m+1:w);return{t:NGfr(k,d)+' = '+NGfr(nn,d*m),fix:NGfr(k,d)+' = '+NGfr(k*m,d*m)+'. Multiply the numerator and denominator by '+m+'.'}}},
 {intro:'Naomi found fractions of amounts. Tap the <b>wrong</b> answers.',item:ok=>{const d=pick([2,3,4,5,6,8,10]),k=rnd(1,Math.min(3,d-1)),u=rnd(2,9),n=d*u,a=k*u,w=a+pick([1,-1,u]);return{t:NGfr(k,d)+' of '+n+' = '+(ok?a:w),fix:NGfr(k,d)+' of '+n+' = '+a+', not '+w+'.'}}},
 {intro:'Naomi turned divisions into fractions. Tap the <b>wrong</b> ones.',item:ok=>{const d=pick([3,4,5,6,8]),k=rnd(1,d-1);return{t:k+' ÷ '+d+' = '+(ok?NGfr(k,d):NGfr(d,k)),fix:k+' ÷ '+d+' = '+NGfr(k,d)+'. The number you divide by is the denominator.'}}},
 {intro:'Naomi compared fractions with the same numerator. Tap the <b>wrong</b> statements.',item:ok=>{const d1=pick([2,3,4,5,6]),d2=d1+pick([2,3,4]),k=rnd(1,d1-1),t='&gt;',bad='&lt;';return{t:NGfr(k,d1)+' '+(ok?t:bad)+' '+NGfr(k,d2),fix:NGfr(k,d1)+' &gt; '+NGfr(k,d2)+'. Same numerator: the smaller denominator gives the bigger fraction.'}}}]});
NGfracbuild({ls:'t6xd'});

const AR=["المقام هو عدد الأجزاء المتساوية في الكل. البسط هو عدد الأجزاء الملونة.","المقام بيقول الشريط متقسم لكام جزء متساوي. البسط بيقول تلوّن كام جزء.","الكسور محتاجة أجزاء متساوية. بص بدقة: هل كل الأجزاء بنفس الحجم؟","الكسر الوحدوي بسطه 1.","لما البسط والمقام يتساووا يبقى عندك كل واحد صحيح.","البسطين متساويين. كل ما المقام أكبر بيبقى الجزء أصغر. فالجزء الأكبر هو اللي مقامه أصغر.","1 ÷ عدد = كسر بسطه 1 ومقامه العدد اللي بنقسم عليه.","القسمة بتعمل كسر: العدد المقسوم هو البسط، والمقسوم عليه هو المقام.","البسط بيتقسم على المقام: الكسر ده معناه بسط ÷ مقام.","حوّل كل قسمة لكسر. الكسر الوحدوي بسطه 1. أنهي قسمة مبتدأش بـ 1؟","عدد الشرايح الكلي = عدد البيتزا × الشرايح في كل واحدة. كل طفل بياخد عدد شرايح = عدد البيتزا.","اقسم العدد على المقام عشان تلاقي جزء واحد.","أولًا: اقسم على المقام. ثانيًا: اضرب في البسط.","لو جزء واحد معروف، اضرب في عدد الأجزاء عشان تلاقي الكل.","احسب عدد الكتل الحمراء الأول وبعدين اطرحه من العدد الكلي.","احسب الكميتين وقارن بينهم.","اعرف قيمة جزء واحد الأول، وبعدين اضرب في عدد الأجزاء عشان تلاقي الكل.","لو زاد عدد الأجزاء 2 أو 3 مرات، اضرب البسط في نفس الرقم.","اضرب البسط والمقام في نفس الرقم.","البسط اتضرب في رقم، فاضرب المقام في نفس الرقم.","الكسور المتكافئة بنضرب فيها البسط والمقام في نفس الرقم، مش بنجمع.","غيّر الكسرين لنفس المقام وبعدين قارن البسطين.","غيّر الكسرين لمقام مشترك وقارن."];

/* ---------- engine ---------- */
const main=document.getElementById('main'),nav=document.getElementById('nav');
let solved=0;const secCount={},secDone={};
function updateScore(){
  const _t=(typeof CUR!=='undefined'&&CUR&&CUR.secs)?CUR.secs.reduce((a,k)=>a+secCount[k],0):QS.length,_d=(typeof CUR!=='undefined'&&CUR&&CUR.secs)?CUR.secs.reduce((a,k)=>a+secDone[k],0):solved;
  document.getElementById('score').textContent=(typeof CUR!=='undefined'&&CUR&&!CUR.secs)?'Games':'★ '+_d+' / '+_t;
  document.getElementById('barfill').style.width=(100*_d/Math.max(1,_t))+'%';
  SECTIONS.forEach(s=>{const a=document.getElementById('chip-'+s.id);if(a)a.classList.toggle('done',secDone[s.id]===secCount[s.id]);const c=document.getElementById('cnt-'+s.id);if(c)c.textContent=secDone[s.id]+' / '+secCount[s.id]});
  if(typeof MIS!=='undefined')MIS.forEach(m=>{let d=0,t=0;m.secs&&m.secs.forEach(k=>{d+=secDone[k];t+=secCount[k]});const sv=+ls('t6m'+m.n)||0;if(!CUR||CUR.n!==m.n)d=sv;const e=document.getElementById('st-'+m.n);if(e&&t)e.textContent=d+' / '+t+(d===t?' ★ complete':' questions')});
  MIS.forEach(m=>{if(!m.secs)return;let d=0;m.secs.forEach(k=>d+=secDone[k]);if(CUR&&CUR.n===m.n&&d>(+ls('t6m'+m.n)||0))ls('t6m'+m.n,d)});
  R.solved=solved;R.total=QS.length;queueSave();
  if(_t>0&&_d===_t)document.getElementById('win').classList.add('show');
}
SECTIONS.forEach(s=>{
  secCount[s.id]=QS.filter(q=>q.sec===s.id).length;secDone[s.id]=0;
  const a=document.createElement('a');a.href='#';a.id='chip-'+s.id;a.textContent=s.title;a.onclick=e=>{e.preventDefault();document.getElementById('sec-'+s.id).scrollIntoView({behavior:'smooth',block:'start'})};nav.appendChild(a);
  const sec=document.createElement('section');sec.id='sec-'+s.id;sec.innerHTML='<h2>'+esc(s.title)+' <small id="cnt-'+s.id+'"></small></h2><p class="sub">'+esc(s.sub)+'</p>';main.appendChild(sec);
});
let n=0;const MCOUNT={};
QS.forEach(def=>{
  n++;const sec=document.getElementById('sec-'+def.sec);
  const card=document.createElement('div');card.className='q';sec.appendChild(card);
  let inst,attempts=0,done=false;
  const build=()=>{
    inst=def.gen();attempts=0;
    card.innerHTML='<div class="qh"><div class="num">'+qnum+'</div><div class="prompt">'+(def.tag?'<span class="tag">Think harder</span>':'')+inst.prompt+'</div></div><div class="body"></div>';
    const pr=card.querySelector('.prompt');const ar=document.createElement('div');ar.className='ar';ar.lang='ar';ar.textContent=AR[def.src!=null?def.src:n-1]||'';if(ar.textContent)pr.appendChild(ar);
    const body=card.querySelector('.body');inst.render(body);
    const row=document.createElement('div');row.className='row';
    const chk=document.createElement('button');chk.type='button';chk.textContent='Check';
    const nw=document.createElement('button');nw.type='button';nw.className='ghost';nw.textContent='New numbers';nw.hidden=!!def.fixed;
    const sh=document.createElement('button');sh.type='button';sh.className='ghost';sh.textContent='Show answer';sh.hidden=true;
    const fb=document.createElement('div');fb.className='fb';fb.setAttribute('aria-live','polite');
    row.append(chk,nw,sh);body.append(row,fb);
    const lockAll=()=>{body.querySelectorAll('input').forEach(i=>i.disabled=true);if(inst.lock)inst.lock();chk.disabled=true;nw.hidden=true;sh.hidden=true};
    chk.onclick=()=>{
      if(done)return;
      const r=inst.check();
      if(r.ok){done=true;card.classList.add('ok');fb.className='fb good';fb.textContent='✓ Correct! '+(r.note||'');confetti();lockAll();solved++;secDone[def.sec]++;updateScore()}
      else{attempts++;fb.className='fb bad';fb.textContent='Not yet. '+(r.hint||'Try again.');if(attempts>=2)sh.hidden=false}
    };
    sh.onclick=()=>{fb.className='fb info';fb.textContent='Answer: '+inst.answer+''+(def.fixed?'':'. Press "New numbers" to try another one.');if(inst.c&&inst.c.reveal)inst.c.reveal()};
    nw.onclick=()=>{if(!done)build()};
    body.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')chk.click()}));
  };
  const qnum=(MCOUNT[MISS_OF[def.sec]]=(MCOUNT[MISS_OF[def.sec]]||0)+1);build();
});

/* ---------- Mission Map ---------- */
const MIS=[
 {n:1,id:'mission-1',title:'Parts and Wholes',tag:'EQUAL PARTS AND UNIT FRACTIONS',ds:'Name and shade fractions of a bar, then play Fraction Flash.',secs:['prt'],games:[0,7]},
 {n:2,id:'mission-2',title:'Equal Shares',tag:'DIVISION AND FRACTIONS',ds:'Share things equally and turn divisions into fractions. Then play Share Race.',secs:['shr'],games:[1]},
 {n:3,id:'mission-3',title:'Fractions of Amounts',tag:'BAR MODELS',ds:'Find a fraction of a number with a bar model. Then play Amount Race.',secs:['amt'],games:[2]},
 {n:4,id:'mission-4',title:'Equivalent Fractions',tag:'SAME VALUE, DIFFERENT NAME',ds:'Use the fraction wall idea. Two games: Equal Race and Fraction Match.',secs:['eqv'],games:[3,4,6]},
 {n:5,id:'mission-5',title:'Unit 6 Challenge',tag:'FINAL TEST: 10 MIXED QUESTIONS',ds:'Questions on everything in Unit 6, with 2 hard ones. Can you get all 10?',secs:['final'],games:[5],final:true}];
const mapv=document.createElement('div');mapv.id='mapview';
mapv.innerHTML='<h2 style="font-family:var(--display);font-weight:700;font-size:30px;margin:24px 0 0">🗺️ Mission Map</h2><p style="color:var(--muted);margin:2px 0 0">Tap a mission to play. Do them in order. You can play each mission again.</p><div class="maplist">'+MIS.map(m=>'<a class="mc'+(m.final?' final':'')+'" href="mission-'+m.n+'.html"><span class="no">'+m.n+'</span><span class="em" aria-hidden="true">'+['🍕','🍫','🔢','⚖️','🏆'][m.n-1]+'</span><span class="tx"><b>'+esc(m.title)+'</b><span class="tg">'+esc(m.tag)+'</span><span class="ds">'+esc(m.ds)+'</span><span class="st" id="st-'+m.n+'"></span></span><span class="go">PLAY</span></a>').join('')+'</div>';
nav.style.display='none';nav.before(mapv);document.getElementById('sec-games').hidden=true;
const GC=[...gamesEl.children];const missionEls=[];
MIS.forEach(m=>{const c=document.createElement('div');c.className='mission';c.id=m.id;
  c.innerHTML='<div class="mhead"><img alt="" src="logo.png"><span>Year 4 · Unit 6</span></div><a class="back" href="index.html">← Mission Map</a><h2 style="font-family:var(--display);font-weight:700;font-size:28px;margin:6px 0 0">'+m.n+'. '+esc(m.title)+'</h2>';
  (m.games||[]).forEach(g=>{const w=document.createElement('div');w.className='games';w.appendChild(GC[g]);c.appendChild(w)});
  (m.secs||[]).forEach(k=>c.appendChild(document.getElementById('sec-'+k)));
  main.appendChild(c);missionEls.push(c)});
const PAGE=document.body.dataset.page||'map';const CUR=MIS.find(x=>'m'+x.n===PAGE)||null;
mapv.classList.toggle('off',!!CUR);missionEls.forEach(c=>c.classList.toggle('on',!!CUR&&c.id===CUR.id));
if(CUR){document.title='ThinkUp Y4 Unit 6 · '+CUR.title;const hp=document.querySelector('header p');if(hp)hp.textContent='Mission '+CUR.n+': '+CUR.title}
updateScore();

/* floating send button + version */
(function(){const b=document.createElement('button');b.type='button';b.id='fsend';b.textContent='📤 Send my result';
b.onclick=()=>{const c=document.getElementById('resultcard');if(c){c.classList.add('show');c.scrollIntoView({behavior:'smooth',block:'center'})}};document.body.appendChild(b);
const f=document.querySelector('footer');if(f){const v=document.createElement('div');v.style.cssText='font-size:11px;opacity:.6;margin-top:8px';v.textContent='Version 2';f.appendChild(v)}})();
})();
