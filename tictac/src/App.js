// [x] For the current move only, show “You are at move #…” instead of a button.
// [x] Rewrite Board to use two loops to make the squares instead of hardcoding them.
// [x] When someone wins, highlight the three squares that caused the win (and when no one wins, display a message about the result being a draw).

import {useState} from 'react';

function Square ({value, onSquareClick, isWinning}) {
  return <button className={`square ${isWinning ? 'winning': ''}`}
  onClick = {onSquareClick}>{value}</button>
}

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove,setCurrentMove] = useState(0);
  const currentSquares = history[currentMove];
  
  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove +1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length-1)
    setXIsNext(!xIsNext);
  } 
  
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }
  const moves = history.map((squares,move) => {
    let description;
    if (move>0) {
      description = 'Move ' + move;
    } else {
      description = 'Game start';
    }
    
    if (move === currentMove) {
      return <li key = {move}>{description}</li>;
    } else {
      return <li key={move}>
        <button onClick = {() => jumpTo(move)}>{description}</button>
      </li>;
      }  
    });



  return (
    <div className = "game">
      <div className = "game-board">
        <Board xIsNext = {xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
} 


function Board({xIsNext, squares,onPlay}) {
  // const [xIsNext,setXIsNext] = useState(true);
  // const [squares, setSquares] = useState(Array(9).fill(null));
  
  function handleClick(i){
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = "X";
    } else {
     nextSquares[i] = "O"; 
    }
    // setSquares(nextSquares);
    // setXIsNext(!xIsNext);
    onPlay(nextSquares)
  }
  const winInfo = calculateWinner(squares);
  let status;
  if (winInfo) {
    status = "Winner: " + winInfo.winner;
  } else if (squares.every(square => square !== null)){
    status = "Draw - Game Over!";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }
  
  const boardRows = [];

  for (let row = 0; row < 3; row++) {
    const squaresInRow = [];
    for (let col = 0; col<3;col++) {
      const i = row * 3 + col
      const isWinning = winInfo?.winLine.includes(i)
      squaresInRow.push(<Square key={i} value ={squares[i]} onSquareClick = {() => handleClick(i)} isWinning = {isWinning}/>
      
    );
    }
    boardRows.push(
      <div key = {row} className = "board-row">{squaresInRow}</div>
    );
  }


  return (
    <>
      <div className="status">{status}</div>
      {boardRows}
      {/* <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div> */}
    </>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i<lines.length; i++) {
    const [a,b,c] = lines[i];
    if (squares[a] && squares [a] === squares[b] && squares[a] === squares[c]){
      return {
        winner: squares[a],
        winLine: [a,b,c]
    };
  }
  }
  return null;
}