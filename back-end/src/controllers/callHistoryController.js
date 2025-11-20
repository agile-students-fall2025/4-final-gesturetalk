import { mockCallHistory } from "../data/mockCallHistory.js"

export const getCallHistory = async (req, res) => {
    try {

        // for unit testing -> delete later when not using mock data
        if (req.forceError) {
            throw new Error("Forced test error");
        }
        
        // uncomment this in sprint 4
        // const userId = req.user.id

        // update in sprint 4
        // fetch data with userId
        /*
        const userCallHistory =  await CallHistory.find({
            participants: userId
        }).sort({ startTime: -1 });
        */
        const userCallHistory = mockCallHistory;

        res.status(200).json({
            ok: true,
            meetings: userCallHistory
        })

        console.log("getCallHistory sucess")

    } catch (err) {
        console.error("getCallHistory error:", err);
        res.status(500).json({ 
            ok: false,
            error: "Server error" 
        });
    }
};
