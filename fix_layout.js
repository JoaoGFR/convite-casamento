const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove ESTÂNCIA RICAL - LINHA KM 11
html = html.replace('ESTÂNCIA RICAL - LINHA KM 11', '');

// 2. Extract the Physical Gifts block
const startIndex = html.indexOf('<!-- Lista de Presentes Físicos -->');
const endIndex = html.indexOf('<!-- 3. LISTA DE PRESENTES -->');

if (startIndex !== -1 && endIndex !== -1) {
    let physicalBlock = html.substring(startIndex, endIndex);
    
    // Clean up the stray closing tags from the physical block that the user left
    // The physical block ends with:
    //     </div>
    // 
    //     </div>
    //     </section>
    
    // We only need the valid part of the physical block. Let's extract until the first </div>\n    </div>\n    </div>
    // Actually, a simple way is to match exactly what we need.
    const validBlockRegex = /(<!-- Lista de Presentes Físicos -->[\s\S]*?<!-- Lavanderia e Extras -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;
    const match = physicalBlock.match(validBlockRegex);
    
    if (match) {
        let cleanPhysicalBlock = match[1];
        
        // Remove the top border and margin because it will be at the top now
        cleanPhysicalBlock = cleanPhysicalBlock.replace('class="mt-24 pt-16 border-t border-[#dcb873]/30"', 'class="mb-24 pb-16 border-b border-[#dcb873]/30"');
        
        // Remove the original broken block from HTML
        html = html.substring(0, startIndex) + html.substring(endIndex);
        
        // Now find the start of the `presentes` section to insert the block
        // <div class="max-w-6xl mx-auto px-6">
        const targetPointRegex = /(<section id="presentes"[^>]*>\s*<div class="max-w-6xl mx-auto px-6">)/;
        html = html.replace(targetPointRegex, `$1\n\n            ${cleanPhysicalBlock}\n`);
        
        fs.writeFileSync('index.html', html);
        console.log("Success");
    } else {
        console.log("Failed to match valid physical block.");
    }
} else {
    console.log("Could not find start or end index.");
}
