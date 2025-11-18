import MeetingRoom from "../models/MeetingRoom.js";

export const createMeetingRoom = async (req, res) => {
    const { meetingName, meetingCode } = req.body;
  if (!meetingName || !meetingCode) {
      return res.status(400).json({ ok: false, error: "Missing data" });
  }
  try{ 
    const exists = await MeetingRoom.findOne({ meetingCode });
     if (exists) {
      return res.status(409).json({ ok: false, error: "Meeting code already exists" });
    }

    const newMeeting = await MeetingRoom.create({ meetingName, meetingCode });

    return res.status(201).json({ ok: true, meeting: newMeeting });
  } catch (err) {

    console.error("Meeting creation error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}

export const joinMeetingRoom = async (req, res) => {
    const { meetingCode } = req.params;

  try {
    // check if meeting exist
    const meeting = await MeetingRoom.findOne({ meetingCode });

    if (!meeting) {
      // meeting dne
      return res.status(404).json({ ok: false, error: "Meeting not found" });
    }

    return res.status(200).json({ ok: true, meeting });
  } catch (err) {
    console.error("Join meeting error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}



