const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the start of the grid (line 468) and the end of the physical gifts section
const startStr = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">';
const endStr = '<div class="text-center mb-16">\r\n                <h2 class="font-script text-6xl text-[#b59345] mb-2">Lista de Presentes</h2>';

const startIndex = html.indexOf(startStr);
const endIndex = html.indexOf('<div class="text-center mb-16">', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `<div id="physical-gifts-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <div class="text-center w-full col-span-full py-12">
                <i class="fa-solid fa-spinner fa-spin text-3xl text-[#dcb873]"></i>
                <p class="mt-4 text-[#8a7653]">Carregando presentes...</p>
            </div>
        </div>
    </div>\n\n            `;
    
    html = html.substring(0, startIndex) + replacement + html.substring(endIndex);
}

// 2. Add Modal and Javascript
const modalAndJS = `
    <!-- Modal Presente -->
    <div id="gift-modal" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-serif text-2xl text-[#b59345]">Confirmar Presente</h3>
                <button onclick="closeGiftModal()" class="text-neutral-400 hover:text-red-500 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            
            <div class="mb-6">
                <p class="text-[#8a7653] text-sm mb-2">Você está escolhendo presentear:</p>
                <div class="font-semibold text-lg text-[#6d5b45]" id="modal-gift-name"></div>
            </div>

            <form id="gift-form" onsubmit="submitGiftClaim(event)">
                <input type="hidden" id="modal-gift-id">
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-[#b59345] uppercase tracking-wider mb-2">Seu Nome Completo</label>
                        <input type="text" id="gift-guest-name" required class="w-full border-b-2 border-[#f5efe6] focus:border-[#dcb873] py-2 px-1 outline-none text-[#8a7653] transition" placeholder="Ex: João da Silva">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-[#b59345] uppercase tracking-wider mb-2">Seu Telefone (WhatsApp)</label>
                        <input type="tel" id="gift-guest-phone" required class="w-full border-b-2 border-[#f5efe6] focus:border-[#dcb873] py-2 px-1 outline-none text-[#8a7653] transition" placeholder="Ex: (11) 99999-9999">
                    </div>
                </div>

                <div class="mt-8">
                    <button type="submit" id="btn-confirm-gift" class="w-full bg-[#dcb873] hover:bg-[#b59345] text-white py-4 rounded-full font-sans uppercase text-xs font-bold tracking-widest shadow-md transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-gift"></i> Confirmar Presente
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Lógica dos Presentes Físicos
        const categoryIcons = {
            'Cozinha': 'fa-fire-burner',
            'Quarto': 'fa-bed',
            'Sala': 'fa-couch',
            'Banheiro': 'fa-bath',
            'Mesa e Servir': 'fa-plate-wheat',
            'Lavanderia & Extras': 'fa-box-open'
        };

        async function loadGifts() {
            const container = document.getElementById('physical-gifts-container');
            try {
                const response = await fetch('/api/gifts');
                const gifts = await response.json();
                
                // Group by category
                const grouped = {};
                gifts.forEach(g => {
                    if(!grouped[g.category]) grouped[g.category] = [];
                    grouped[g.category].push(g);
                });

                let html = '';
                for (const cat in grouped) {
                    const icon = categoryIcons[cat] || 'fa-gift';
                    html += \`
                    <div class="bg-white p-6 rounded-2xl border border-[#dcb873]/20 shadow-sm hover:shadow-md transition group">
                        <div class="flex items-center gap-3 mb-4 border-b border-[#dcb873]/10 pb-3">
                            <div class="w-10 h-10 bg-[#f5efe6] rounded-full flex items-center justify-center text-[#b59345] group-hover:scale-110 transition-transform">
                                <i class="fa-solid \${icon}"></i>
                            </div>
                            <h4 class="font-serif text-xl text-[#b59345]">\${cat}</h4>
                        </div>
                        <ul class="space-y-3 font-medium">\`;
                    
                    grouped[cat].forEach(item => {
                        if (item.claimed) {
                            html += \`
                            <li class="flex items-center justify-between gap-2 p-2 rounded bg-neutral-50 border border-neutral-100 opacity-60">
                                <span class="text-neutral-500 text-sm line-through decoration-neutral-300">\${item.name}</span>
                                <span class="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1"><i class="fa-solid fa-lock"></i> Escolhido</span>
                            </li>\`;
                        } else {
                            html += \`
                            <li class="flex items-center justify-between gap-2 p-2 rounded hover:bg-[#fcfaf5] transition border border-transparent hover:border-[#dcb873]/30">
                                <span class="text-[#8a7653] text-sm">\${item.name}</span>
                                <button onclick="openGiftModal('\${item.id}', '\${item.name}')" class="text-[10px] uppercase font-bold text-white bg-[#dcb873] hover:bg-[#b59345] px-3 py-1.5 rounded-full transition shadow-sm">Escolher</button>
                            </li>\`;
                        }
                    });

                    html += \`</ul></div>\`;
                }

                container.innerHTML = html;
            } catch(e) {
                console.error(e);
                container.innerHTML = '<div class="col-span-full text-center text-red-500 py-8">Erro ao carregar os presentes.</div>';
            }
        }

        function openGiftModal(id, name) {
            document.getElementById('modal-gift-id').value = id;
            document.getElementById('modal-gift-name').innerText = name;
            document.getElementById('gift-modal').classList.remove('hidden');
        }

        function closeGiftModal() {
            document.getElementById('gift-modal').classList.add('hidden');
            document.getElementById('gift-form').reset();
        }

        async function submitGiftClaim(event) {
            event.preventDefault();
            const btn = document.getElementById('btn-confirm-gift');
            const originalText = btn.innerHTML;
            
            const id = document.getElementById('modal-gift-id').value;
            const name = document.getElementById('gift-guest-name').value;
            const phone = document.getElementById('gift-guest-phone').value;

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirmando...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/gifts', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'claim', id: id, guestName: name, guestPhone: phone })
                });

                if (response.ok) {
                    closeGiftModal();
                    alert('Presente confirmado com sucesso! Muito obrigado(a)!');
                    loadGifts();
                } else {
                    const err = await response.json();
                    alert(err.error || 'Erro ao confirmar presente.');
                }
            } catch(e) {
                console.error(e);
                alert('Erro na conexão.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadGifts();
        });
    </script>
</body>`;

html = html.replace('</body>', modalAndJS);

fs.writeFileSync('index.html', html);
console.log('Update successful');
