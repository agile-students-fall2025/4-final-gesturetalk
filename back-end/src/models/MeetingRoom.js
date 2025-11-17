import mongoose from 'mongoose';

const MeetingRoomchema = new mongoose.Schema(
  {
    meetingName: { type: String, required: true},
    meetingCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const MeetingRoom = mongoose.model('MeetingRoom', MeetingRoomchema);
export default MeetingRoom;


