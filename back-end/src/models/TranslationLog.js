import mongoose from "mongoose";

const TranslationLogSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  messageLog: [{ type: mongoose.Schema.Types.ObjectId, ref: "TranslationMessage" }],
}, { timestamps: true });

const TranslationMessageSchema = new mongoose.Schema({
    translationLogId: { type: mongoose.Schema.Types.ObjectId, ref: "TranslationLog", required: true },
    user: { type: String, required: true }, 
    message: { type: String, required: true },
    }, { timestamps: true });

const TranslationLog = mongoose.model("TranslationLog", TranslationLogSchema);
const TranslationMessage = mongoose.model("TranslationMessage", TranslationMessageSchema);

export { TranslationLog, TranslationMessage };