import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'

// Initialize Redis from Environment Variables (KV_REST_API_URL and KV_REST_API_TOKEN)
// These are automatically provided by Vercel when connecting an Upstash Redis or Vercel KV database.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  const { method } = req;

  try {
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
        // First get the list of all invite IDs
        const inviteIds = await redis.smembers('invites_list');
        
        if (!inviteIds || inviteIds.length === 0) {
          return res.status(200).json([]);
        }
        
        // Fetch all invites
        const pipeline = redis.pipeline();
        inviteIds.forEach(id => {
          pipeline.get(`invite:${id}`);
        });
        const invites = await pipeline.exec();
        
        // Filter out nulls in case of inconsistencies
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
      
      // Format guests
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

      // Save invite
      await redis.set(`invite:${id}`, newInvite);
      // Add to index list
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

      // Update the specific guest's status
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

      // Save updated invite
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
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}
