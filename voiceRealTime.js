let dataChannel = null;
let peerConnection = null;

async function sessionUpdate(instructions) {
  if (!dataChannel) {
    console.error("No data channel found");
    return;
  }

  // voiceRealTime.js:18 Uncaught (in promise) InvalidStateError: Failed to execute 'send' on 'RTCDataChannel': RTCDataChannel.readyState is not 'open'
  if (dataChannel.readyState !== "open") {
    console.error("Data channel is not open");
    dataChannel.addEventListener("open", () => {
      sessionUpdate(instructions);
    });
    return;
  }

  const event = {
    type: "session.update",
    session: {
      instructions
    },
  };
  
  // WebRTC data channel and WebSocket both have .send()
  dataChannel.send(JSON.stringify(event));
}

async function startSession() {
  // Create a peer connection
  const pc = new RTCPeerConnection();

  // Set up to play remote audio from the model
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  pc.ontrack = e => audioEl.srcObject = e.streams[0];

  // Add local audio track for microphone input in the browser
  const ms = await navigator.mediaDevices.getUserMedia({
    audio: true
  });
  pc.addTrack(ms.getTracks()[0]);

  // Set up data channel for sending and receiving events
  const dc = pc.createDataChannel("oai-events");
  dataChannel = dc;

  dc.addEventListener("message", async (e) => {
    const realtimeEvent = JSON.parse(e.data);
    console.log(realtimeEvent);
    sendMessageToCurrentWindow("realtimeEvent", realtimeEvent);
  });

  // Start the session using the Session Description Protocol (SDP)
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${await storageUtil.get('openaiApiKey')}`,
      "Content-Type": "application/sdp"
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };

  try {
    await pc.setRemoteDescription(answer);
  } catch (error) {
    sendMessageToCurrentWindow("realtimeVoiceSessionSetupError", error);
    console.error("Error setting remote description:", error);
  }
  peerConnection = pc;

  return pc;
}

function stopSession() {
  if (dataChannel) {
    dataChannel.close();
  }

  peerConnection.getSenders().forEach((sender) => {
    if (sender.track) {
      sender.track.stop();
    }
  });

  if (peerConnection) {
    peerConnection.close();
  }

  dataChannel = null;
  peerConnection = null;
}

/* server side
const apiKey = process.env.OPENAI_API_KEY;
async function getEphemeralKey(apiKey) {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
        }),
      },
    );
 
    const data = await response.json();
    return data.client_secret.value;
  } catch (error) {
    console.error("Token generation error:", error);
    return null;
  }
}
*/