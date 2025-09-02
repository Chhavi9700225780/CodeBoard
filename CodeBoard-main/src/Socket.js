import { io } from "socket.io-client"
export const initSocket = async()=>{
    const options = {
        'force new connection': true,
        reconnectionAttempts: 'Infinity',
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 60000,
        maxReconnectionAttempts: Infinity,
        forceNew: true,
        transports: ['websocket']
    }
    return io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000', options)
}