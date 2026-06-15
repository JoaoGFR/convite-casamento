const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  const { method } = req;

  try {
    // Inicializamos aqui dentro para garantir que as variáveis de ambiente foram carregadas
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.error('As variáveis de ambiente do banco de dados não estão definidas.');
      return res.status(500).json({ 
        error: 'Erro de configuração do banco de dados. Certifique-se de que o KV está linkado e o projeto foi redeployed.' 
      });
    }

    const redis = new Redis({ url, token });

    if (method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Get specific invite
        const invite = await redis.get(`invite:${id}`);
        if (!invite) {
          return res.status(404).json({ error: 'Convite não encontrado' });
        }
        return res.status(200).json(invite);
      } else {
        // Get all invites (Admin)
        const inviteIds = await redis.smembers('invites_list');
        
        if (!inviteIds || inviteIds.length === 0) {
          return res.status(200).json([]);
        }
        
        const pipeline = redis.pipeline();
        inviteIds.forEach(id => {
          pipeline.get(`invite:${id}`);
        });
        const invites = await pipeline.exec();
        
        return res.status(200).json(invites.filter(Boolean));
      }
    } 
    
    else if (method === 'POST') {
      // Create new invite (Admin)
      const { familyName, guests } = req.body;
      
      if (!familyName || !guests || !Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const id = uuidv4();
      
      const formattedGuests = guests.map((name, index) => ({
        id: index.toString(),
        name: name,
        status: 'pending' // pending, confirmed, declined
      }));

      const newInvite = {
        id,
        familyName,
        guests: formattedGuests,
        createdAt: new Date().toISOString()
      };

      await redis.set(`invite:${id}`, newInvite);
      await redis.sadd('invites_list', id);

      return res.status(201).json(newInvite);
    }
    
    else if (method === 'PUT') {
      // Update guest status (Guest)
      const { id, guestId, status } = req.body;
      
      if (!id || guestId === undefined || !status) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const invite = await redis.get(`invite:${id}`);
      if (!invite) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      let updated = false;
      invite.guests = invite.guests.map(guest => {
        if (guest.id === guestId) {
          guest.status = status;
          updated = true;
        }
        return guest;
      });

      if (!updated) {
        return res.status(404).json({ error: 'Convidado não encontrado' });
      }

      await redis.set(`invite:${id}`, invite);

      return res.status(200).json(invite);
    } 
    
    else if (method === 'DELETE') {
      // Delete an invite (Admin)
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      
      await redis.del(`invite:${id}`);
      await redis.srem('invites_list', id);
      
      return res.status(200).json({ success: true });
    }

    else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
}
