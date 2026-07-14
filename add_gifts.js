const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const itemsCozinha = [
    'Geladeira',
    'Mesa de jantar',
    'Batedeira',
    'Chaleira elétrica',
    'Panela elétrica de arroz',
    'Multi processador',
    'Balcão de cozinha',
    'Assadeiras',
    'Garrafa térmica',
    'Tábua de carne',
    'Kit sobremesa'
];

const itemsQuarto = [
    'Travesseiros',
    'Cobre leito Queen',
    'Jogo de cama queen'
];

const itemsSala = [
    'Rack para televisão',
    'Tapete para sala',
    'Ventilador'
];

const itemsBanheiro = [
    'Jogo de Tapete banheiro'
];

const itemsLavanderia = [
    'Aspirador de pó',
    'Ferro de passar'
];

function buildLi(item) {
    return `                    <li class="flex items-start gap-2"><i
                            class="fa-solid fa-check text-[#dcb873] mt-[3px] text-[10px]"></i> ${item}</li>\n`;
}

function appendToSection(htmlContent, sectionName, items) {
    const regex = new RegExp(`(<h4 class="font-serif text-xl text-\\[#b59345\\]">${sectionName}<\\/h4>[\\s\\S]*?)(<\\/ul>)`);
    const newItemsHtml = items.map(buildLi).join('');
    return htmlContent.replace(regex, `$1${newItemsHtml}$2`);
}

html = appendToSection(html, 'Cozinha', itemsCozinha);
html = appendToSection(html, 'Quarto', itemsQuarto);
html = appendToSection(html, 'Sala', itemsSala);
html = appendToSection(html, 'Banheiro', itemsBanheiro);
html = appendToSection(html, 'Lavanderia & Extras', itemsLavanderia);

fs.writeFileSync('index.html', html);
console.log('Done');
