import User from "../models/User.js";

// Helper to find user by ID or email (for Google OAuth users)
const findUserByIdOrEmail = async (userId) => {
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    // If userId is not a valid ObjectId, try finding by email
    if (userId.includes("@") || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findOne({ email: userId });
    } else {
      throw err;
    }
  }
  return user;
};

export const updateProfile = async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId required" });
    }

    const user = await findUserByIdOrEmail(userId);

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Update name if provided
    if (name !== undefined) {
      user.name = name;
    }

    await user.save();

    res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("updateProfile error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId required" });
    }

    // Construct full picture URL (include server URL for browser to access)
    const serverUrl = process.env.SERVER_URL || "http://138.197.83.95:5001";
    const pictureUrl = `${serverUrl}/uploads/profiles/${req.file.filename}`;

    // Try to find user by MongoDB ObjectId first (for DB-created users)
    // If that fails, try by email (for Google OAuth users)
    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { picture: pictureUrl },
        { new: true },
      );
    } catch (err) {
      // If userId is not a valid ObjectId, try finding by email
      // (for Google OAuth users, userId is the email)
      if (userId.includes("@") || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findOneAndUpdate(
          { email: userId },
          { picture: pictureUrl },
          { new: true },
        );
      } else {
        throw err;
      }
    }

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("uploadProfilePicture error", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
