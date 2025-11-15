import User from '../models/User.js';

// POST /api/auth/signup
export const signUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    // Create new user (password hashed automatically by schema pre-save hook)
    const user = new User({ email, password, name: name || '' });
    await user.save();

    // Return user info (without password)
    const userObj = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    res.status(201).json({ ok: true, user: userObj });
  } catch (err) {
    console.error('signUp error:', err);
    res.status(500).json({ ok: false, error: 'Server error during signup' });
  }
};

// POST /api/auth/signin
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Return user info (without password)
    const userObj = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    res.json({ ok: true, user: userObj });
  } catch (err) {
    console.error('signIn error:', err);
    res.status(500).json({ ok: false, error: 'Server error during signin' });
  }
};
