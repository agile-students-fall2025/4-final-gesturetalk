import mongoose from "mongoose";

const MeetingRoomchema = new mongoose.Schema(
  {
    meetingName: { type: String, required: true },
    meetingCode: { type: String, required: true, unique: true },
  },

  { timestamps: true },

);

const MeetingRoom = mongoose.model("MeetingRoom", MeetingRoomchema);
export default MeetingRoom;


/* 
Potentially how the schemas for call history / translation log can look like:

const CallHistorySchema = new mongoose.Schema({
  meetingId: { type: String, required: true },
  meetingName: String,
  participants: [String], 
  startTime: Date,
  endTime: Date,
  duration: Number,
  createdBy: String,
});

const TranslationLogSchema = new mongoose.Schema({
  meetingId: { type: String, required: true },
  senderId: String,
  text: String,
  timestamp: Date,
});

*/