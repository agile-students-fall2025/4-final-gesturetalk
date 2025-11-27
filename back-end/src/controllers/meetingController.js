import MeetingRoom from "../models/MeetingRoom.js";
import User from "../models/User.js";

export const createMeetingRoom = async (req, res) => {
  const { meetingName, meetingCode } = req.body;
  if (!meetingName || !meetingCode) {
    return res.status(400).json({ ok: false, error: "Missing data" });
  }
  try {
    const exists = await MeetingRoom.findOne({ meetingCode });
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, error: "Meeting code already exists" });
    }

    const newMeeting = await MeetingRoom.create({ meetingName, meetingCode });

    // add meeting to current user's meetings array
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { meetings: meetingCode } },
        { new: true }
      );
    }
    console.log("meeting added to user for create Meeting Room")

    return res.status(201).json({ ok: true, meeting: newMeeting });

  } catch (err) {
    console.error("Meeting creation error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

export const joinMeetingRoom = async (req, res) => {
  const { meetingCode } = req.params;

  try {
    // check if meeting exist
    const meeting = await MeetingRoom.findOne({ meetingCode });

    if (!meeting) {
      // meeting dne
      return res.status(404).json({ ok: false, error: "Meeting not found" });
    }

    // add meeting to user data
    const userId = req.user._id; 
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { meetings: meetingCode } }, // prevents duplicates
      { new: true }
    );

    return res.status(200).json({ ok: true, meeting });

  } catch (err) {
    console.error("Join meeting error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
