const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const htmlToInsert = `
        <!-- Presentes Escolhidos -->
        <div class="lg:col-span-3 mt-4">
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-semibold">Presentes Escolhidos</h2>
                    <button onclick="loadClaimedGifts()" class="text-sm text-gray-500 hover:text-[#dcb873]">
                        <i class="fa-solid fa-rotate-right mr-1"></i> Atualizar
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr class="border-b border-gray-200 text-sm text-gray-500">
                                <th class="pb-3 font-medium">Presente</th>
                                <th class="pb-3 font-medium">Categoria</th>
                                <th class="pb-3 font-medium">Escolhido por</th>
                                <th class="pb-3 font-medium">Telefone</th>
                                <th class="pb-3 font-medium">Data</th>
                                <th class="pb-3 font-medium text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="gifts-list">
                            <tr>
                                <td colspan="6" class="py-8 text-center text-gray-400">
                                    <i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando presentes...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
`;

html = html.replace('    </main>', htmlToInsert + '\n    </main>');

const jsToInsert = `
        document.addEventListener('DOMContentLoaded', loadClaimedGifts);

        async function loadClaimedGifts() {
            const listEl = document.getElementById('gifts-list');
            try {
                const response = await fetch('/api/gifts');
                const gifts = await response.json();
                
                const claimedGifts = gifts.filter(g => g.claimed);
                
                if (claimedGifts.length === 0) {
                    listEl.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">Nenhum presente foi escolhido ainda.</td></tr>';
                    return;
                }

                let html = '';
                claimedGifts.forEach(gift => {
                    const date = new Date(gift.claimedAt).toLocaleString('pt-BR');
                    html += \`
                        <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                            <td class="py-3 px-2 font-medium text-[#8a7653]">\${gift.name}</td>
                            <td class="py-3 px-2 text-sm text-gray-500">\${gift.category}</td>
                            <td class="py-3 px-2 text-sm text-gray-700 font-semibold">\${gift.claimedBy}</td>
                            <td class="py-3 px-2 text-sm text-gray-600">\${gift.phone || '-'}</td>
                            <td class="py-3 px-2 text-xs text-gray-400">\${date}</td>
                            <td class="py-3 px-2 text-right">
                                <button onclick="unclaimGift('\${gift.id}')" class="text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition">
                                    Desmarcar
                                </button>
                            </td>
                        </tr>
                    \`;
                });
                listEl.innerHTML = html;
            } catch (error) {
                console.error(error);
                listEl.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-red-500">Erro ao carregar presentes.</td></tr>';
            }
        }

        async function unclaimGift(giftId) {
            if(!confirm('Tem certeza que deseja desmarcar este presente? Ele voltará a ficar disponível no site principal.')) return;
            
            try {
                const response = await fetch('/api/gifts', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'unclaim', id: giftId })
                });

                if (response.ok) {
                    loadClaimedGifts();
                } else {
                    alert('Erro ao desmarcar presente.');
                }
            } catch(e) {
                console.error(e);
                alert('Erro na conexão.');
            }
        }
`;

html = html.replace('</script>', jsToInsert + '\n    </script>');

fs.writeFileSync('admin.html', html);
console.log('Update admin successful');
