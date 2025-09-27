const socket = io();

let myNumber;
let peerConnection;
let localStream;
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

const myNumberDisplay = document.getElementById('my-number');
const callInput = document.getElementById('call-number');
const callButton = document.getElementById('call-btn');
const statusText = document.getElementById('status');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch(err => {
    alert("Error accessing webcam/mic: " + err.message);
  });

socket.on('your-number', number => {
  myNumber = number;
  myNumberDisplay.textContent = number;
});

callButton.onclick = async () => {
  const target = callInput.value.trim();
  if (!target) return alert("Enter a number to call.");

  peerConnection = createPeerConnection();

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('call-user', {
    to: target,
    from: myNumber,
    offer: offer
  });

  statusText.textContent = "Calling...";
};

socket.on('incoming-call', async ({ from, offer }) => {
  const accept = confirm(`📞 Incoming call from ${from}. Accept?`);
  if (!accept) return;

  peerConnection = createPeerConnection();

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer-call', {
    to: from,
    answer: answer
  });

  statusText.textContent = "In call...";
});

socket.on('call-answered', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  statusText.textContent = "In call...";
});

socket.on('user-not-found', () => {
  alert("❌ Number not found or offline.");
  statusText.textContent = "Idle";
});

function createPeerConnection() {
  const pc = new RTCPeerConnection(config);

  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = event => {
    // Optional: send ICE candidates (not required in many simple LAN/NAT cases)
  };

  return pc;
}
