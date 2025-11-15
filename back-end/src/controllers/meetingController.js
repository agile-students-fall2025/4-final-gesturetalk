import { getIO } from "../socket/index.js"

export const getMeetingInfo = (req, res) => {
    const { meetingId } = req.params

    console.log('reached get meeting info')
    console.log(`Meeting ID: ${meetingId}`)

    // find meeting in DB
    const mockMeetings = {
        "abc123": { meetingId: "room123", meetingName: "Meeting 1", peers: [] },
        "xyz999": { meetingId: "room999", meetingName: "Egg and Cheese Sandwich", peers: [] }
    };

    const meeting = mockMeetings[meetingId];
    console.log(meeting)
    if (!meeting) {
        return res.status(404).json({
            ok: false,
            error: "Meeting not found"
        });
    }

    // Return the mock data
    return res.json({
        ok: true,
        meetingId: meeting.meetingId,
        meetingName: meeting.meetingName,
        peers: meeting.peers
    });
}

export const endMeeting = (req, res) => {
    const meetingId = req.params.meetingId
    const peerId = req.body.peerId // current signed in user
    // find meeting in DB
    // get peers
    // check which peer click end meeting
    // in DB remove specific peer if many in meeting
    // vvvv put below in try catch and in if 
    res.json({ success: true, message: `Removed peer ${peerId} from ${meetingId}` })
    // if peer last in meeting, delete entire meeting from DB
    res.json({ success: true, message: `Ended entire meeting ${meetingId}` })
}

// gets translation from database
export const sendTranslation = (req, res) => {
    const meetingId = req.params.meetingId;
    // current implementation polls new translations, would ideally like to automatically 
    // emit new translations when new translation comes in
    // ^^ will need to implement after Thursday
    const newTranslation = "new translation here" // get newest translation from DB (await)
    const io = getIO();
    io.to(meetingId).emit("newest-translation", newTranslation);
    res.json({success: true});
}