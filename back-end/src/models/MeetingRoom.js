import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const meetingRoomSchema = new mongoose.Schema(
  {
    meetingName: { type: String, required: true, unique: true},
    meetingCode: { type: String, required: true },
  },
  { timestamps: true }
);

meetingRoomSchema.pre('save', async function (next) {
  if (!this.isModified('meetingCode')) return next();
});

const MeetingRoom = mongoose.model('MeetingRoom', meetingRoomSchema);
export default MeetingRoom;
