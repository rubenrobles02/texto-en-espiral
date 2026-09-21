// Extrae el decodificador de index.html para poder probarlo en Node sin duplicar código
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const src=js.slice(js.indexOf('function decFactory'), js.indexOf('const Dec=decFactory();'));
module.exports=new Function(src+'\nreturn decFactory();')();
