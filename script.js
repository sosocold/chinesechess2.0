// 獲取 DOM 元素
const currentTurnDisplay = document.getElementById('current-turn');
const chessboardContainer = document.getElementById('chessboard-container');
const resetButton = document.getElementById('reset-button'); // <-- 把這行加在這裡


// 定義後端服務的基礎 URL
const BACKEND_BASE_URL = 'http://sosocold.pythonanywhere.com'; 

// 將棋盤數據從後端獲取
let board = [];
let currentTurn = '紅方'; // 從後端獲取實際回合

// 改變 handlePieceClick 和 handleBoardClick 邏輯，讓它們發送請求到後端

async function fetchBoardState() {
    const response = await fetch(`${BACKEND_BASE_URL}/api/get_board`);
    const data = await response.json();
    board = data.board;
    currentTurn = data.currentTurn;
    currentTurnDisplay.textContent = currentTurn;
    renderBoard(); // 重新渲染棋盤
}

async function sendMoveRequest(from, to) {
    const response = await fetch(`${BACKEND_BASE_URL}/api/move_piece`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: from, to: to })
    });
    const data = await response.json();
    if (data.success) {
        board = data.board;
        currentTurn = data.currentTurn;
        currentTurnDisplay.textContent = currentTurn;
        renderBoard(); // 重新渲染棋盤
        // 檢查遊戲是否結束 (從後端返回的資訊判斷)
        if (data.gameOver) { // 假設後端會發送這個標誌
            alert(data.gameOverMessage);
        }
    } else {
        alert(data.message); // 顯示後端返回的錯誤訊息
    }
    selectedPiece?.classList.remove('selected-piece');
    selectedPiece = null;
    selectedPiecePosition = null;
}

// 修改 handlePieceClick
function handlePieceClick(event) {
    const clickedElement = event.target;
    const clickedRow = parseInt(clickedElement.dataset.row);
    const clickedCol = parseInt(clickedElement.dataset.col);
    const clickedPiece = board[clickedRow][clickedCol];

    if (selectedPiece) {
        if (selectedPiece === clickedElement) {
            selectedPiece.classList.remove('selected-piece');
            selectedPiece = null;
            selectedPiecePosition = null;
        } else if (clickedPiece && clickedPiece.color === (currentTurn === '紅方' ? '紅' : '黑')) {
            selectedPiece.classList.remove('selected-piece');
            selectedPiece = clickedElement;
            selectedPiece.classList.add('selected-piece');
            selectedPiecePosition = { row: clickedRow, col: clickedCol };
        } else {
            // 向後端發送移動請求
            sendMoveRequest(selectedPiecePosition, { row: clickedRow, col: clickedCol });
        }
    } else if (clickedPiece && clickedPiece.color === (currentTurn === '紅方' ? '紅' : '黑')) {
        selectedPiece = clickedElement;
        selectedPiece.classList.add('selected-piece');
        selectedPiecePosition = { row: clickedRow, col: clickedCol };
    }
}

// 修改 handleBoardClick
function handleBoardClick(event) {
    if (event.target.classList.contains('chess-piece')) {
        return;
    }
    if (selectedPiece) {
        const rect = chessboardContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const targetCol = Math.round((clickX - HALF_GRID_SIZE) / GRID_SIZE);
        const targetRow = Math.round((clickY - HALF_GRID_SIZE) / GRID_SIZE);

        // 向後端發送移動請求
        sendMoveRequest(selectedPiecePosition, { row: targetRow, col: targetCol });
    }
}

// 修改 reset 按鈕事件
resetButton.addEventListener('click', async () => {
    const response = await fetch(`${BACKEND_BASE_URL}/api/reset_game`, { method: 'POST' });
    const data = await response.json();
    if (data.success) {
        board = data.board;
        currentTurn = data.currentTurn;
        currentTurnDisplay.textContent = currentTurn;
        renderBoard();
        selectedPiece?.classList.remove('selected-piece');
        selectedPiece = null;
        selectedPiecePosition = null;
    }
});

// 初始化時從後端獲取棋盤狀態
fetchBoardState();
chessboardContainer.addEventListener('click', handleBoardClick);
