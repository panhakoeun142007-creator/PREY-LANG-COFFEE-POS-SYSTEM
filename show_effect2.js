const fs=require('fs');
const lines=fs.readFileSync('frontend/src/pages/CustomerMenuApp.jsx','utf-8').split(/\r?\n/);
for(let i=360;i<440;i++){
  if(i<lines.length) console.log(`${i+1}: ${lines[i]}`);
}
