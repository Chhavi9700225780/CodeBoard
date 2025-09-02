@@ .. @@
   const [input, setInput] = useState("");
   const [langCode, setLangCode] = useState("52");
+  const [isRunning, setIsRunning] = useState(false);
+  const [isMuted, setIsMuted] = useState(true);
+  const [mediaStream, setMediaStream] = useState(null);
+  
   const handleChat = (e) => {
     e.preventDefault();
     setChatShown(true);
@@ .. @@
      socketRef.current.on('connect_error', (err) => handleerror(err));
      socketRef.current.on('connect_failed', (err) => handleerror(err));
      function handleerror(err) {
-        toast.error('Socket connection failed, try again!')
-        navigate('/');
+        console.log('Connection error:', err);
+        toast.error('Connection issue, retrying...')
+        // Don't navigate away, let socket.io handle reconnection
      }
     }
     <button 
       className='btn doubtBtn' 
       style={{ right: '220px', backgroundColor: isRunning ? '#ccc' : '#4aed88' }} 
       onClick={() => runCode()} 
       disabled={isRunning}
     >
       {isRunning ? 'Running...' : 'Run Code'}
    </button>
    <button 
       className='btn doubtBtn' 
       style={{ right: '300px', backgroundColor: isMuted ? '#ff6b6b' : '#4aed88' }} 
       onClick={toggleMicrophone}
    >
       {!mediaStream ? '🎤 Enable Mic' : (isMuted ? '🔇 Unmuted' : '🎤 Muted')}
    </button>