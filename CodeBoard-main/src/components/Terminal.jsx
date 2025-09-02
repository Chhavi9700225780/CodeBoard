import React from 'react'

function Terminal({ output, terminal, setEditorOpen, setInput, input }) {
    return (
        <div className='terminalContainer'>
            <button className='terminalCross' onClick={() => setEditorOpen(false)}>x</button>
            <div className='terminalSection'>
                <h3>Input</h3>
                <textarea className='terminalInput' placeholder="Enter input for your program..." value={input} onChange={(e) => setInput(e.target.value)}></textarea>
            </div>
            <hr />
            <div className='terminalSection'>
                <h3>Output</h3>
                <textarea value={output} readOnly className='terminalOutput'></textarea>
            </div>
        </div>
    )
}

export default Terminal