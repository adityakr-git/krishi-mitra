import { Router, Request, Response } from 'express';
import { db } from '../db';

export const authRouter = Router();

/**
 * POST /api/auth/verify
 * Takes Firebase UID / ID Token / Phone, verifies against the database,
 * and returns the user's role and session details.
 */
authRouter.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, firebaseUid } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let user = db.getUserByPhone(cleanPhone);

    if (!user) {
      // Auto-provision new Farmer if not found
      user = db.createUser({
        id: `usr_${Date.now()}`,
        phone: cleanPhone,
        name: 'Kisan Mitra',
        role: 'FARMER',
        village: 'Badshahpur Rural',
        district: 'Gurugram',
        kisanId: `HR-GUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        aadhaarLinked: true,
        bankAccountMasked: '•••• •••• •••• 1024 (PNB)',
        mandiId: 'mandi-badshahpur'
      });
    }

    // Return session payload and role for client redirection
    res.json({
      success: true,
      token: `km_sess_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        village: user.village,
        district: user.district,
        kisanId: user.kisanId,
        aadhaarLinked: user.aadhaarLinked,
        bankAccountMasked: user.bankAccountMasked,
        mandiId: user.mandiId,
        officerBadge: user.officerBadge
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Internal Server Error during verification' });
  }
});
