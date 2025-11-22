import mongoose from "mongoose";


const TranslationLogSchema = new mongoose.Schema({
  meetingId: { type: String, required: true },  
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });


const TranslationLog = mongoose.model("TranslationLog", TranslationLogSchema);
export default TranslationLog;