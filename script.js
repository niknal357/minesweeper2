document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const resetBtn = document.getElementById('resetBtn');
    const flagCountDisplay = document.getElementById('flagCount');

    const rows = 16;
    const cols = 16;
    const mineCount = 90;
    let flagsUsed = 0;
    let firstClickMade = false;

    let board = [];
    let isGameOver = false;

    // For highlight logic
    let highlightOrigin = null;
    let highlightedCells = [];

    // For press logic
    let currentPressedCell = null;

    resetBtn.addEventListener('click', initGame);

    initGame();

    function initGame() {
        board = [];
        isGameOver = false;
        flagsUsed = 0;
        firstClickMade = false;
        flagCountDisplay.textContent = mineCount - flagsUsed;

        boardElement.innerHTML = '';

        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    adjacentMines: 0
                };
            }
        }

        for (let r = 0; r < rows; r++) {
            const rowElement = document.createElement('div');
            for (let c = 0; c < cols; c++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell', 'hidden');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;

                cellElement.addEventListener('mousedown', handleMouseDown);
                cellElement.addEventListener('mouseup', handleMouseUp);
                cellElement.addEventListener('mouseleave', handleMouseLeave);

                cellElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    // if (!isGameOver) toggleFlag(r, c);
                    return false;
                });

                rowElement.appendChild(cellElement);
            }
            boardElement.appendChild(rowElement);
        }

        document.addEventListener('mouseup', clearHighlight);
    }

    function handleMouseDown(e) {
        if (isGameOver) return;
        const r = parseInt(e.currentTarget.dataset.row);
        const c = parseInt(e.currentTarget.dataset.col);
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);

        // Ctrl or Shift click to flag
        if (e.ctrlKey || e.shiftKey || e.button === 2) {
            toggleFlag(r, c);
            return;
        }

        // If cell is revealed and has a number, highlight neighbors
        if (cell.revealed && cell.adjacentMines > 0) {
            highlightOrigin = { r, c };
            highlightNeighbors(r, c, true);
        }

        // If cell is hidden and not flagged, "press" it
        if (!cell.revealed && !cell.flagged) {
            cellEl.classList.add('pressed');
            currentPressedCell = { r, c };
        }
    }

    function handleMouseUp(e) {
        if (isGameOver) return;
        const r = parseInt(e.currentTarget.dataset.row);
        const c = parseInt(e.currentTarget.dataset.col);
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);

        // If we mouseup on the same cell that was pressed, reveal it
        if (currentPressedCell && currentPressedCell.r === r && currentPressedCell.c === c) {
            cellEl.classList.remove('pressed');
            currentPressedCell = null;

            if (!cell.revealed && !cell.flagged) {
                if (!firstClickMade) {
                    placeMinesAvoiding(r, c);
                    calculateAdjacentMines();
                    firstClickMade = true;
                }
                revealCell(r, c);
                checkWin();
            } else if (cell.revealed) {
                // If already revealed, try chording
                chordIfPossible(r, c);
            }
        } else {
            // If mouseup on a different cell than pressed, cancel press
            if (currentPressedCell) {
                const pressedEl = getCellElement(currentPressedCell.r, currentPressedCell.c);
                pressedEl.classList.remove('pressed');
                currentPressedCell = null;
            }

            // If the current cell is revealed (clicked again without press),
            // try chordIfPossible to handle auto-reveal as well
            if (cell.revealed) {
                chordIfPossible(r, c);
            }
        }
    }

    function handleMouseLeave(e) {
        // If we leave the cell before mouseup, cancel the press
        if (currentPressedCell) {
            const { r, c } = currentPressedCell;
            const cellEl = getCellElement(r, c);
            cellEl.classList.remove('pressed');
            currentPressedCell = null;
        }
    }

    function clearHighlight() {
        // Clear highlighting if any
        if (highlightOrigin) {
            highlightNeighbors(highlightOrigin.r, highlightOrigin.c, false);
            highlightOrigin = null;
        }
    }

    function placeMinesAvoiding(r, c) {
        // let safeCells = new Set();
        // for (let dr = -1; dr <= 1; dr++) {
        //     for (let dc = -1; dc <= 1; dc++) {
        //         let nr = r + dr;
        //         let nc = c + dc;
        //         if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        //             safeCells.add(`${nr},${nc}`);
        //         }
        //     }
        // }

        // let placed = 0;
        // while (placed < mineCount) {
        //     let rr = Math.floor(Math.random() * rows);
        //     let cc = Math.floor(Math.random() * cols);
        //     if (!safeCells.has(`${rr},${cc}`) && !board[rr][cc].mine) {
        //         board[rr][cc].mine = true;
        //         placed++;
        //     }
        // }
        let generatedBoard = runGenerator(cols, rows, mineCount, c, r);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (generatedBoard[j][i] === "x") {
                    board[i][j].mine = true;
                }
            }
        }
    }

    function calculateAdjacentMines() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!board[r][c].mine) {
                    board[r][c].adjacentMines = countAdjacentMines(r, c);
                }
            }
        }
    }

    function countAdjacentMines(r, c) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (board[nr][nc].mine) count++;
                }
            }
        }
        return count;
    }

    function getCellElement(r, c) {
        return boardElement.children[r].children[c];
    }

    function revealCell(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);

        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;
        cellEl.classList.remove('hidden');
        cellEl.classList.add('revealed');

        if (cell.mine) {
            cellEl.classList.add('mine');
            cellEl.textContent = '💣';
            gameOver(false);
        } else {
            if (cell.adjacentMines > 0) {
                cellEl.classList.add('number' + cell.adjacentMines);
                cellEl.textContent = cell.adjacentMines;
            } else {
                cellEl.classList.add('number0');
                cellEl.textContent = '';
                // setTimeout(() => revealNeighbors(r, c), 5);
                revealNeighbors(r, c);
            }
        }
    }

    function revealNeighbors(r, c) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                revealSafe(r + dr, c + dc);
            }
        }
    }

    function revealSafe(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        const cell = board[r][c];
        if (!cell.revealed && !cell.mine && !cell.flagged) {
            revealCell(r, c);
        }
    }

    function toggleFlag(r, c, f) {
        if (isGameOver && f !== true) return;
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);
        if (cell.revealed) return;

        if (cell.flagged) {
            cell.flagged = false;
            cellEl.classList.remove('flag');
            cellEl.textContent = '';
            flagsUsed--;
        } else {
            if (flagsUsed < mineCount && !cell.revealed) {
                cell.flagged = true;
                cellEl.classList.add('flag');
                cellEl.textContent = '🚩'; // Back to emoji
                flagsUsed++;
            }
        }
        flagCountDisplay.textContent = mineCount - flagsUsed;
    }

    function chordIfPossible(r, c) {
        const cell = board[r][c];
        if (!cell.revealed || cell.adjacentMines === 0) return;

        let flaggedCount = 0;
        let hiddenNeighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                const neighbor = board[nr][nc];
                if (neighbor.flagged) flaggedCount++;
                else if (!neighbor.revealed) hiddenNeighbors.push({ r: nr, c: nc });
            }
        }

        // If the number of flagged neighbors equals the cell's number, reveal all other hidden neighbors
        if (flaggedCount === cell.adjacentMines) {
            for (const n of hiddenNeighbors) {
                revealCell(n.r, n.c);
            }
            checkWin();
        }
    }

    function highlightNeighbors(r, c, highlight) {
        for (let hc of highlightedCells) {
            hc.classList.remove('highlight');
        }
        highlightedCells = [];

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                const cellEl = getCellElement(nr, nc);
                if (highlight) {
                    cellEl.classList.add('highlight');
                    highlightedCells.push(cellEl);
                } else {
                    cellEl.classList.remove('highlight');
                }
            }
        }
    }

    function checkWin() {
        let revealedCount = 0;
        let totalCells = rows * cols;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].revealed) revealedCount++;
            }
        }

        if (revealedCount === (totalCells - mineCount) && !isGameOver) {
            gameOver(true);
        }
    }

    function gameOver(win) {
        isGameOver = true;
        if (!win) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].mine) {
                        if (!board[r][c].flagged) {
                            const cellEl = getCellElement(r, c);
                            cellEl.classList.remove('hidden');
                            cellEl.classList.add('revealed', 'wrong');
                            cellEl.textContent = '💣';
                        } else {
                            const cellEl = getCellElement(r, c);
                            // cellEl.classList.remove('flag');
                            cellEl.classList.add('revealed', 'correct');
                            cellEl.textContent = '🚩';
                        }
                    }
                }
            }
            // alert('Game Over! You hit a mine.');
        } else {
            // alert('Congratulations! You won!');
            // flag all remaining mines
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].mine && !board[r][c].flagged) {
                        toggleFlag(r, c, true);
                    }
                }
            }
        }
    }
});
