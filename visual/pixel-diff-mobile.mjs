import { chromium } from 'playwright';
const EXE=process.env.GOTAB_CHROMIUM||'/home/lyxy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const W=375,H=812;
const shot=async(url,wait)=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:W,height:H}});await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(wait);const buf=await p.screenshot({type:'png'});await b.close();return buf.toString('base64');};
const a=await shot('https://tab.kfkf.asia/',7000);
const b=await shot('http://127.0.0.1:8799/',5000);
const B=await chromium.launch({executablePath:EXE});const p=await B.newPage();
await p.setContent(`<canvas width="${W}" height="${H}"></canvas>`,{waitUntil:'load'});
const r=await p.evaluate(async([aa,bb])=>{
  const load=s=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=s;});
  const [ia,ib]=await Promise.all([load('data:image/png;base64,'+aa),load('data:image/png;base64,'+bb)]);
  const cv=document.querySelector('canvas');const ctx=cv.getContext('2d');
  ctx.drawImage(ia,0,0);const A=ctx.getImageData(0,0,375,812).data;
  ctx.drawImage(ib,0,0);const B=ctx.getImageData(0,0,375,812).data;
  const tol=24;let diff=0;const grid=Array.from({length:6},()=>Array(3).fill(0));
  for(let y=0;y<812;y+=2)for(let x=0;x<375;x+=2){const i=(y*375+x)*4;const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);if(d>tol*3){diff++;grid[Math.min(5,Math.floor(y/135))][Math.min(2,Math.floor(x/125))]++;}}
  return {pct:(100*diff/((812/2)*(375/2))).toFixed(2),grid:grid.map(r=>r.map(c=>(100*c/((135/2)*(125/2))).toFixed(1)))};
},[a,b]);
await B.close();
console.log('移动端(375×812) 整体差异: '+r.pct+'%');
console.log('分块(行6×列3):');
r.grid.forEach((row,i)=>console.log('  '+i+': '+row.join(' ')));
