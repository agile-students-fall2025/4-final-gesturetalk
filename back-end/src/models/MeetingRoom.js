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
  meetingName: { type: String, required: true }, 
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });


