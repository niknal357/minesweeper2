document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resetBtn = document.getElementById('resetBtn');
    const flagCountDisplay = document.getElementById('flagCount');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const overlay = document.getElementById('overlay');
    const actionToggle = document.getElementById('actionToggle');

    const presetSelector = document.getElementById('presetSelector');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const mineInput = document.getElementById('mineInput');
    const difficultySlider = document.getElementById('difficultySlider');
    const highlightNeighborsCheckbox = document.getElementById('highlightNeighborsCheckbox');
    const highlightAssistCheckbox = document.getElementById('highlightAssistCheckbox');
    const shapeSelector = document.getElementById('shapeSelector');

    const widthValue = document.getElementById('widthValue');
    const heightValue = document.getElementById('heightValue');
    const mineValue = document.getElementById('mineValue');
    const difficultyValue = document.getElementById('difficultyValue');

    let difficulties = [
        { name: 'Easy', id: 0, tid: 'easy' },
        { name: 'Medium', id: 1, tid: 'medium' },
        { name: 'Hard', id: 2, tid: 'hard' },
        { name: 'Unlocked', id: 3, tid: 'unlocked' }
    ]

    let presets = [
        { name: 'Beginner', id: 'beginner', width: 9, height: 9, mines: 15, difficulty: "easy", shape: "standard" },
        { name: 'Intermediate', id: 'intermediate', width: 12, height: 12, mines: 25, difficulty: "easy", shape: "standard" },
        { name: 'Skilled', id: 'skilled', width: 16, height: 16, mines: 64, difficulty: "medium", shape: "standard" },
        { name: 'Expert', id: 'expert', width: 30, height: 16, mines: 180, difficulty: "hard", shape: "standard" },
        { name: 'Van Rijn', id: 'vanrijn', width: 30, height: 30, mines: 225, difficulty: "unlocked", shape: "standard" }
    ];

    for (let i = 0; i < presets.length; i++) {
        const option = document.createElement('option');
        option.value = presets[i].id;
        option.textContent = presets[i].name;
        // insert it before the last option (custom)
        presetSelector.insertBefore(option, presetSelector.children[presetSelector.children.length - 1]);
    }

    // Default Settings
    let cols = parseInt(widthInput.value);
    let rows = parseInt(heightInput.value);
    let mineCount = parseInt(mineInput.value);
    let difficulty = difficulties[parseInt(difficultySlider.value)].tid;
    let highlightNeighborsEnabled = highlightNeighborsCheckbox.checked;
    let highlightAssist = highlightAssistCheckbox.checked;
    let neighborOffset = "standard";
    let currentAction = "dig";
    // load from local storage
    if (localStorage.getItem('difficulty')) {
        difficulty = localStorage.getItem('difficulty');
        let difficultyNum;
        let difficultyObj = difficulties.find(d => d.tid === difficulty);
        if (difficultyObj != undefined) {
            difficultyNum = difficultyObj.id;
        } else {
            difficultyNum = 0;
        }
        difficultySlider.value = difficultyNum;
        difficultyValue.textContent = difficulties[difficultyNum].name;
        difficulty = difficulties[difficultyNum].tid;
    }

    if (localStorage.getItem('width')) {
        widthInput.value = localStorage.getItem('width');
        widthValue.textContent = localStorage.getItem('width');
    }

    if (localStorage.getItem('height')) {
        heightInput.value = localStorage.getItem('height');
        heightValue.textContent = localStorage.getItem('height');
    }

    if (localStorage.getItem('mines')) {
        mineInput.value = localStorage.getItem('mines');
        mineValue.textContent = localStorage.getItem('mines');
    }

    if (localStorage.getItem('highlightNeighbors')) {
        highlightNeighborsCheckbox.checked = localStorage.getItem('highlightNeighbors') === 'true';
    }

    if (localStorage.getItem('highlightAssist')) {
        highlightAssistCheckbox.checked = localStorage.getItem('highlightAssist') === 'true';
    }

    let flagsUsed = 0;
    let firstClickMade = false;

    let board = [];
    let isGameOver = false;

    // For highlight logic
    let highlightOrigin = null;
    let highlightedCells = [];

    // For press logic
    let currentPressedCell = null;
    let clickLock = false;

    // Settings Menu Event Listeners
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    overlay.addEventListener('click', closeSettings);

    resetBtn.addEventListener('click', () => {
        closeSettings();
        initGame();
    });

    actionToggle.addEventListener('click', () => {
        if (currentAction === "dig") {
            currentAction = "flag";
            actionToggle.classList.add('active');
        } else {
            currentAction = "dig";
            actionToggle.classList.remove('active');
        }
    });

    // if the dimensions of the screen have changed, swap the width and height if needed
    window.addEventListener('resize', () => {
        // check if the width of the screen is less than the height
        if (window.innerWidth < window.innerHeight) {
            if (widthInput.value > heightInput.value) {
                let temp = widthInput.value;
                widthInput.value = heightInput.value;
                heightInput.value = temp;
                widthValue.textContent = heightInput.value;
                heightValue.textContent = widthInput.value;
                if (!firstClickMade) {
                    initGame();
                }
            }
        }
        if (window.innerWidth > window.innerHeight) {
            if (widthInput.value < heightInput.value) {
                let temp = widthInput.value;
                widthInput.value = heightInput.value;
                heightInput.value = temp;
                widthValue.textContent = heightInput.value;
                heightValue.textContent = widthInput.value;
                if (!firstClickMade) {
                    initGame();
                }
            }
        }
    });

    presetSelector.addEventListener('change', () => {
        const selectedPreset = presets[presetSelector.selectedIndex];
        widthInput.value = selectedPreset.width;
        heightInput.value = selectedPreset.height;
        mineInput.value = selectedPreset.mines;
        difficultySlider.value = difficulties.find(d => d.tid === selectedPreset.difficulty).id;
        widthValue.textContent = selectedPreset.width;
        heightValue.textContent = selectedPreset.height;
        // if the width of the screen is less than the height, swap them
        if (window.innerWidth < window.innerHeight) {
            let temp = widthInput.value;
            widthInput.value = heightInput.value;
            heightInput.value = temp;
            widthValue.textContent = heightInput.value;
            heightValue.textContent = widthInput.value;
        }
        mineValue.textContent = selectedPreset.mines;
        difficultyValue.textContent = difficulties[difficultySlider.value].name;
        difficulty = difficulties[difficultySlider.value].tid;
        shapeSelector.value = selectedPreset.shape;
        neighborOffset = selectedPreset.shape;
        if (!firstClickMade || isGameOver) {
            neighborOffsets = neighborOffsetOptions[shapeSelector.value];
        }
        updateMineInputMax();
        if (!firstClickMade) {
            initGame();
        }
    });

    let neighborOffsets = [
        // standard
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
    ];


    let neighborOffsetOptions = {
        "standard": [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1]
        ],
        "knight": [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [1, -2],
            [2, -1],
            [2, 1],
            [1, 2],
            [-1, 2]
        ],
        "cross": [
            [-1, 0],
            [-2, 0],
            [1, 0],
            [2, 0],
            [0, -1],
            [0, -2],
            [0, 1],
            [0, 2]
        ],
        "bigball": [
            [-1, -2],
            [0, -2],
            [1, -2],
            [-2, -1],
            [-1, -1],
            [0, -1],
            [1, -1],
            [2, -1],
            [-2, 0],
            [-1, 0],
            [1, 0],
            [2, 0],
            [-2, 1],
            [-1, 1],
            [0, 1],
            [1, 1],
            [2, 1],
            [-1, 2],
            [0, 2],
            [1, 2]
        ]
    }

    shapeSelector.addEventListener('change', () => {
        // neighborOffsets = neighborOffsetOptions[shapeSelector.value];
        neighborOffset = shapeSelector.value;
        localStorage.setItem('shape', shapeSelector.value);
        determineAndSetPresetIfAny();
    });

    if (localStorage.getItem('shape')) {
        shapeSelector.value = localStorage.getItem('shape');
        neighborOffset = shapeSelector.value;
        neighborOffsets = neighborOffsetOptions[shapeSelector.value];
    }

    function iterateNeighbors(r, c, callback) {
        // for (let dr = -1; dr <= 1; dr++) {
        //     for (let dc = -1; dc <= 1; dc++) {
        //         if (dr === 0 && dc === 0) continue;
        //         const nr = r + dr;
        //         const nc = c + dc;
        //         if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        //             callback(nr, nc);
        //         }
        //     }
        // }
        for (let i = 0; i < neighborOffsets.length; i++) {
            const nr = r + neighborOffsets[i][0];
            const nc = c + neighborOffsets[i][1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                callback(nr, nc);
            }
        }
    }

    function determineAndSetPresetIfAny() {
        // check the current settings and compare it with the presets
        // if it matches a preset, set the preset selector to that preset
        // if it doesn't match any preset, set the preset selector to "Custom"
        const selectedPreset = presets.find(preset => {
            return ((parseInt(widthInput.value) === preset.width &&
                parseInt(heightInput.value) === preset.height) || (parseInt(widthInput.value) === preset.height &&
                    parseInt(heightInput.value) === preset.width)) &&
                parseInt(mineInput.value) === preset.mines &&
                difficulties[parseInt(difficultySlider.value)].tid === preset.difficulty &&
                shapeSelector.value === preset.shape;
        });
        if (selectedPreset) {
            presetSelector.value = selectedPreset.id;
        } else {
            presetSelector.value = "custom";
        }
    }

    // Number Inputs Event Listeners to Update Display Values and Validation
    widthInput.addEventListener('blur', () => {
        let value = parseInt(widthInput.value);
        if (isNaN(value)) value = 10;
        if (value < 3) value = 3;
        widthInput.value = value;
        widthValue.textContent = value;
        updateMineInputMax();
        if (!firstClickMade) {
            initGame();
        }
        determineAndSetPresetIfAny();
    });

    heightInput.addEventListener('blur', () => {
        let value = parseInt(heightInput.value);
        if (isNaN(value)) value = 10;
        if (value < 4) value = 4;
        heightInput.value = value;
        heightValue.textContent = value;
        updateMineInputMax();
        if (!firstClickMade) {
            initGame();
        }
        determineAndSetPresetIfAny();
    });

    mineInput.addEventListener('blur', () => {
        let value = parseInt(mineInput.value);
        const maxMines = calculateMaxMines();
        if (isNaN(value)) value = Math.floor(0.3 * maxMines);
        if (value < 1) value = 1;
        if (value > maxMines) value = maxMines;
        mineInput.value = value;
        mineValue.textContent = value;
        if (!firstClickMade) {
            initGame();
        }
        determineAndSetPresetIfAny();
    });

    difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficulties[difficultySlider.value].name;
        difficulty = difficulties[difficultySlider.value].tid;
        // save this in local storage
        localStorage.setItem('difficulty', difficulties[difficultySlider.value].tid);
        determineAndSetPresetIfAny();
    });

    function setClickLock(lock) {
        clickLock = lock;

        if (lock) {
            // Add the 'click-lock' class to apply styles
            boardElement.classList.add('click-lock');

            // Show the loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.add('active');
            }
        } else {
            // Remove the 'click-lock' class
            boardElement.classList.remove('click-lock');

            // Hide the loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
        }
    }

    // Function to calculate maximum mines based on board size (80% of total cells)
    function calculateMaxMines() {
        let cols = parseInt(widthInput.value);
        let rows = parseInt(heightInput.value);
        let shapeUsed = shapeSelector.value;
        let shapeOffsetsUsed = neighborOffsetOptions[shapeUsed];
        return Math.floor(rows * cols - shapeOffsetsUsed.length - 1);
    }

    // Function to update the max attribute of the mine input
    function updateMineInputMax() {
        const maxMines = calculateMaxMines();
        mineInput.max = maxMines;
        if (parseInt(mineInput.value) > maxMines) {
            mineInput.value = maxMines;
            mineValue.textContent = maxMines;
        }
    }

    determineAndSetPresetIfAny();

    initGame();

    function openSettings() {
        settingsMenu.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSettings() {
        settingsMenu.classList.remove('open');
        overlay.classList.remove('active');
    }

    function initGame() {
        setClickLock(false);
        // Retrieve current settings
        cols = parseInt(widthInput.value);
        rows = parseInt(heightInput.value);
        mineCount = parseInt(mineInput.value);
        difficulty = difficulties[parseInt(difficultySlider.value)].tid;
        highlightNeighborsEnabled = highlightNeighborsCheckbox.checked;
        highlightAssist = highlightAssistCheckbox.checked;
        neighborOffset = shapeSelector.value;
        neighborOffsets = neighborOffsetOptions[shapeSelector.value];

        // save settings in local storage
        localStorage.setItem('width', cols);
        localStorage.setItem('height', rows);
        localStorage.setItem('mines', mineCount);
        localStorage.setItem('difficulty', difficulty);
        localStorage.setItem('highlightNeighbors', highlightNeighborsEnabled);
        localStorage.setItem('highlightAssist', highlightAssist);
        localStorage.setItem('shape', neighborOffset);

        board = [];
        isGameOver = false;
        flagsUsed = 0;
        firstClickMade = false;
        flagCountDisplay.textContent = mineCount - flagsUsed;

        boardElement.innerHTML = '';

        // Initialize Board Data Structure
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

        // Create Board UI
        for (let r = 0; r < rows; r++) {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
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

        // Ctrl or Shift click or Right click to flag
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

        if (cell.flagged && currentAction === "flag") {
            toggleFlag(r, c);
        }
    }

    async function handleMouseUp(e) {
        if (isGameOver) return;
        const r = parseInt(e.currentTarget.dataset.row);
        const c = parseInt(e.currentTarget.dataset.col);
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);

        // If we mouseup on the same cell that was pressed, reveal it
        if (currentPressedCell && currentPressedCell.r === r && currentPressedCell.c === c) {
            cellEl.classList.remove('pressed');
            currentPressedCell = null;
            if (currentAction === "flag") {
                toggleFlag(r, c);
            } else {
                if (!cell.revealed && !cell.flagged) {
                    if (!firstClickMade) {
                        setClickLock(true);
                        await placeMinesAvoiding(r, c);
                        calculateAdjacentMines();
                        firstClickMade = true;
                        setClickLock(false);
                    }
                    revealCell(r, c);
                    checkWin();
                } else if (cell.revealed) {
                    // If already revealed, try chording
                    chordIfPossible(r, c);
                }
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

    async function placeMinesAvoiding(r, c) {
        // Assuming runGenerator is your custom mine placement function
        // which takes columns, rows, mineCount, firstClickCol, firstClickRow, and difficulty
        let generatedBoard = await raceRunGenerator(cols, rows, mineCount, c, r, difficulty, neighborOffsets, numberOfWorkers = determineOptimalWorkerCount('cpu'), timeoutDuration = 60000);
        // let generatedBoard = runGenerator(cols, rows, mineCount, c, r, difficulty, neighborOffsets);
        // let status = solveBoard(generatedBoard, c, r, {
        //     bfConE1: true,
        //     bfConE2: true,
        //     bfConE3: false,
        // }, neighborOffsets);
        // console.log(status);
        // let steps = status.steps;
        // let stepCounts = {};
        // for (let i = 0; i < steps.length; i++) {
        //     if (stepCounts[steps[i]] == undefined) {
        //         stepCounts[steps[i]] = 0;
        //     }
        //     stepCounts[steps[i]]++;
        // }
        // console.log(stepCounts);
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
        iterateNeighbors(r, c, (nr, nc) => {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (board[nr][nc].mine) count++;
            }
        });
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
        recalculateHighlightAssist(r, c);
    }

    function revealNeighbors(r, c) {
        iterateNeighbors(r, c, (nr, nc) => {
            revealSafe(nr, nc);
        });
    }

    function revealSafe(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        const cell = board[r][c];
        if (!cell.revealed && !cell.mine && !cell.flagged) {
            revealCell(r, c);
        }
    }

    function recalculateHighlightAssist(r, c) {
        if (!highlightAssist) return;
        // count mine neighbors and flagged neighbors
        const cell = board[r][c];
        if (!cell.revealed /*|| cell.adjacentMines === 0*/) return;
        if (cell.mine) return;
        const cellEl = getCellElement(r, c);
        let flaggedCount = 0;
        iterateNeighbors(r, c, (nr, nc) => {
            const neighbor = board[nr][nc];
            if (neighbor.flagged) flaggedCount++;
        });
        let status = null;
        if (flaggedCount === cell.adjacentMines) {
            status = "justright";
        } else if (flaggedCount > cell.adjacentMines) {
            status = "toomuch";
        }
        cellEl.classList.remove('highlightassisttoomuch');
        cellEl.classList.remove('highlightassistjustright');
        if (status != null) {
            cellEl.classList.add('highlightassist' + status);
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
        iterateNeighbors(r, c, (nr, nc) => {
            recalculateHighlightAssist(nr, nc);
        });
    }

    function chordIfPossible(r, c) {
        const cell = board[r][c];
        if (!cell.revealed || cell.adjacentMines === 0) return;

        let flaggedCount = 0;
        let hiddenNeighbors = [];
        iterateNeighbors(r, c, (nr, nc) => {
            const neighbor = board[nr][nc];
            if (neighbor.flagged) flaggedCount++;
            else if (!neighbor.revealed) hiddenNeighbors.push({ r: nr, c: nc });
        });

        // If the number of flagged neighbors equals the cell's number, reveal all other hidden neighbors
        if (flaggedCount === cell.adjacentMines && highlightNeighborsEnabled) {
            for (const n of hiddenNeighbors) {
                revealCell(n.r, n.c);
            }
            checkWin();
        }
    }

    function highlightNeighbors(r, c, highlight) {
        if (!highlightNeighborsEnabled) return;
        for (let hc of highlightedCells) {
            hc.classList.remove('highlight');
        }
        highlightedCells = [];
        iterateNeighbors(r, c, (nr, nc) => {
            const cellEl = getCellElement(nr, nc);
            if (highlight && !board[nr][nc].revealed) {
                cellEl.classList.add('highlight');
                highlightedCells.push(cellEl);
            } else {
                cellEl.classList.remove('highlight');
            }
        });
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
            // Optionally, you can display a game over message here
            // alert('Game Over! You hit a mine.');
        } else {
            // Optionally, you can display a win message here
            // alert('Congratulations! You won!');
            // Flag all remaining mines
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].mine && !board[r][c].flagged) {
                        toggleFlag(r, c, true);
                    }
                    if (board[r][c].mine) {
                        const cellEl = getCellElement(r, c);
                        cellEl.classList.add('correct');
                    }
                }
            }
        }
    }
});