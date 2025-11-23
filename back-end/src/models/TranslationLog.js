import mongoose from "mongoose";

const TranslationLogSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String },
  sentence: { type: String, required: true }, 
  signedWords: [{ type: String }], 
}, { timestamps: true });

const TranslationLog = mongoose.model("TranslationLog", TranslationLogSchema);
export default TranslationLog;