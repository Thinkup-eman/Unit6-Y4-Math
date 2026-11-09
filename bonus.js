(function(){
const B=window.BONUS,pg=document.body.dataset.bonus,root=document.getElementById('app');
const $=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!==undefined)e.innerHTML=h;return e};
const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(_){return null}};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const NAMES={treasure:['Treasure Hunt','🗺️'],memory:['Memory Match','🃏'],mistake:['Spot the Mistake','🔍']};
document.getElementById('h1').textContent='Unit '+B.unit+': '+B.title;
document.getElementById('gname').textContent=NAMES[pg][1]+' '+NAMES[pg][0];
const bar=$('div','bbar');
bar.innerHTML='<a href="index.html">← Mission Map</a>'+Object.keys(NAMES).map(k=>'<a href="'+(k==='treasure'?'treasure':k==='memory'?'memory':'mistake')+'.html"'+(k===pg?' class="on"':'')+'>'+NAMES[k][1]+' '+NAMES[k][0]+'</a>').join('');
root.before(bar);
const nm=document.getElementById('nm');nm.value=ls('t4name')||ls('t5name')||'';nm.oninput=()=>ls('t4name',nm.value);
function finish(line,key,best){
  const c=$('div','bcard bdone');const name=()=>(nm.value||'').trim()||'Student';
  const txt=()=>'Hello Miss Eman! '+name()+' finished '+NAMES[pg][0]+' (Year 4 Unit '+B.unit+' '+B.title+'): '+line+'.';
  c.innerHTML='<div class="chest">🏆</div><h3>Well done!</h3><p>'+esc(line)+'</p>';
  const a=$('a','bwa','Send my result to Miss Eman (WhatsApp)');a.target='_blank';a.rel='noopener';
  const upd=()=>{a.href='https://wa.me/201026794126?text='+encodeURIComponent(txt())};upd();nm.addEventListener('input',upd);
  const r=$('button','bbtn','Play again');r.onclick=()=>location.reload();
  c.append(a,r);root.append(c);c.scrollIntoView({behavior:'smooth'});
  ls('b'+B.unit+pg,key);
}
if(pg==='treasure'){
  const Q=B.T.map(t=>{const o=t[1].map((x,i)=>({x,ok:i===t[2]}));return{q:t[0],o:sh(o),why:t[3]}});
  let i=0,tries=0,keys=0;
  const path=$('div','path');Q.forEach((_,k)=>path.append($('div','stn','📍')));
  const box=$('div','bcard');root.append(path,box);
  const mark=()=>[...path.children].forEach((e,k)=>{e.className='stn'+(k<i?' done':k===i?' cur':'');e.textContent=k<i?'🔑':k===i?'📍':'❔'});
  function show(){mark();if(i>=Q.length){box.remove();finish('collected all 8 keys with '+tries+' wrong '+(tries===1?'try':'tries'),tries);return}
    const q=Q[i];box.innerHTML='<div class="sub">Station '+(i+1)+' of 8 · Keys: '+keys+' 🔑</div><div class="bq">'+esc(q.q)+'</div>';
    const g=$('div','bopts'),fb=$('div','bfb');
    q.o.forEach(o=>{const b=$('button','',esc(o.x));b.onclick=()=>{if(o.ok){b.className='ok';fb.className='bfb g';fb.textContent='Correct! You found a key. 🔑 '+q.why;keys++;[...g.children].forEach(x=>x.disabled=true);const n=$('button','bbtn pri',i<7?'Next station →':'Open the treasure!');n.onclick=()=>{i++;show()};box.append(n)}else{b.className='no';b.disabled=true;tries++;fb.className='bfb b';fb.textContent='Not this one. Think again and try another answer.'}};g.append(b)});
    box.append(g,fb)}
  show();
}
if(pg==='memory'){
  const cards=sh(B.M.flatMap((m,k)=>[{k,t:m[0],s:'f'},{k,t:m[1],s:'a'}]));
  let first=null,lock=false,moves=0,found=0;
  const info=$('div','sub','Moves: 0 · Pairs: 0 / 8'),grid=$('div','mgrid');root.append(info,grid);
  cards.forEach(c=>{const b=$('button','mc','?');b.type='button';c.el=b;b.onclick=()=>{if(lock||b.classList.contains('up')||b.classList.contains('got'))return;b.className='mc up';b.textContent=c.t;
    if(!first){first=c;return}
    moves++;const f=first;first=null;
    if(f.k===c.k&&f.s!==c.s){f.el.className=b.className='mc got';found++;info.textContent='Moves: '+moves+' · Pairs: '+found+' / 8';if(found===8)setTimeout(()=>finish('matched all 8 pairs in '+moves+' moves',moves),400)}
    else{lock=true;info.textContent='Moves: '+moves+' · Pairs: '+found+' / 8';setTimeout(()=>{f.el.className=b.className='mc';f.el.textContent=b.textContent='?';lock=false},900)}};grid.append(b)});
}
if(pg==='mistake'){
  const L=sh(B.S);const FACE=['👦','👧','🧒','👩','🧑','👨','👧🏽','🧒🏽'];
  let i=0,right=0;const box=$('div','bcard');root.append(box);
  function show(){if(i>=L.length){box.remove();finish('spotted '+right+' out of 8 correctly',right);return}
    const s=L[i];box.innerHTML='<div class="sub">Question '+(i+1)+' of 8 · Score: '+right+'</div><div class="say"><div class="face">'+FACE[i%8]+'</div><div><b>'+s[0]+' says:</b><div class="bubble">“'+esc(s[1])+'”</div></div></div><div class="bq" style="margin-top:12px">Is '+s[0]+' correct?</div>';
    const yn=$('div','yn'),fb=$('div','bfb');
    const a=$('button','bbtn','✔ Correct'),b=$('button','bbtn','✘ Mistake');
    const ans=ok=>{[a,b].forEach(x=>x.disabled=true);const good=(ok===!!s[2]);if(good)right++;(ok?a:b).classList.add(good?'ok':'no');
      fb.className='bfb '+(good?'g':'b');
      fb.textContent=(good?'Yes! ':'Not quite. ')+(s[2]?s[0]+' is correct.':s[0]+' made a mistake. '+s[3]);
      const n=$('button','bbtn pri',i<7?'Next →':'Finish');n.onclick=()=>{i++;show()};box.append(n)};
    a.onclick=()=>ans(true);b.onclick=()=>ans(false);yn.append(a,b);box.append(yn,fb)}
  show();
}
})();
