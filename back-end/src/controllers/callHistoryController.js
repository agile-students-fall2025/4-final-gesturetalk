// import mockCallHistory from "../data/mockCallHistory.js";
import User from "../models/User.js";
import MeetingRoom from "../models/MeetingRoom.js";

export const getCallHistory = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    
    // for unit testing -> delete later when not using mock data
    if (req.forceError) {
      throw new Error("Forced test error");
    }

    // uncomment this in sprint 4
    const userId = req.user._id
    

    // fetch data with userId
    const user = await User.findById(userId);
    // const userCallHistory = mockCallHistory;

    // find meeting codes array
    const meetingCodes = user.meetings;

    const meetingList = await MeetingRoom.find({
      meetingCode: { $in: meetingCodes }
    }).select("meetingName meetingCode");


    res.status(200).json({
      ok: true,
      meetings: meetingList.map(m => ({
        meetingId: m.meetingCode,
        meetingName: m.meetingName
      }))
    });

    console.log("getCallHistory sucess");
    
  } catch (err) {
    console.error("getCallHistory error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
};
