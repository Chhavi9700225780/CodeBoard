import { io } from "socket.io-client"
export const initSocket = async()=>{
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket']
    }
    return io(process.env.REACT_APP_BACKEND_URL, options)
}