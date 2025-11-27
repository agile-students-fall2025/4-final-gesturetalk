import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  // ex: user wants to like a post
  // clicks like button -> middleware authenticates user (next) -> calls posts controller (likePost)

  try {
    // get the token
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        error: "No token provided",
      });
    }

    const token = header.split(" ")[1];

    // test: our own secret
    // replace this later with process.env.JWT_SECRET

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find user in database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ ok: false, error: "User not found" });
    }

    req.user = user;

    // pass it down to next
    return next();
  } catch (error) {
    console.log("Auth error:", error);
    return res.status(401).json({
      ok: false,
      error: "Invalid token",
    });
  }
};

export default auth;
