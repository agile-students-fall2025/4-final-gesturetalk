import mockTranslationLogs from "../data/mockTranslationLogs.js";
import mockCallHistory from "../data/mockCallHistory.js";
import {TranslationLog, TranslationMessage} from "../models/TranslationLog.js";

export const getTranslationLog = async (req, res) => {
  // fetch mock data
  // update in sprint 4
  try {
    // for unit testing -> delete later when not using mock data
    if (req.forceError) {
      throw new Error("Forced test error");
    }

    // uncomment this for sprint 4
    const { meetingId } = req.params;

    // update in sprint 4
    // fetch data with userId
    /*
        const TranslationLogs =  await TranslationLogs.find({
            meetingId: meetingId
        }).sort({ timestamp: 1 });
        */
    // find meetingName
    const meeting = mockCallHistory.find((m) => m.meetingId === meetingId);
    if (!meeting) {
      return res.status(404).json({ ok: false, error: "Meeting not found" });
    }

    const userTranslationLogs = mockTranslationLogs;

    res.status(200).json({
      ok: true,
      translationLogs: userTranslationLogs,
      meetingName: meeting.meetingName,
    });

    console.log("getTranslationLog sucess");
  } catch (err) {
    console.error("getTranslationLog error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
};

export async function saveTranslationLog({ meetingId, user, message })  {
  if (!meetingId) {
    throw new Error("Meeting ID is required");
  }

  // find existing translation log
  const existing = await TranslationLog.findOne({ meetingId });
  if (existing) {
    // append message if provided
    if (message) {
      existing.messageLog = existing.messageLog || [];
      existing.messageLog.push({ user, message });
      await existing.save();
    }
    return existing;
  }

  // if no existing log but a message is provided, create with that message
  if (message) {
    return TranslationLog.create({
      meetingId,
      messageLog: [message],
    });
  }
  return TranslationLog.create({
    meetingId,
    messageLog: [],
  });
}
