const baseURL = "http://localhost:3000";

// send post req to server to create meeting
export const createMeeting = async (meetingName, meetingCode) => {
    const res = await fetch(`${baseURL}/create-meeting`, {
        method: "POST",
        headers: {
            "Contend-Type": "application/json",
        },
        body: JSON.stringify({
            meetingName,
            meetingCode,
        }),
    });

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
};

// send post req to server to see if meeting exists in DB
// if yes server returns "ok: true"
export const joinMeeting = async (meetingName, meetingCode) => {
  const res = await fetch(`${baseURL}/join-meeting`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
        meetingName,
        meetingCode,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};