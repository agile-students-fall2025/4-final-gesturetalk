
exports.getMeetingInfo = (req, res) => {
    const meetId = req.params.meetingId

    console.log(`Meeting ID: ${meetId}`)
    // find meeting in DB
    const meetName = "Name from DB"
    const peers = [] // from DB
    // add new peer into meeting & save to DB
    res.json({meetingId, meetingName: meetName, peers: peers})
}

exports.endMeeting = (req, res) => {
    const meetId = req.params.meetingId
    const peerId = req.body.peerId // current signed in user
    // find meeting in DB
    // get peers
    // check which peer click end meeting
    // in DB remove specific peer if many in meeting
    // vvvv put below in try catch and in if 
    res.json({ success: true, message: `Removed peer ${peerId} from ${meetId}` })
    // if peer last in meeting, delete entire meeting from DB
    res.json({ success: true, message: `Ended entire meeting ${meetId}` })
}

// gets translation from database
exports.getTranslation = (req, res) => {

}