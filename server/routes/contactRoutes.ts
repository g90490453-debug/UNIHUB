import { Router } from 'express';
import { isValidEmail, sanitizeString } from '../middleware/validate.ts';
import { ContactMessage } from '../models/index.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 100);
    const email = sanitizeString(req.body.email, 150).toLowerCase();
    const university = sanitizeString(req.body.university || '', 120);
    const category = sanitizeString(req.body.category || 'general', 40);
    const message = sanitizeString(req.body.message, 1000);

    if (!name || !isValidEmail(email) || !message) {
      return res.status(400).json({ error: 'Please provide your name, a valid email address, and a message.' });
    }

    const entry = await ContactMessage.create({ name, email, university, category, message });
    res.status(201).json({
      entry,
      message: 'Your inquiry has been logged. Our academic support team responds within 24 business hours.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
