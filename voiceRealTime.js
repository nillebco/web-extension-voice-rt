let dataChannel = null;
let peerConnection = null;

async function _sendInstructions(instructions) {
  const event = {
    type: "session.update",
    session: {
      instructions
    },
  };

  // WebRTC data channel and WebSocket both have .send()
  dataChannel.send(JSON.stringify(event));
}

async function sessionUpdate(instructions) {
  if (!dataChannel) {
    console.error("No data channel found");
    return;
  }

  // voiceRealTime.js:18 Uncaught (in promise) InvalidStateError: Failed to execute 'send' on 'RTCDataChannel': RTCDataChannel.readyState is not 'open'
  if (dataChannel.readyState !== "open") {
    console.log(`Data channel is not open but rather ${dataChannel.readyState}`);
    dataChannel.addEventListener("open", () => {
      sessionUpdate(instructions);
    });
    return;
  }

  if (dataChannel.readyState === "open") {
    _sendInstructions(instructions);
  }
}

async function startSession() {
  console.log("Starting realtime voice session with OpenAI");
  
  // Log API key validity (without exposing the key)
  const apiKey = await storageUtil.get('openaiApiKey');
  console.log(`API key available: ${!!apiKey && apiKey.length > 20}`);
  
  // Create a peer connection with STUN servers and add multiple TURN servers
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add multiple free TURN servers for better connectivity
      {
        urls: 'turn:global.turn.twilio.com:3478?transport=udp',
        username: 'f4b4035eaa76f77e3ffae85f5f6a17d02b66a4c48beee32ba12168c6e8febed3',
        credential: 'w1WpDzeY9/yY3wh6YGUevMi7euPqeJRb+9H1J7yvDYY='
      },
      {
        urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
        username: 'f4b4035eaa76f77e3ffae85f5f6a17d02b66a4c48beee32ba12168c6e8febed3',
        credential: 'w1WpDzeY9/yY3wh6YGUevMi7euPqeJRb+9H1J7yvDYY='
      }
    ],
    iceCandidatePoolSize: 10
  });

  // Set up to play remote audio from the model
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  pc.ontrack = e => audioEl.srcObject = e.streams[0];

  // Add local audio track for microphone input in the browser
  const ms = await navigator.mediaDevices.getUserMedia({
    audio: true
  });
  pc.addTrack(ms.getTracks()[0]);

  pc.oniceconnectionstatechange = () => {
    console.log(`ICE connection state: ${pc.iceConnectionState}`);
  };

  pc.onconnectionstatechange = () => {
    console.log(`Connection state: ${pc.connectionState}`);
    if (pc.connectionState == 'failed') {
      sendDocumentMessage("realtimeVoiceSessionSetupError", "Connection failed");
    }
  };

  pc.onsignalingstatechange = () => {
    console.log(`Signaling state: ${pc.signalingState}`);
  };

  pc.onicegatheringstatechange = () => {
    console.log(`ICE gathering state: ${pc.iceGatheringState}`);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("New ICE candidate:", event.candidate);
    } else {
      console.log("ICE gathering complete");
    }
  };

  // Add timeout for connection establishment
  let connectionEstablished = false;
  const connectionTimeout = setTimeout(() => {
    if (!connectionEstablished) {
      console.error("Connection timed out - unable to connect to OpenAI servers");
      sendDocumentMessage("realtimeVoiceSessionSetupError", 
        "Connection timeout - check network firewall settings or try a different network");
      stopSession(); // Clean up resources
    }
  }, 20000); // 20 second timeout

  // Clear timeout if connection succeeds
  pc.addEventListener('connectionstatechange', () => {
    if (pc.connectionState === 'connected') {
      connectionEstablished = true;
      clearTimeout(connectionTimeout);
      console.log("WebRTC connection successfully established!");
    }
  });

  // Set up data channel with reliability options
  const dc = pc.createDataChannel("oai-events", {
    ordered: true,       // Guarantee message order
    maxRetransmits: 30   // Retry sending messages up to 30 times
  });
  dataChannel = dc;

  dc.onopen = () => {
    console.log("Data channel is now open");
    sendDocumentMessage("dataChannelOpen");
  };

  dc.onclose = () => {
    console.log("Data channel closed");
  };

  dc.onerror = (error) => {
    console.error("Data channel error:", error);
  };

  dc.addEventListener("message", async (e) => {
    const realtimeEvent = JSON.parse(e.data);
    console.log(realtimeEvent);
    sendDocumentMessage("realtimeEvent", realtimeEvent);
  });

  // Start the session using the Session Description Protocol (SDP)
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: false
  });
  await pc.setLocalDescription(offer);

  // Wait for ICE gathering to complete or timeout after 5 seconds
  await Promise.race([
    new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        pc.addEventListener('icegatheringstatechange', () => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          }
        });
      }
    }),
    new Promise(resolve => setTimeout(resolve, 5000))
  ]);
  
  console.log("Sending offer to OpenAI with ICE candidates");
  
  // Modify the API request to include more diagnostic info
  const baseUrl = "https://api.openai.com/v1/realtime";
  const url = new URL(baseUrl);
  const model = "gpt-4o-realtime-preview-2024-12-17";
  const voice = await storageUtil.get('selectedVoice') ?? "coral";
  url.searchParams.set('model', model);
  url.searchParams.set('voice', voice);
  
  console.log(`Sending request to: ${url.toString()} with model: ${model}, voice: ${voice}`);
  
  try {
    const sdpResponse = await fetch(url, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      },
    });
    
    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error(`API response error: ${sdpResponse.status}`, errorText);
      sendDocumentMessage("realtimeVoiceSessionSetupError", 
        `API error: ${sdpResponse.status} - ${errorText}`);
      return null;
    }
    
    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };

    await pc.setRemoteDescription(answer);
  } catch (error) {
    console.error("API fetch error:", error);
    sendDocumentMessage("realtimeVoiceSessionSetupError", 
      `API error: ${error.message}`);
    return null;
  }
  peerConnection = pc;

  return pc;
}

function stopSession() {
  if (dataChannel) {
    dataChannel.close();
  }

  if (peerConnection) {
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

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