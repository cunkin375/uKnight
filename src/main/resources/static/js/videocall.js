const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "AUTH_DOMAIN",
    projectId: "PROJECT_ID",
    storageBucket: "STORAGE_BUCKET",
    messagingSenderId: "MESSAGING_SENDER_ID",
    appId: "APP_ID",
    measurementId: "MEASUREMENT_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

// webrtc configuration
const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ],
    iceCandidatePoolSize: 10,
};

// global state
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// html elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const meetingIdDisplay = document.getElementById('meetingIdDisplay');
const cameraBtn = document.getElementById('cameraBtn');
const micBtn = document.getElementById('micBtn');
const hangupBtn = document.getElementById('hangupBtn');

// get meeting id from url
const urlParams = new URLSearchParams(window.location.search);
const meetingId = urlParams.get('meetingId');

async function startWebCam() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    // push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    localVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

    // enable buttons
    cameraBtn.disabled = false;
    micBtn.disabled = false;
    hangupBtn.disabled = false;
}

async function createOffer() {
    if (!meetingId) {
        alert("Meeting ID missing!");
        return;
    }

    const callDoc = firestore.collection('calls').doc(meetingId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    meetingIdDisplay.innerText = meetingId;

    pc.onicecandidate = (event) => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });
}

async function startAnswer() {
    if (!meetingId) {
        alert("Meeting ID missing!");
        return;
    }

    const callDoc = firestore.collection('calls').doc(meetingId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    meetingIdDisplay.innerText = meetingId;

    pc.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    if (!callData) {
        alert("Meeting not found!");
        window.location.href = '/';
        return;
    }

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });
}

async function init() {
    await startWebCam();

    const mode = urlParams.get('mode');

    if (mode === 'create') {
        createOffer();
    } else if (mode === 'join') {
        startAnswer();
    } else {
        console.error("No mode specified");
    }
}

cameraBtn.addEventListener('click', () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    cameraBtn.classList.toggle('active');
    cameraBtn.querySelector('i').classList.toggle('fa-video-camera');
    cameraBtn.querySelector('i').classList.toggle('fa-video-camera-slash');
});

micBtn.addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    micBtn.classList.toggle('active');
    micBtn.querySelector('i').classList.toggle('fa-microphone');
    micBtn.querySelector('i').classList.toggle('fa-microphone-slash');
});

hangupBtn.addEventListener('click', () => {
    // stop tracks
    localStream.getTracks().forEach(track => track.stop());
    pc.close();
    window.location.href = '/';
});

init();
