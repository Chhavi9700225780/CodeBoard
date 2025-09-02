import React, { useEffect, useRef, useState } from 'react'
import ACTIONS from '../Action';
import Client from '../components/Client';
import Editor from '../components/Editor';
import Doubt from '../components/Doubt';
import { initSocket } from '../Socket';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast';
import logo from "../logo.webp"
import DoubtSection from '../components/DoubtSection';
import bglogo from "../images/bglogo.png"
import { AiOutlineMenu } from 'react-icons/ai'
import axios from 'axios';
import Terminal from '../components/Terminal';

function EditorPage() {
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatShown, setChatShown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [doubt, setDoubt] = useState("");
  const [allDoubts, setAllDoubts] = useState({});
  const [liveCode, setLiveCode] = useState("");
  const [clients, setclients] = useState([]);
  const [access, setAccess] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [output, setOutput] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [input, setInput] = useState("");
  const [langCode, setLangCode] = useState("52");
  const [isRunning, setIsRunning] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const handleChat = (e) => {
    e.preventDefault();
    setChatShown(true);
  }
  const [isTeacher, setIsTeacher] = useState(false);
  const { id } = useParams();
  const socketRef = useRef(null);
  const toggleMicrophone = async () => {
    try {
      if (!isMicEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
        setIsMicEnabled(true);
        toast.success('Microphone enabled');
      } else {
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
        }
        setIsMicEnabled(false);
        toast.success('Microphone disabled');
      }
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };
  
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleerror(err));
      socketRef.current.on('connect_failed', (err) => handleerror(err));
      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        toast.error('Connection lost. Reconnecting...');
      });
      socketRef.current.on('reconnect', () => {
        toast.success('Reconnected to server!');
      });
      function handleerror(err) {
        console.log('Connection error:', err);
        toast.error('Connection issue. Retrying...');
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        id,
        username: location.state.username
      });
      // Listening for doubt event
      socketRef.current.on(ACTIONS.DOUBT, ({ doubts, username, socketId }) => {
        setAllDoubts(doubts);
        toast.success(`${username} asked a doubt!`)
      })
      // Listening for joined event
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        setclients(clients);
        if (username !== location.state.username) {
          toast.success(`${username} joined the room.`)
        }
      })

      // Disconnecting the user listener
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setclients((prev) => {
          return prev.filter((item) => {
            return item.socketId !== socketId;
          })
        })
      })
    };
    init();
    editorRef.current.setOption('readOnly', false)
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      // Cleanup microphone
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    }
  }, [])
  if (!location.state) {
    return <Navigate to="/" />
  }
  async function copyRoomId() {
    try {
      await window.navigator.clipboard.writeText(id);
      toast.success('Room id has been copied to clipboard!')
    } catch (err) {
      toast.error(err);
    }
  }
  async function askDoubt(e) {
    e.preventDefault();
    socketRef.current.emit(ACTIONS.DOUBT, {
      id,
      username: location.state.username,
      doubt
    })
    setDoubt("");
  }
  async function lockAccess() {
    setAccess(!access)
    socketRef.current.emit('lock_access', {
      id,
      access
    })
  }
  function leaveRoom() {
    navigate('/');
    toast.success('You leaved the Room');
  }
  const downloadTxtFile = async () => {
    const element = document.createElement("a");
    const file = new Blob([liveCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    // const options = {
    //   method: 'GET',
    //   url: `https://judge0-ce.p.rapidapi.com/languages/${langCode}`,
    //   headers: {
    //     'X-RapidAPI-Key': `${process.env.REACT_APP_RAPID_API_KEY}`,
    //     'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    //   }
    // };
    
    // const res = (await axios.request(options)).data;
    element.download = 'main.txt';
    document.body.appendChild(element);
    element.click();
  };
  const runCode = async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setOutput("Compiling and running code...");
    
    if(liveCode === "") {
      setOutput("Error: No code to execute");
      setIsRunning(false);
      return;
    }
    
    try {
    const encodedCode = btoa(liveCode);
    const inputNecode = btoa(input);
    
    const optionsPost = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: {base64_encoded: 'true', fields: '*'},
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': `${process.env.REACT_APP_RAPID_API_KEY}`,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: `{"language_id":${Number(langCode)},"source_code":"${encodedCode}","stdin":"${inputNecode}"}`
    };
    
    const resPost = await axios.request(optionsPost);
    
    // Poll for result
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
    const optionsGet = {
      method: 'GET',
      url: `https://judge0-ce.p.rapidapi.com/submissions/${resPost.data.token}`,
      params: { base64_encoded: 'true', fields: '*' },
      headers: {
        'X-RapidAPI-Key': `${process.env.REACT_APP_RAPID_API_KEY}`,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    };
    
    const res = (await axios.request(optionsGet)).data;
    
      if (res.status.id <= 2) {
        // Still processing
        setOutput(`Processing... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        continue;
      }
      
      // Execution completed
      let finalOutput = '';
      
      if (res.stdout) {
        finalOutput += `Output:\n${atob(res.stdout)}\n`;
      }
      
      if (res.stderr) {
        finalOutput += `Error:\n${atob(res.stderr)}\n`;
      }
      
      if (res.compile_output) {
        finalOutput += `Compilation Error:\n${atob(res.compile_output)}\n`;
      }
      
      if (!res.stdout && !res.stderr && !res.compile_output) {
        finalOutput = `Status: ${res.status.description}`;
      }
      
      setOutput(finalOutput || 'No output');
      break;
    }
    
    if (attempts >= maxAttempts) {
      setOutput('Execution timeout. Please try again.');
    }
    
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }
  return (
    <div className='mainWrap' style={{ gridTemplateColumns: menuOpen ? `${showTerminal ? '230px 1fr 0.4fr' : '230px 1fr'}` : `${showTerminal ? '0 1fr 0.4fr' : '0 1fr'}` }}>
      <div className="aside" style={{ position: 'relative' }}>
        <div className='menu-options' style={{ left: menuOpen ? '230px' : '0px' }} onClick={() => setMenuOpen(!menuOpen)}><AiOutlineMenu /></div>
        <div className="asideInner">
          <div className="logo"><h2 className='logo_design'><img src={bglogo} alt="" style={{ width: '220px' }} /></h2></div>
          <h3>Teacher</h3>
          <div className="clientsList">
            {
              clients.length !== 0 && <Client key={clients[0].socketId} username={clients[0].username} />
            }
          </div>
          <h3>Students</h3>
          <div className="clientsList">
            {
              clients.map((item, index) => ((index !== 0) && <Client key={item.socketId} username={item.username} />))
            }
          </div>
        </div>
        {
          <select name="" className='btn copyBtn' value={langCode} onChange={(e) => setLangCode(e.target.value)} style={{marginBottom:'10px', outline: 'none'}}>
            <option value="52">C++</option>
            <option value="49">C</option>
            <option value="63">Javascript</option>
            <option value="62">Java</option>
            <option value="92">Python</option>
          </select>
        }
        <button className='btn copyBtn' onClick={copyRoomId} >Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom} >Leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef} id={id} setLiveCode={setLiveCode} access={access} editorRef={editorRef} />
      </div>
      {showTerminal && (
        <div className='terminal'>
          <Terminal output={output} terminal={terminal} setEditorOpen={setShowTerminal} setInput={setInput} input={input} />
        </div>
      )}
      {
        (clients.length !== 0 && clients[0].username === location.state.username && <button className='btn doubtBtn' style={{ right: '300px' }} onClick={lockAccess} >{access ? 'Lock' : 'Unlock'} Editor</button>)
      }
      <button className='btn doubtBtn' style={{ right: '220px', backgroundColor: isRunning ? '#ccc' : '#4aed88' }} onClick={runCode} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Run Code'}
      </button>
      <button className='btn doubtBtn' style={{ right: '60px', backgroundColor: isMicEnabled ? '#4aed88' : '#ff4444' }} onClick={toggleMicrophone}>
        {isMicEnabled ? '🎤 ON' : '🎤 OFF'}
      </button>
      <button className='btn doubtBtn' style={{ right: '140px' }} onClick={downloadTxtFile}>Download Code</button>
      <button className='btn doubtBtn' onClick={handleChat}>Ask a doubt? </button>
      {isChatShown && <DoubtSection status={setChatShown} setDoubt={setDoubt} doubt={doubt} askDoubt={askDoubt} allDoubts={allDoubts} />}
    </div>
  )
}

export default EditorPage