import { body, param, validationResult } from "express-validator";

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

// Auth validators
export const signUpValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters")
    .escape(),
  validate,
];

export const signInValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").trim().notEmpty().withMessage("Password is required"),
  validate,
];

export const googleSignInValidation = [
  body("googleToken").trim().notEmpty().withMessage("Google token is required"),
  validate,
];

export const updatePasswordValidation = [
  body("userId").trim().notEmpty().withMessage("User ID is required"),
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Old password is required"),
  body("newPassword")
    .trim()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  validate,
];

// Profile validators
export const uploadProfilePictureValidation = [
  body("userId").trim().notEmpty().withMessage("User ID is required"),
  validate,
];

// Meeting validators
export const createMeetingValidation = [
  body("meetingName")
    .trim()
    .notEmpty()
    .withMessage("Meeting name is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Meeting name must be between 1 and 200 characters")
    .escape(),
  body("meetingCode")
    .trim()
    .notEmpty()
    .withMessage("Meeting code is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Meeting code must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Meeting code can only contain letters, numbers, hyphens, and underscores"),
  validate,
];

export const joinMeetingValidation = [
  param("meetingCode")
    .trim()
    .notEmpty()
    .withMessage("Meeting code is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Meeting code must be between 3 and 50 characters"),
  validate,
];

// Translation validators
export const translateValidation = [
  body("signedWords")
    .isArray({ min: 1 })
    .withMessage("Signed words must be a non-empty array"),
  body("signedWords.*")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each signed word must be between 1 and 100 characters")
    .escape(),
  body("meetingId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Meeting ID must be valid"),
  body("userName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("User name must be between 1 and 100 characters")
    .escape(),
  validate,
];

// Translation log validators
export const getTranslationLogValidation = [
  param("meetingId")
    .trim()
    .notEmpty()
    .withMessage("Meeting ID is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Meeting ID must be valid"),
  validate,
];
