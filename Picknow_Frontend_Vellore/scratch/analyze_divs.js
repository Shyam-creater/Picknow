
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\HAI\\Desktop\\picknow-web\\Picknow_Frontend_Vellore\\src\\components\\ProductPage\\ProductDetail.jsx', 'utf8');

let openDivs = 0;
let lines = content.split('\n');

lines.forEach((line, index) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    openDivs += opens - closes;
    if (index > 1580 && index < 1650) {
        console.log(`${index + 1}: [${openDivs}] ${line.trim()}`);
    }
});
