import mongoose from "mongoose";

const MeetingRoomSchema = new mongoose.Schema(
  {
    meetingName: { type: String, required: true },
    meetingCode: { type: String, required: true, unique: true },

    // number of people currently in the room
    participantCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // track *who* is in the room
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // if participantCount == 0, you can delete this room in your logic
  },
  { timestamps: true },
);

const MeetingRoom = mongoose.model("MeetingRoom", MeetingRoomSchema);
export default MeetingRoom;

