import { Router, Request, Response } from 'express';
import { db } from '../db';
import { calculateWaitTime } from '../utils/waitTime';
import { io } from '../index';

export const queueRouter = Router();

/**
 * GET /api/queue/:mandiId
 * Returns the live queue state, active scales, and dynamically calculated wait time.
 */
queueRouter.get('/:mandiId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mandiId } = req.params;
    const mandi = db.getMandi(mandiId);

    if (!mandi) {
      res.status(404).json({ error: 'Mandi Center not found' });
      return;
    }

    const waitTime = calculateWaitTime(mandiId);
    const tokens = db.getTokensByMandi(mandiId);

    res.json({
      mandiId,
      mandiName: mandi.name,
      currentQueueLength: mandi.currentQueueLength,
      activeWeighbridges: mandi.activeWeighbridges,
      estimatedWaitMinutes: waitTime,
      tokens
    });
  } catch (error) {
    console.error('Queue lookup error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PUT /api/queue/next
 * Triggered when Officer clicks "Call Next Farmer":
 * 1. Updates database token positions
 * 2. Recalculates wait time via calculateWaitTime(mandi_id)
 * 3. Emits 'queue_updated' socket event to the mandi room
 */
queueRouter.put('/next', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mandiId } = req.body;

    if (!mandiId) {
      res.status(400).json({ error: 'mandiId is required' });
      return;
    }

    const mandi = db.getMandi(mandiId);
    if (!mandi) {
      res.status(404).json({ error: 'Mandi Center not found' });
      return;
    }

    // Advance queue in database
    const result = db.advanceQueue(mandiId);
    const updatedWaitTime = calculateWaitTime(mandiId);

    // Broadcast WebSocket event to all connected clients in this Mandi room
    if (io) {
      io.to(`mandi:${mandiId}`).emit('queue_updated', {
        mandiId,
        calledTokenId: result.calledToken?.id,
        currentQueueLength: result.newQueueLength,
        estimatedWaitMinutes: updatedWaitTime,
        updatedTokens: result.updatedTokens,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      calledToken: result.calledToken,
      currentQueueLength: result.newQueueLength,
      estimatedWaitMinutes: updatedWaitTime
    });
  } catch (error) {
    console.error('Call Next queue error:', error);
    res.status(500).json({ error: 'Internal Server Error during queue advancement' });
  }
});

/**
 * PUT /api/queue/status
 * Updates a token's status (ARRIVED, QUALITY_CHECK, WEIGHING, COMPLETED)
 */
queueRouter.put('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId, status, moisture, grade, netQuintals } = req.body;

    if (!tokenId || !status) {
      res.status(400).json({ error: 'tokenId and status are required' });
      return;
    }

    const token = db.getToken(tokenId);
    if (!token) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    db.updateTokenStatus(tokenId, status);

    if (status === 'COMPLETED') {
      const dbtRef = `DBT-2026-${Math.floor(10000 + Math.random() * 90000)}-HR`;
      db.updatePaymentStatus(tokenId, 'CREDITED', dbtRef);
    }

    const mandiId = token.mandiId;
    const waitTime = calculateWaitTime(mandiId);

    if (io) {
      io.to(`mandi:${mandiId}`).emit('token_status_changed', {
        tokenId,
        status,
        mandiId,
        estimatedWaitMinutes: waitTime
      });
    }

    res.json({ success: true, token: db.getToken(tokenId) });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
