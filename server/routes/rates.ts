import { Router, Request, Response } from 'express';
import { db } from '../db';
import { io } from '../index';

export const ratesRouter = Router();

// Standard Government Minimum Support Prices (MSP) Reference
export const GOVT_MSP_TABLE: Record<string, number> = {
  'Wheat (Sharbati)': 2275,
  'Wheat (Kanak)': 2275,
  'Mustard (Sarson)': 5650,
  'Gram (Chana)': 5440,
  'Barley (Jau)': 1850,
  'Paddy (Dhan)': 2300
};

/**
 * GET /api/rates
 * Returns crop rates (optionally filtered by mandiId)
 */
ratesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const mandiId = req.query.mandiId as string | undefined;
    const rates = db.getCropRates(mandiId);
    res.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching crop rates:', error);
    res.status(500).json({ error: 'Internal Server Error fetching rates' });
  }
});

/**
 * PUT /api/rates/update
 * Admin/Officer updates today's local mandi rate for a crop
 * Validates that localMandiRate is NOT below the Government MSP
 */
ratesRouter.put('/update', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mandiId, cropName, localMandiRate } = req.body;

    if (!mandiId || !cropName || localMandiRate === undefined) {
      res.status(400).json({ error: 'mandiId, cropName, and localMandiRate are required' });
      return;
    }

    const rateInt = Math.round(Number(localMandiRate));
    if (isNaN(rateInt) || rateInt <= 0) {
      res.status(400).json({ error: 'localMandiRate must be a positive number' });
      return;
    }

    // Determine Government MSP for this crop
    let govtMsp = GOVT_MSP_TABLE[cropName];
    if (!govtMsp) {
      const existing = db.getCropRates(mandiId).find(r => r.cropName === cropName);
      govtMsp = existing?.governmentMsp || 2275;
    }

    // Strict Validation: Local rate CANNOT be below Government MSP
    if (rateInt < govtMsp) {
      res.status(400).json({
        error: `Validation Error: Local rate (₹${rateInt}) cannot be below the Government Minimum Support Price (₹${govtMsp}).`,
        code: 'RATE_BELOW_MSP',
        governmentMsp: govtMsp
      });
      return;
    }

    // Update in database
    const updated = db.updateCropRate(mandiId, cropName, rateInt);

    if (!updated) {
      res.status(500).json({ error: 'Failed to update rate in database' });
      return;
    }

    const allRates = db.getCropRates();

    // Broadcast WebSocket event to all connected farmers & dashboards
    if (io) {
      io.emit('rate_updated', {
        mandiId,
        cropName,
        localMandiRate: rateInt,
        governmentMsp: govtMsp,
        updatedAt: updated.updatedAt,
        allRates
      });
      console.log(`[Socket.io] Broadcasted rate_updated: ${cropName} @ ${mandiId} -> ₹${rateInt}`);
    }

    res.json({
      success: true,
      message: `Successfully updated ${cropName} rate to ₹${rateInt}`,
      rate: updated
    });
  } catch (error) {
    console.error('Error updating crop rate:', error);
    res.status(500).json({ error: 'Internal Server Error updating rate' });
  }
});
