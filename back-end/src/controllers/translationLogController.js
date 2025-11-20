import { mockTranslationLogs } from "../data/mockTranslationLogs.js"
import { mockCallHistory } from "../data/mockCallHistory.js"

export const getTranslationLog = async (req, res) => {
    // fetch mock data
    // update in sprint 4
    try {
        // uncomment this for sprint 4
        const { meetingId } = req.params;

        // update in sprint 4
        // fetch data with userId
        /*
        const TranslationLogs =  await TranslationLogs.find({
            meetingId: meetingId
        }).sort({ timestamp: 1 });
        */
       // find meetingName
        const meeting = mockCallHistory.find(m => m.meetingId === meetingId);
        if (!meeting) {
            return res.status(404).json({ ok: false, error: "Meeting not found" });
        }

        const userTranslationLogs = mockTranslationLogs;

        res.json({
            ok: true,
            translationLogs: userTranslationLogs,
            meetingName : meeting.meetingName
        })

       console.log("getTranslationLog sucess")

    } catch (err) {
        console.error("getTranslationLog error:", err);
        res.status(500).json({
            ok: false,
            error: "Server error"
        });

    }
};
