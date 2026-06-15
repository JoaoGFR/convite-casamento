const crypto = require('crypto');

let redisInstance = null;

module.exports = async function handler(req, res) {
  const { method } = req;

  try {
    if (!redisInstance) {
      const Redis = require('ioredis');
      const REDIS_URL = process.env.convites_REDIS_URL || process.env.REDIS_URL || "redis://default:2IQCWMcbasrkTP0jK0JpfWjIQj3OdMXk@jam-famous-birds-37964.db.redis.io:15473";
      redisInstance = new Redis(REDIS_URL);
      
      // Catch connection errors so they don't crash the process
      redisInstance.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }
    
    const redis = redisInstance;
    if (method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Get specific invite
        const inviteStr = await redis.get(`invite:${id}`);
        if (!inviteStr) {
          return res.status(404).json({ error: 'Convite não encontrado' });
        }
        return res.status(200).json(JSON.parse(inviteStr));
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
        const results = await pipeline.exec();
        
        // results is an array of [error, result] for each pipeline command in ioredis
        const invites = results.map(([err, val]) => {
          if (err || !val) return null;
          try {
            return JSON.parse(val);
          } catch(e) {
            return null;
          }
        }).filter(Boolean);
        
        return res.status(200).json(invites);
      }
    } 
    
    else if (method === 'POST') {
      // Create new invite (Admin)
      const { familyName, guests } = req.body;
      
      if (!familyName || !guests || !Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const id = crypto.randomUUID();
      
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

      await redis.set(`invite:${id}`, JSON.stringify(newInvite));
      await redis.sadd('invites_list', id);

      return res.status(201).json(newInvite);
    }
    
    else if (method === 'PUT') {
      // Update guest status (Guest)
      const { id, guestId, status } = req.body;
      
      if (!id || guestId === undefined || !status) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const inviteStr = await redis.get(`invite:${id}`);
      if (!inviteStr) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      const invite = JSON.parse(inviteStr);

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

      await redis.set(`invite:${id}`, JSON.stringify(invite));

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
