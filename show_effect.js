const fs=require('fs');
const lines=fs.readFileSync('frontend/src/pages/CustomerMenuApp.jsx','utf-8').split(/\r?\n/);
for(let i=300;i<360;i++){
  if(i<lines.length) console.log(`${i+1}: ${lines[i]}`);
}
