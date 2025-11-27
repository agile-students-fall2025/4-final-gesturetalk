// import mockTranslationLogs from "../data/mockTranslationLogs.js";
// import mockCallHistory from "../data/mockCallHistory.js";
import TranslationLog from "../models/TranslationLog.js";
import MeetingRoom from "../models/MeetingRoom.js";

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
    const meeting = await MeetingRoom.findOne({ meetingCode: meetingId });
    if (!meeting) {
      return res.status(404).json({ ok: false, error: "Meeting not found" });
    }

    // const userTranslationLogs = mockTranslationLogs;
    const userTranslationLogs = await TranslationLog.find({ meetingId }).sort({ createdAt: 1 });
    if (!userTranslationLogs) {
      return res.status(404).json({ ok: false, error: "Translation logs not found" });
    }

    res.status(200).json({
      ok: true,
      // sorted translation logs
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
  let log = await TranslationLog.findOne({ meetingId });
  
  // if not found, create new log
  if (!log) {
    log = await TranslationLog.create({
      meetingId,
      messages: []
    });
  }
  // add new message
  if (message) {
    log.messages.push({
      user,
      message,
      timestamp: new Date()
    });
    await log.save();
  }
  
  return log;

}
