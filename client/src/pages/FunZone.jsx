import React, { useState, useEffect, useContext } from "react";
import {
  Trophy,
  RefreshCw,
  Zap,
  Target,
  Clock,
  Award,
  Gamepad2,
  Star,
  Grid3x3,
  Brain,
  Crown,
  TrendingUp,
  User,
  Medal,
} from "lucide-react";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";

export default function FunZone() {
  const { userData, backend_url } = useContext(AppContent);
  const [activeGame, setActiveGame] = useState("memory");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userBestScores, setUserBestScores] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    if (userData?.userId) {
      fetchUserBestScores();
    }
  }, [userData]);

  const fetchUserBestScores = async () => {
    try {
      const response = await fetch(
        `${backend_url}/api/game/results/user/${userData.userId}/best`
      );
      const result = await response.json();
      if (result) {
        const scoresMap = {};

        result.data.forEach((item) => {
          scoresMap[item._id] = item.highestScore;
        });
        setUserBestScores(scoresMap);
      }
    } catch (error) {
      console.error("Error fetching best scores:", error);
    }
  };

  const fetchLeaderboard = async (gameName) => {
    try {
      const response = await fetch(
        `${backend_url}/api/game/leaderboard/${gameName}?limit=10`
      );
      const result = await response.json();
      if (result.success) {
        setLeaderboardData(result.data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    }
  };

  const saveGameResult = async (gameName, score, gameData) => {
    if (!userData?.userId) {
      toast.warning("Please login to save your scores!");
      return;
    }

    try {
      const response = await fetch(`${backend_url}/api/game/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.userId,
          userName: userData.name || userData.username,
          gameName,
          score,
          gameData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const currentBest = userBestScores[gameName] || 0;
        if (score > currentBest) {
          toast.success(`🎉 New High Score: ${score}!`, {
            position: "top-center",
            autoClose: 3000,
          });
          fetchUserBestScores();
        } else {
          toast.success("Score saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error saving game result:", error);
      toast.error("Failed to save score");
    }
  };

  const games = [
    { id: "memory", name: "Memory Match", icon: Target },
    { id: "reaction", name: "Reaction Time", icon: Zap },
    { id: "number", name: "Number Guesser", icon: Star },
    { id: "tictactoe", name: "Tic Tac Toe", icon: Grid3x3 },
    { id: "simon", name: "Simon Says", icon: Brain },
  ];

  const handleGameChange = (gameId) => {
    setActiveGame(gameId);
    setShowLeaderboard(false);
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
    if (!showLeaderboard) {
      fetchLeaderboard(activeGame);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white p-4 sm:p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Gamepad2 size={48} className="text-yellow-400" />
            <h1 className="text-4xl sm:text-6xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                FunZone
              </span>
            </h1>
          </div>
          <p className="text-gray-300 text-lg sm:text-xl">
            Take a break and play some games!
          </p>
        </div>

        {/* User Best Scores */}
        {userData && Object.keys(userBestScores).length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl border border-yellow-400/30 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="text-yellow-400" size={24} />
              <h3 className="text-xl font-bold">Your Best Scores</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white/10 rounded-lg p-3 text-center"
                >
                  <game.icon
                    size={20}
                    className="mx-auto mb-1 text-yellow-400"
                  />
                  <p className="text-xs text-gray-400 mb-1">{game.name}</p>
                  <p className="text-xl font-bold text-yellow-300">
                    {userBestScores[game.id] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Selection */}
        <div className="flex gap-2 sm:gap-4 mb-8 justify-center flex-wrap">
          {games.map((game) => {
            const GameIcon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => handleGameChange(game.id)}
                className={`px-3 sm:px-6 py-2 sm:py-4 hover:cursor-pointer rounded-2xl font-bold transition-all flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${
                  activeGame === game.id
                    ? "bg-gradient-to-r from-yellow-400 to-pink-500 text-white scale-105 shadow-2xl"
                    : "bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20"
                }`}
              >
                <GameIcon size={20} />
                <span className="hidden sm:inline">{game.name}</span>
                <span className="sm:hidden">{game.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleShowLeaderboard}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-bold hover:scale-105 cursor-pointer transition-all flex items-center gap-2"
          >
            <Trophy size={20} />
            {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
          </button>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 mb-6 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} />
              Top Players - {games.find((g) => g.id === activeGame)?.name}
            </h2>
            {leaderboardData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No scores recorded yet. Be the first!
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboardData.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-400/30 to-gray-500/30 border border-gray-400"
                          : index === 2
                            ? "bg-gradient-to-r from-orange-600/30 to-orange-700/30 border border-orange-500"
                            : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold w-8">
                        {index === 0 ? (
                          <Crown className="text-yellow-400" size={28} />
                        ) : index === 1 ? (
                          <Medal className="text-gray-400" size={28} />
                        ) : index === 2 ? (
                          <Medal className="text-orange-600" size={28} />
                        ) : (
                          `#${index + 1}`
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{entry.userName}</p>
                        <p className="text-sm text-gray-400">
                          {entry.totalGames} games played
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-300">
                        {entry.highestScore}
                      </p>
                      <p className="text-xs text-gray-400">Best Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-4 sm:p-8 shadow-2xl">
          {activeGame === "memory" && <MemoryGame onGameEnd={saveGameResult} />}
          {activeGame === "reaction" && (
            <ReactionGame onGameEnd={saveGameResult} />
          )}
          {activeGame === "number" && (
            <NumberGuesser onGameEnd={saveGameResult} />
          )}
          {activeGame === "tictactoe" && (
            <TicTacToe onGameEnd={saveGameResult} />
          )}
          {activeGame === "simon" && <SimonSays onGameEnd={saveGameResult} />}
        </div>
      </div>
    </div>
  );
}

// Memory Match Game
function MemoryGame({ onGameEnd }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const emojis = ["🎮", "🎯", "🎨", "🎭", "🎪", "🎸", "🎺", "🎹"];

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsWon(false);
    setStartTime(Date.now());
  };

  const handleCardClick = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id))
      return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) {
          setIsWon(true);
          const timeCompleted = Math.floor((Date.now() - startTime) / 1000);
          const score = Math.max(1000 - moves * 10 - timeCompleted, 100);
          onGameEnd("memory", score, { moves, timeCompleted });
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-purple-500/20 px-4 sm:px-6 py-3 rounded-xl border border-purple-400/30">
            <p className="text-sm text-purple-300">Moves</p>
            <p className="text-2xl sm:text-3xl font-bold">{moves}</p>
          </div>
          <div className="bg-pink-500/20 px-4 sm:px-6 py-3 rounded-xl border border-pink-400/30">
            <p className="text-sm text-pink-300">Matched</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {matched.length / 2}/{emojis.length}
            </p>
          </div>
        </div>
        <button
          onClick={initializeGame}
          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 cursor-pointer transition-all flex items-center gap-2"
        >
          <RefreshCw size={20} />
          New Game
        </button>
      </div>

      {isWon && (
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border-2 border-yellow-400/50 text-center">
          <Trophy size={48} className="mx-auto mb-3 text-yellow-400" />
          <h3 className="text-3xl font-bold mb-2">🎉 You Won! 🎉</h3>
          <p className="text-xl">Completed in {moves} moves!</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-xl sm:rounded-2xl text-3xl sm:text-5xl font-bold transition-all transform hover:cursor-pointer ${
              flipped.includes(card.id) || matched.includes(card.id)
                ? "bg-gradient-to-br from-purple-500 to-pink-500 scale-105"
                : "bg-white/20 hover:bg-white/30 hover:scale-105"
            }`}
          >
            {flipped.includes(card.id) || matched.includes(card.id)
              ? card.emoji
              : "?"}
          </button>
        ))}
      </div>
    </div>
  );
}

// Reaction Time Game
function ReactionGame({ onGameEnd }) {
  const [status, setStatus] = useState("waiting");
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);

  const startGame = () => {
    setStatus("ready");
    setReactionTime(null);
    const delay = Math.random() * 3000 + 1000;
    setTimeout(() => {
      setStatus("go");
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (status === "waiting") {
      startGame();
    } else if (status === "ready") {
      setStatus("too-soon");
      setTimeout(() => setStatus("waiting"), 2000);
    } else if (status === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setStatus("done");
      if (!bestTime || time < bestTime) {
        setBestTime(time);
      }
      const score = Math.max(1000 - time, 100);
      onGameEnd("reaction", score, { reactionTime: time });
    } else if (status === "done" || status === "too-soon") {
      setStatus("waiting");
    }
  };

  const getStatusColor = () => {
    if (status === "waiting") return "from-blue-500 to-cyan-500";
    if (status === "ready") return "from-yellow-500 to-orange-500";
    if (status === "go") return "from-green-500 to-emerald-500";
    if (status === "too-soon") return "from-red-500 to-rose-500";
    return "from-purple-500 to-pink-500";
  };

  const getStatusText = () => {
    if (status === "waiting") return "Click to Start";
    if (status === "ready") return "Wait for green...";
    if (status === "go") return "CLICK NOW!";
    if (status === "too-soon") return "Too Soon!";
    return `${reactionTime}ms`;
  };

  return (
    <div>
      <div className="mb-6 flex justify-center gap-4 flex-wrap">
        {bestTime && (
          <div className="bg-yellow-500/20 px-6 py-3 rounded-xl border border-yellow-400/30">
            <p className="text-sm text-yellow-300">Best Time</p>
            <p className="text-3xl font-bold">{bestTime}ms</p>
          </div>
        )}
        {reactionTime && (
          <div className="bg-green-500/20 px-6 py-3 rounded-xl border border-green-400/30">
            <p className="text-sm text-green-300">Last Time</p>
            <p className="text-3xl font-bold">{reactionTime}ms</p>
          </div>
        )}
      </div>

      <button
        onClick={handleClick}
        className={`w-full h-64 sm:h-96 rounded-3xl bg-gradient-to-br ${getStatusColor()} text-white text-3xl sm:text-5xl font-bold hover:scale-105 transition-all shadow-2xl cursor-pointer`}
      >
        {getStatusText()}
      </button>

      <div className="mt-6 text-center text-gray-300">
        <p className="text-base sm:text-lg">
          {status === "waiting" && "Click the box to start the reaction test"}
          {status === "ready" && "Wait until the box turns green..."}
          {status === "go" && "Click as fast as you can!"}
          {status === "too-soon" && "You clicked too early! Try again."}
          {status === "done" && "Great! Click to try again and beat your time."}
        </p>
      </div>
    </div>
  );
}

// Number Guessing Game
function NumberGuesser({ onGameEnd }) {
  const [targetNumber, setTargetNumber] = useState(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [gameStatus, setGameStatus] = useState("playing");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setGuess("");
    setAttempts(0);
    setMessage("Guess a number between 1 and 100!");
    setGameStatus("playing");
    setHistory([]);
  };

  const handleGuess = () => {
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
      setMessage("Please enter a valid number between 1 and 100");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setHistory([...history, numGuess]);

    if (numGuess === targetNumber) {
      setMessage(`🎉 Correct! You won in ${newAttempts} attempts!`);
      setGameStatus("won");
      const score = Math.max(1000 - newAttempts * 50, 100);
      onGameEnd("number", score, { attempts: newAttempts });
    } else if (numGuess < targetNumber) {
      setMessage("📈 Too low! Try a higher number.");
    } else {
      setMessage("📉 Too high! Try a lower number.");
    }
    setGuess("");
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="inline-block bg-purple-500/20 px-8 py-4 rounded-xl border border-purple-400/30 mb-4">
          <p className="text-sm text-purple-300">Attempts</p>
          <p className="text-4xl font-bold">{attempts}</p>
        </div>
      </div>

      <div
        className={`p-6 rounded-2xl mb-6 text-center text-lg sm:text-xl font-semibold ${
          gameStatus === "won"
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50"
            : "bg-white/10 border border-white/20"
        }`}
      >
        {message}
      </div>

      {gameStatus === "playing" ? (
        <div className="flex gap-4 mb-6 flex-col sm:flex-row">
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleGuess()}
            placeholder="Enter your guess..."
            className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-xl placeholder-gray-400 focus:outline-none focus:border-purple-400"
            min="1"
            max="100"
          />
          <button
            onClick={handleGuess}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:scale-105 transition-all text-lg hover:cursor-pointer"
          >
            Guess
          </button>
        </div>
      ) : (
        <button
          onClick={startNewGame}
          className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 text-lg"
        >
          <RefreshCw size={20} />
          Play Again
        </button>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock size={20} />
            Your Guesses
          </h4>
          <div className="flex flex-wrap gap-2">
            {history.map((num, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-white/10 rounded-lg border border-white/20"
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tic Tac Toe Game
function TicTacToe({ onGameEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line };
      }
    }
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setScores({
        ...scores,
        [result.winner]: scores[result.winner] + 1,
      });
      const score = result.winner === "X" ? 100 : 0;
      onGameEnd("tictactoe", score, { winner: result.winner });
    } else if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw");
      setScores({ ...scores, draws: scores.draws + 1 });
      onGameEnd("tictactoe", 50, { winner: "draw" });
    }

    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-4">
          <div className="bg-blue-500/20 px-6 py-3 rounded-xl border border-blue-400/30">
            <p className="text-sm text-blue-300">X Wins</p>
            <p className="text-3xl font-bold">{scores.X}</p>
          </div>
          <div className="bg-red-500/20 px-6 py-3 rounded-xl border border-red-400/30">
            <p className="text-sm text-red-300">O Wins</p>
            <p className="text-3xl font-bold">{scores.O}</p>
          </div>
          <div className="bg-gray-500/20 px-6 py-3 rounded-xl border border-gray-400/30">
            <p className="text-sm text-gray-300">Draws</p>
            <p className="text-3xl font-bold">{scores.draws}</p>
          </div>
        </div>
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 cursor-pointer transition-all flex items-center gap-2"
        >
          <RefreshCw size={20} />
          New Game
        </button>
      </div>

      {winner && (
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border-2 border-yellow-400/50 text-center">
          <Trophy size={48} className="mx-auto mb-3 text-yellow-400" />
          <h3 className="text-3xl font-bold">
            {winner === "draw" ? "It's a Draw!" : `${winner} Wins!`}
          </h3>
        </div>
      )}

      <div className="mb-6 text-center">
        <p className="text-2xl font-bold">
          {winner ? "Game Over" : `Current Turn: ${isXNext ? "X" : "O"}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`aspect-square rounded-xl sm:rounded-2xl text-4xl sm:text-6xl hover:cursor-pointer font-bold transition-all ${
              winningLine.includes(index)
                ? "bg-gradient-to-br from-yellow-500 to-orange-500 scale-105"
                : cell
                  ? "bg-white/20"
                  : "bg-white/10 hover:bg-white/20 hover:scale-105"
            } ${cell === "X" ? "text-blue-400" : "text-red-400"}`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

// Simon Says Game
function SimonSays({ onGameEnd }) {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const colors = ["red", "blue", "green", "yellow"];
  const sounds = {
    red: 329.63,
    blue: 261.63,
    green: 392.0,
    yellow: 440.0,
  };

  const playSound = (color) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = sounds[color];
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const flashButton = (color) => {
    return new Promise((resolve) => {
      setActiveButton(color);
      playSound(color);
      setTimeout(() => {
        setActiveButton(null);
        setTimeout(resolve, 200);
      }, 400);
    });
  };

  const playSequence = async (seq) => {
    setIsPlaying(true);
    for (let color of seq) {
      await flashButton(color);
    }
    setIsPlaying(false);
  };

  const startGame = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    const newSequence = [newColor];
    setSequence(newSequence);
    setUserSequence([]);
    setScore(0);
    setGameOver(false);
    playSequence(newSequence);
  };

  const nextRound = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    setUserSequence([]);
    playSequence(newSequence);
  };

  const handleColorClick = (color) => {
    if (isPlaying || gameOver) return;

    playSound(color);
    flashButton(color);

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    if (color !== sequence[newUserSequence.length - 1]) {
      setGameOver(true);
      const finalScore = sequence.length - 1;
      if (finalScore > highScore) {
        setHighScore(finalScore);
      }
      onGameEnd("simon", finalScore * 100, { level: finalScore });
    } else if (newUserSequence.length === sequence.length) {
      const newScore = sequence.length;
      setScore(newScore);
      setTimeout(() => nextRound(), 1000);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-4">
          <div className="bg-purple-500/20 px-6 py-3 rounded-xl border border-purple-400/30">
            <p className="text-sm text-purple-300">Level</p>
            <p className="text-3xl font-bold">{score}</p>
          </div>
          {highScore > 0 && (
            <div className="bg-yellow-500/20 px-6 py-3 rounded-xl border border-yellow-400/30">
              <p className="text-sm text-yellow-300">Best</p>
              <p className="text-3xl font-bold">{highScore}</p>
            </div>
          )}
        </div>
        <button
          onClick={startGame}
          disabled={isPlaying}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={20} />
          {sequence.length === 0 ? "Start Game" : "New Game"}
        </button>
      </div>

      {gameOver && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-2xl border-2 border-red-400/50 text-center">
          <h3 className="text-3xl font-bold mb-2">Game Over!</h3>
          <p className="text-xl">You reached level {sequence.length - 1}</p>
        </div>
      )}

      {isPlaying && (
        <div className="mb-6 text-center text-2xl font-bold text-yellow-300 animate-pulse">
          Watch the sequence...
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            disabled={isPlaying || gameOver}
            className={`aspect-square rounded-2xl font-bold text-2xl transition-all transform hover:cursor-pointer ${
              activeButton === color ? "scale-95" : "scale-100"
            } ${
              color === "red"
                ? "bg-red-500 hover:bg-red-400"
                : color === "blue"
                  ? "bg-blue-500 hover:bg-blue-400"
                  : color === "green"
                    ? "bg-green-500 hover:bg-green-400"
                    : "bg-yellow-500 hover:bg-yellow-400"
            } ${
              activeButton === color ? "brightness-150" : "brightness-100"
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl`}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-gray-300">
        <p className="text-lg">
          {sequence.length === 0 && "Click Start Game to begin!"}
          {isPlaying && "Watch and memorize the sequence..."}
          {!isPlaying &&
            !gameOver &&
            sequence.length > 0 &&
            "Repeat the sequence!"}
          {gameOver && "Click New Game to try again!"}
        </p>
      </div>
    </div>
  );
}
