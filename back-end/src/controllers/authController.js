import User from '../models/User.js';

export const signUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ ok: false, error: 'Email already registered' });

    const user = new User({ email, password, name: name || '' });
    await user.save();

    res.status(201).json({ ok: true, user: { id: user._id.toString(), email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    console.error('signUp error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

    res.json({ ok: true, user: { id: user._id.toString(), email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    console.error('signIn error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
