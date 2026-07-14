const crypto = require('crypto');

let redisInstance = null;

// The default gift catalog to seed the database if it's empty
const defaultGifts = [
  // Cozinha
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Geladeira', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Mesa de jantar', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Batedeira', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Chaleira elétrica', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Panela elétrica de arroz', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Multi processador', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Balcão de cozinha', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Assadeiras', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Garrafa térmica', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Tábua de carne', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Kit sobremesa', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Jogo de panelas', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Panela de pressão', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Frigideira', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Conj. de utensílios de cozinha', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Jogo de talheres', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Aparelho de jantar', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Potes organizadores', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Escorredor de louça', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Jarra', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Jogo de facas', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Porta-temperos', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Air fryer', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Micro-ondas', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Liquidificador', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Sanduicheira ou grill', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Cafeteira', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Mixer', claimed: false },
  { id: crypto.randomUUID(), category: 'Cozinha', name: 'Faqueiro', claimed: false },

  // Quarto
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Travesseiros', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Cobre leito Quenn', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Jogo de lençol queen', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Jogo de cama', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Edredom ou colcha', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Protetor de colchão', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Protetor de travesseiro', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Organizadores', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Mantas', claimed: false },
  { id: crypto.randomUUID(), category: 'Quarto', name: 'Sapateira', claimed: false },

  // Sala
  { id: crypto.randomUUID(), category: 'Sala', name: 'Rack para televisão', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Tapete para sala', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Ventilador', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Almofadas', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Manta para sofá', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Tapete', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Cortinas', claimed: false },
  { id: crypto.randomUUID(), category: 'Sala', name: 'Luminária ou abajur', claimed: false },

  // Banheiro
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Jogo de Tapete banheiro', claimed: false },
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Jogo de toalhas', claimed: false },
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Tapete de banheiro', claimed: false },
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Lixeira', claimed: false },
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Kit acessórios banheiro', claimed: false },
  { id: crypto.randomUUID(), category: 'Banheiro', name: 'Cesto de roupas', claimed: false },

  // Mesa e Servir
  { id: crypto.randomUUID(), category: 'Mesa e Servir', name: 'Jogo americano', claimed: false },
  { id: crypto.randomUUID(), category: 'Mesa e Servir', name: 'Toalha de mesa', claimed: false },
  { id: crypto.randomUUID(), category: 'Mesa e Servir', name: 'Suqueira', claimed: false },

  // Lavanderia & Extras
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Aspirador de pó', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Ferro de passar', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Cesto organizador', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Organizadores multiuso', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Varal', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Caixa organizadora', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'Relógio de parede', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'robô aspirador', claimed: false },
  { id: crypto.randomUUID(), category: 'Lavanderia & Extras', name: 'MOP de limpeza', claimed: false }
];

module.exports = async function handler(req, res) {
  const { method } = req;

  try {
    if (!redisInstance) {
      const Redis = require('ioredis');
      const REDIS_URL = process.env.convites_REDIS_URL || process.env.REDIS_URL || "redis://default:2IQCWMcbasrkTP0jK0JpfWjIQj3OdMXk@jam-famous-birds-37964.db.redis.io:15473";
      redisInstance = new Redis(REDIS_URL);

      redisInstance.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }

    const redis = redisInstance;

    if (method === 'GET') {
      let giftsStr = await redis.get('gifts_catalog');

      if (!giftsStr) {
        // Seed initial catalog
        await redis.set('gifts_catalog', JSON.stringify(defaultGifts));
        return res.status(200).json(defaultGifts);
      }

      return res.status(200).json(JSON.parse(giftsStr));
    }

    if (method === 'POST') {
      const { action, id, guestName, guestPhone } = req.body;

      let giftsStr = await redis.get('gifts_catalog');
      let gifts = giftsStr ? JSON.parse(giftsStr) : defaultGifts;

      const giftIndex = gifts.findIndex(g => g.id === id);
      if (giftIndex === -1) {
        return res.status(404).json({ error: 'Presente não encontrado' });
      }

      if (action === 'claim') {
        if (gifts[giftIndex].claimed) {
          return res.status(400).json({ error: 'Presente já foi escolhido por outra pessoa.' });
        }

        gifts[giftIndex].claimed = true;
        gifts[giftIndex].claimedBy = guestName;
        gifts[giftIndex].phone = guestPhone;
        gifts[giftIndex].claimedAt = new Date().toISOString();

        await redis.set('gifts_catalog', JSON.stringify(gifts));
        return res.status(200).json(gifts);
      }

      if (action === 'unclaim') {
        gifts[giftIndex].claimed = false;
        delete gifts[giftIndex].claimedBy;
        delete gifts[giftIndex].phone;
        delete gifts[giftIndex].claimedAt;

        await redis.set('gifts_catalog', JSON.stringify(gifts));
        return res.status(200).json(gifts);
      }

      return res.status(400).json({ error: 'Ação inválida' });
    }

    // Method Not Allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
