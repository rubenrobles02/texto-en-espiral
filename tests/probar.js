// Uso: node tests/probar.js [archivos .svg o .png]
const fs=require('fs'), path=require('path'); const Dec=require('./cargar.js'); const {PNG}=require('pngjs');
const files=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync(path.join(__dirname,'muestras')).map(f=>path.join(__dirname,'muestras',f));
for(const f of files){ const t0=Date.now(); let traces;
  if(f.endsWith('.svg')) traces=Dec.tracesFromSVG(fs.readFileSync(f,'utf8'));
  else { const p=PNG.sync.read(fs.readFileSync(f)); const sc=Math.min(1,1600/Math.max(p.width,p.height)); const W=Math.round(p.width*sc),H=Math.round(p.height*sc); const g=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(Math.min(p.height-1,Math.floor(y/sc))*p.width+Math.min(p.width-1,Math.floor(x/sc)))*4; g[y*W+x]=(p.data[i]*0.3+p.data[i+1]*0.59+p.data[i+2]*0.11)|0;}
    traces=Dec.tracesFromImage({width:W,height:H,gray:g}).traces.map(t=>t.pts); }
  const res=traces.map(t=>{const r=Dec.decodeTrace(t); return r?`"${r.text}" (corregidos ${r.fixed}/${Math.floor(r.nsym/2)})`:'NO LEÍDA';});
  console.log(path.basename(f).padEnd(24), res.join(' | '), `${Date.now()-t0} ms`); }
