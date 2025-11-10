
exports.createMeeting = (req, res) => {
    const data = {
        meetName: req.body.meetingName,
        meetCode: req.body.meetingCode
    }
    console.log(`Name: ${data.meetName}, Code: ${data.meetCode}`)

    // send data to database
    res.send(`Create meeting: ${data.meetName}`)
}

exports.joinMeeting = (req, res) => {
    const data = {
        meetCode: req.body.meetingCode
    }
    console.log(`Code: ${data.meetCode}`)

    // send to database here

    res.send(`Join meeting with code: ${data.meetCode}`)
}


