<h1 align="center">🎥 Peer-to-Peer Video Call App</h1>
<h3 align="center">Built with React · Node.js · WebRTC · coturn</h3>

<p align="center">
  <b>Deployed at:</b> <a href="https://vc.golu.codes" target="_blank">vc.golu.codes</a>  
  <br/>
  A simple and secure 1-to-1 video call app using WebRTC, Socket.IO signaling, and coturn for NAT traversal.
</p>

---

## 🚀 Overview

This project is a **real-time peer-to-peer video calling app** built using:

- ⚛️ **React (Vite)** for frontend
- 🟩 **Node.js + Socket.IO** for signaling
- 🌀 **WebRTC** for direct media connection
- ❄️ **coturn** for STUN/TURN relay
- 🐳 **Coolify + Caddy** for deployment (SSL & reverse proxy)
- ☁️ **Oracle Cloud (OCI VM)** as hosting platform

🔗 **Live App:** [https://vc.golu.codes](https://vc.golu.codes)

---

## 🧩 Features

✅ Peer-to-peer video & audio calls  
✅ Responsive UI (mobile + desktop)  
✅ Real-time signaling with Socket.IO  
✅ STUN/TURN for reliable NAT traversal  
✅ Custom ringtone support via env variable  
✅ Secure deployment with Caddy (HTTPS auto-cert)  
✅ Docker & Coolify ready setup  

---

## ⚙️ .env Configuration (Client)

Your `client/.env` file should look like this:

```bash
VITE_RINGTONE=/sounds/ringtone.mp3
VITE_SIGNALING_SERVER=https://vc.golu.codes
VITE_TURN_URL=turn:vc.golu.codes:3478
VITE_TURN_USERNAME=turnuser
VITE_TURN_PASSWORD=turnpassword
⚠️ Note: Never commit real TURN credentials publicly. Use environment variables in Coolify or .env.local for safety.

🧠 How It Works
Signaling:
Clients connect to the signaling server (Node.js + Socket.IO) to exchange offers, answers, and ICE candidates.

WebRTC Connection:
Once signaling completes, peers communicate directly using WebRTC — video and audio stream flow peer-to-peer.

STUN/TURN:
coturn server helps peers discover public IPs (STUN) and relay traffic if direct connection fails (TURN).

🛠️ Local Development
1️⃣ Clone the repo
bash
Copy code
git clone https://github.com/gauravbhatt9854/webRTC.git
cd webRTC
2️⃣ Install dependencies
bash
Copy code
cd client && yarn install
cd ../server && yarn install
3️⃣ Setup .env (as shown above)
Add TURN and signaling details in your .env file.

4️⃣ Run the signaling server
bash
Copy code
cd server
yarn dev
5️⃣ Start frontend (Vite)
bash
Copy code
cd ../client
yarn dev
Then open 👉 http://localhost:5173

🧱 Example ICE Configuration (Client)
js
Copy code
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_PASSWORD
    }
  ]
});
🧩 Signaling Server (Node.js)
Uses Socket.IO for event-based signaling:

js
Copy code
io.on('connection', (socket) => {
  socket.on('join', (roomId) => socket.join(roomId));
  socket.on('offer', (data) => socket.to(data.room).emit('offer', data.sdp));
  socket.on('answer', (data) => socket.to(data.room).emit('answer', data.sdp));
  socket.on('ice-candidate', (data) => socket.to(data.room).emit('ice-candidate', data.candidate));
});
🐳 Deployment Notes (Coolify + Caddy + OCI)
Host on Oracle OCI VM with Docker installed.

Use Coolify to deploy:

One service for client (React build)

One service for server (Node.js)

One service for coturn (TURN/STUN)

Caddy in Coolify automatically handles HTTPS certificates.

Add domain vc.golu.codes → point A record to VM’s public IP.

Open OCI firewall ports:

80, 443 (Caddy)

3478 (TURN TCP/UDP)

49152–65535 UDP (TURN relay range)

🧠 Troubleshooting
Issue	Possible Cause	Fix
ICE failed	TURN blocked	Open 3478 & UDP range
No video/audio	Media permissions	Check browser permissions
“Connection failed”	Wrong TURN creds	Verify .env
Works on localhost, not production	CORS / firewall	Adjust CORS & OCI security list

📂 Folder Structure
bash
Copy code
webRTC/
├── client/        # React frontend (Vite)
├── server/        # Node.js + Socket.IO signaling
├── coturn/        # TURN/STUN config (optional)
├── docker-compose.yml
└── README.md
🪪 License
MIT License — Free to use, modify, and deploy.
Made with ❤️ by Gaurav Bhatt

🌐 Live Demo: https://vc.golu.codes
Enjoy lag-free, peer-to-peer video calling right in your browser!

yaml
Copy code

---

Would you like me to make it more **GitHub-styled** (with badges like _React_, _Node.js_, _Deployed on Coolify_, etc.)?  
I can quickly add those visuals to make your repo look more professional.
