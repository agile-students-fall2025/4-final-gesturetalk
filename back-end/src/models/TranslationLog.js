import mongoose from "mongoose";

const TranslationLogSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  messages: [{ 
    user: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


const TranslationLog = mongoose.model("TranslationLog", TranslationLogSchema);
export default TranslationLog;