// back-end/src/controllers/translationLogController.js
import TranslationLog from "../models/TranslationLog.js";
import MeetingRoom from "../models/MeetingRoom.js";

/**
 * GET /api/translation/:meetingId
 *
 * Expect :meetingId to be the meetingCode used to join the room.
 * Returns flattened messages + meetingName.
 */
export const getTranslationLog = async (req, res) => {
  try {
    // for unit testing -> delete later when not using mock data
    if (req.forceError) {
      throw new Error("Forced test error");
    }

    const { meetingId } = req.params; // this is the meetingCode

    // 1) Find meeting by meetingCode so we can return meetingName
    const meeting = await MeetingRoom.findOne({ meetingCode: meetingId });
    if (!meeting) {
      return res.status(404).json({ ok: false, error: "Meeting not found" });
    }

    // 2) Find translation logs stored under that same meetingCode
    const userTranslationLogs = await TranslationLog.findOne({ meetingId });
    if (!userTranslationLogs) {
      return res
        .status(404)
        .json({ ok: false, error: "Translation logs not found" });
    }

    const flattened = userTranslationLogs.messages.map((m) => ({
      _id: m._id,
      user: m.user,
      message: m.message,
      timestamp: m.timestamp,
    }));

    res.status(200).json({
      ok: true,
      translationLogs: flattened,
      meetingName: meeting.meetingName,
    });

    console.log("getTranslationLog success");
  } catch (err) {
    console.error("getTranslationLog error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
};

/**
 * Internal helper used by your WebRTC / transcription logic.
 *
 * You can safely call this with EITHER:
 *  - meetingId = meetingCode (e.g., "ABC123"), OR
 *  - meetingId = Mongo _id of MeetingRoom (e.g., "671eab...").
 *
 * It will normalize everything so TranslationLog.meetingId
 * always stores the meetingCode string, which matches the URL param.
 */
export async function saveTranslationLog({ meetingId, user, message }) {
  if (!meetingId) {
    throw new Error("Meeting ID is required");
  }

  // Normalize to meetingCode so fetch + save use the same key
  let meetingCode = meetingId;

  // Try to interpret meetingId as a MeetingRoom _id.
  // If that works, switch to using meeting.meetingCode.
  try {
    const meetingById = await MeetingRoom.findById(meetingId);
    if (meetingById) {
      meetingCode = meetingById.meetingCode;
    }
  } catch (e) {
    // If meetingId is not a valid ObjectId, this will throw — ignore and
    // assume meetingId was already a meetingCode string.
  }

  // Find existing translation log by normalized meetingCode
  let log = await TranslationLog.findOne({ meetingId: meetingCode });

  // If not found, create new log
  if (!log) {
    log = await TranslationLog.create({
      meetingId: meetingCode,
      messages: [],
    });
  }

  // Add new message if present
  if (message) {
    log.messages.push({
      user,
      message,
      timestamp: new Date(),
    });
    await log.save();
  }

  return log;
}
