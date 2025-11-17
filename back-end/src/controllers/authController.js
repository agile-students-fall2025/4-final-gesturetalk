import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured in environment');
  }
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export const signUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ ok: false, error: 'Email already registered' });

    const user = new User({ email, password, name: name || '' });
    await user.save();

    const token = signToken(user);

    res.status(201).json({
      ok: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
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

    const token = signToken(user);
    
    res.json({
      ok: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error('signIn error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};


export const googleSignIn = async (req, res) => {
  try {
    const { googleToken } = req.body;
    if (!googleToken) {
      return res.status(400).json({ ok: false, error: "Missing Google token" });
    }

    const payload = JSON.parse(
      Buffer.from(googleToken.split(".")[1], "base64").toString()
    );

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        password: Math.random().toString(36).substring(2, 15), // placeholder password for Google users
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      token
    });

  } catch (err) {
    console.error("googleSignIn error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
