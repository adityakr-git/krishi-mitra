import { Router, Request, Response } from 'express';
import { db, DBToken } from '../db';
import { calculateWaitTime } from '../utils/waitTime';
import { io } from '../index';

export const tokensRouter = Router();

/**
 * POST /api/tokens/create
 * Generates a new Token in the database, updates the Mandi queue,
 * and emits real-time updates.
 */
tokensRouter.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      userId, 
      mandiId, 
      cropType, 
      cropVariety, 
      quantityQuintals, 
      expectedTimeSlot 
    } = req.body;

    if (!userId || !mandiId || !cropType || !quantityQuintals) {
      res.status(400).json({ error: 'Missing required token creation parameters' });
      return;
    }

    const mandi = db.getMandi(mandiId);
    if (!mandi) {
      res.status(404).json({ error: 'Selected Mandi Center not found' });
      return;
    }

    const tokenNum = Math.floor(150 + Math.random() * 850);
    const tokenId = `A-${tokenNum}`;
    const newPos = mandi.currentQueueLength + 1;
    const waitTime = calculateWaitTime(mandiId);

    const newToken: DBToken = {
      id: tokenId,
      qrHash: `KM-26032:${tokenId}:${userId}:${quantityQuintals}QTL:${cropType}`,
      userId,
      mandiId,
      cropType,
      cropVariety: cropVariety || 'Standard',
      quantityQuintals: Number(quantityQuintals),
      status: 'SCHEDULED',
      queuePosition: newPos,
      expectedTimeSlot: expectedTimeSlot || '11:00 AM - 12:00 PM',
      estimatedWaitMinutes: waitTime,
      createdAt: new Date().toISOString()
    };

    db.createToken(newToken);

    // Also initialize linked Payment in PENDING state
    const mspRate = cropType.includes('Mustard') ? 5650 : cropType.includes('Gram') ? 5440 : 2275;
    const gross = Number(quantityQuintals) * mspRate;

    // Broadcast new queue status to Mandi room
    if (io) {
      io.to(`mandi:${mandiId}`).emit('queue_updated', {
        mandiId,
        currentQueueLength: mandi.currentQueueLength,
        estimatedWaitMinutes: calculateWaitTime(mandiId),
        event: 'TOKEN_CREATED',
        tokenId
      });
    }

    res.status(201).json({
      success: true,
      token: newToken,
      paymentSummary: {
        mspRate,
        grossAmount: gross,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Internal Server Error during token generation' });
  }
});

/**
 * GET /api/tokens/:id
 */
tokensRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const token = db.getToken(req.params.id);
  if (!token) {
    res.status(404).json({ error: 'Token not found' });
    return;
  }
  const payment = db.getPayment(token.id);
  res.json({ token, payment });
});
