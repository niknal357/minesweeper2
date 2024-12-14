function gIterateNeighbors(board, x, y, shape, callback) {
    // for (let i = -1; i <= 1; i++) {
    //     for (let j = -1; j <= 1; j++) {
    //         if (i == 0 && j == 0) {
    //             continue;
    //         }
    //         let newX = x + i;
    //         let newY = y + j;
    //         if (newX >= 0 && newX < board.length && newY >= 0 && newY < board[0].length) {
    //             callback(newX, newY);
    //         }
    //     }
    // }
    for (let i = 0; i < shape.length; i++) {
        let newX = x + shape[i][0];
        let newY = y + shape[i][1];
        if (newX >= 0 && newX < board.length && newY >= 0 && newY < board[0].length) {
            callback(newX, newY);
        }
    }
}

function gIterateBoard(board, callback) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            callback(i, j);
        }
    }
}

function gCountAdjacentMines(board, x, y, shape) {
    let count = 0;
    gIterateNeighbors(board, x, y, shape, (newX, newY) => {
        if (board[newX][newY] == "x") {
            count++;
        }
    });
    return count;
}

function gCountAdjacentFlags(visibleBoard, x, y, shape) {
    let count = 0;
    gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
        if (visibleBoard[newX][newY] == "f") {
            count++;
        }
    });
    return count;
}

function findNumberCellsWithUnopenedNeighbors(visibleBoard, shape) {
    let numberCells = [];
    gIterateBoard(visibleBoard, (x, y) => {
        if (visibleBoard[x][y] == "-") {
            return;
        }
        if (visibleBoard[x][y] == "f") {
            return;
        }
        let nFlags = 0;
        let nUnopened = 0;
        gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
            if (visibleBoard[newX][newY] == "-") {
                nUnopened++;
            }
        });
        if (nUnopened > 0) {
            numberCells.push([x, y]);
        }
    });
    return numberCells;
}

function createMapsOfNeighbors(visibleBoard, numberCells, shape) {
    let mapUnopenedToNumbers = [];
    let mapNumbersToUnopened = [];
    for (let i = 0; i < visibleBoard.length; i++) {
        let column = [];
        for (let j = 0; j < visibleBoard[i].length; j++) {
            column.push([]);
        }
        mapUnopenedToNumbers.push(column);
        column = [];
        for (let j = 0; j < visibleBoard[i].length; j++) {
            column.push([]);
        }
        mapNumbersToUnopened.push(column);
    }
    for (let i = 0; i < numberCells.length; i++) {
        let [x, y] = numberCells[i];
        gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
            if (visibleBoard[newX][newY] == "-") {
                mapNumbersToUnopened[x][y].push([newX, newY]);
                mapUnopenedToNumbers[newX][newY].push([x, y]);
            }
        });
    }
    return [mapUnopenedToNumbers, mapNumbersToUnopened];
}

function findAllUniqueAdjacencies(origin, transform) {
    let adjancencies = [];
    for (let i = 0; i < origin.length; i++) {
        let adjacentNodes = transform[origin[i][0]][origin[i][1]];
        for (let j = 0; j < adjacentNodes.length; j++) {
            let node = adjacentNodes[j];
            if (adjancencies.some((elem) => elem[0] == node[0] && elem[1] == node[1])) {
                continue;
            }
            adjancencies.push(node);
        }
    }
    return adjancencies;
}

function constraintSolve(constraints, numVariables) {
    let consistencyVector = null;
    let consistentValues = 1;
    for (let i = 0; i < Math.pow(2, numVariables); i++) {
        let combination = [];
        for (let j = 0; j < numVariables; j++) {
            if (i & (1 << j)) {
                combination.push(1);
            } else {
                combination.push(0);
            }
        }
        let valid = true;
        for (let j = 0; j < constraints.length; j++) {
            let constraint = constraints[j];
            let sum = 0;
            for (let k = 0; k < constraint.variables.length; k++) {
                sum += combination[constraint.variables[k]];
            }
            if (constraint.eq && sum != constraint.value) {
                valid = false;
                break;
            }
            if (!constraint.eq && sum > constraint.value) {
                valid = false;
                break;
            }
        }
        if (valid) {
            // console.log(combination);
            if (consistencyVector == null) {
                consistencyVector = combination;
                consistentValues = consistencyVector.length;
            } else {
                for (let j = 0; j < consistencyVector.length; j++) {
                    if (consistencyVector[j] !== null && consistencyVector[j] != combination[j]) {
                        consistencyVector[j] = null;
                        consistentValues--;
                    }
                }
            }
            if (consistentValues == 0) {
                break;
            }
        }
    }
    return [consistencyVector, consistentValues];
}

function solveBoard(board, startX, startY, capabilities, shape) {
    let stepsUsed = [];
    let visibleBoard = [];
    for (let i = 0; i < board.length; i++) {
        let column = [];
        for (let j = 0; j < board[i].length; j++) {
            column.push("-");
        }
        visibleBoard.push(column);
    }
    let nMines = gCountAdjacentMines(board, startX, startY, shape);
    visibleBoard[startX][startY] = nMines;
    let numMinesFound = 0;
    let numMinesTotal = 0;
    gIterateBoard(board, (x, y) => {
        if (board[x][y] == "x") {
            numMinesTotal++;
        }
    });
    let toClick = [];
    let toFlag = [];
    while (numMinesFound < numMinesTotal) {
        // printBoard(visibleBoard);

        let totalUnopened = 0;

        gIterateBoard(visibleBoard, (x, y) => {
            if (visibleBoard[x][y] == "-") {
                totalUnopened++;
                return;
            }
            if (visibleBoard[x][y] == "f") {
                return;
            }
            let nFlags = 0;
            let nUnopened = 0;
            gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
                if (visibleBoard[newX][newY] == "f") {
                    nFlags++;
                } else if (visibleBoard[newX][newY] == "-") {
                    nUnopened++;
                }
            });
            if (nFlags == visibleBoard[x][y]) {
                gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
                    if (visibleBoard[newX][newY] == "-") {
                        toClick.push([newX, newY]);
                        if (visibleBoard[x][y] != 0) {
                            stepsUsed.push("d0 click");
                        }
                    }
                });
            } else if (nFlags + nUnopened == visibleBoard[x][y]) {
                gIterateNeighbors(visibleBoard, x, y, shape, (newX, newY) => {
                    if (visibleBoard[newX][newY] == "-") {
                        toFlag.push([newX, newY]);
                        stepsUsed.push("d0 flag");
                    }
                });
            }

        });
        // console.log(totalUnopened, numMinesTotal, numMinesFound);
        if (totalUnopened == numMinesTotal - numMinesFound) {
            gIterateBoard(visibleBoard, (x, y) => {
                if (visibleBoard[x][y] == "-") {
                    toFlag.push([x, y]);
                    stepsUsed.push("c flag");
                }
            });
        }
        let numberCells;
        let mapUnopenedToNumbers;
        let mapNumbersToUnopened;
        if (toClick.length == 0 && toFlag.length == 0 && (capabilities.bfConE1 || capabilities.bfConE2)) {
            numberCells = findNumberCellsWithUnopenedNeighbors(visibleBoard, shape);
            [mapUnopenedToNumbers, mapNumbersToUnopened] = createMapsOfNeighbors(visibleBoard, numberCells, shape);
        }
        if (toClick.length == 0 && toFlag.length == 0 && capabilities.bfConE1) {
            // console.log(numberCells);
            for (let i = 0; i < numberCells.length; i++) {
                let [x, y] = numberCells[i];
                // console.log(x, y);
                let variablePositions = mapNumbersToUnopened[x][y];
                if (variablePositions.length > 3) {
                    continue;
                }
                let initialVariableIds = [];
                // console.log(variablePositions);
                for (let j = 0; j < variablePositions.length; j++) {
                    initialVariableIds.push(j);
                }
                let constraints = [
                    {
                        eq: true,
                        value: visibleBoard[x][y] - gCountAdjacentFlags(visibleBoard, x, y, shape),
                        variables: initialVariableIds
                    }
                ];
                // we want to find all unopened neighbors of this number cell
                // then, for every number cell that pairs at least one of our
                // unopened neighbors, we add a constraint that the sum of the
                // mines placed must be less than or equal to the value of the
                // number cell. the exception is our original number cell, which
                // will expect the sum of the mines placed to be exactly equal
                let numberCellsAdded = findAllUniqueAdjacencies(variablePositions, mapUnopenedToNumbers);
                for (let j = 0; j < numberCellsAdded.length; j++) {
                    let numberCell = numberCellsAdded[j];
                    if (numberCell[0] == x && numberCell[1] == y) {
                        continue;
                    }
                    let value = visibleBoard[numberCell[0]][numberCell[1]];
                    value -= gCountAdjacentFlags(visibleBoard, numberCell[0], numberCell[1], shape);
                    let variableIds = [];
                    let unopenedAroundNumber = mapNumbersToUnopened[numberCell[0]][numberCell[1]];
                    for (let k = 0; k < unopenedAroundNumber.length; k++) {
                        let idx = variablePositions.findIndex((elem) => elem[0] == unopenedAroundNumber[k][0] && elem[1] == unopenedAroundNumber[k][1]);
                        if (idx != -1) {
                            variableIds.push(idx);
                        }
                    }
                    if (value < variableIds.length) {
                        constraints.push({
                            eq: false,
                            value: value,
                            variables: variableIds
                        });
                    }
                }
                // console.log(variablePositions);
                // console.log(constraints);
                let [consistencyVector, consistentValues] = constraintSolve(constraints, variablePositions.length);
                // console.log(consistencyVector);
                if (consistentValues > 0 && consistencyVector != null) {
                    for (let i = 0; i < variablePositions.length; i++) {
                        if (consistencyVector[i] == 1) {
                            toFlag.push(variablePositions[i]);
                            stepsUsed.push("d1 flag");
                        } else if (consistencyVector[i] == 0) {
                            toClick.push(variablePositions[i]);
                            stepsUsed.push("d1 click");
                        }
                    }
                    break;
                }
                // return {
                //     success: false,
                //     reason: "impossible"
                // }
            }
        }
        if (toClick.length == 0 && toFlag.length == 0) {
            if (capabilities.bfConE2) {
                for (let i = 0; i < numberCells.length; i++) {
                    let [x, y] = numberCells[i];
                    let unopenedAroundNumber = mapNumbersToUnopened[x][y];
                    let numberNodes2 = findAllUniqueAdjacencies(unopenedAroundNumber, mapUnopenedToNumbers);
                    let variablePositions = findAllUniqueAdjacencies(numberNodes2, mapNumbersToUnopened);
                    let initialVariableIds = [];
                    for (let j = 0; j < unopenedAroundNumber.length; j++) {
                        let idx = variablePositions.findIndex((elem) => elem[0] == unopenedAroundNumber[j][0] && elem[1] == unopenedAroundNumber[j][1]);
                        if (idx != -1) {
                            initialVariableIds.push(idx);
                        }
                    }
                    let constraints = [
                        {
                            eq: true,
                            value: visibleBoard[x][y] - gCountAdjacentFlags(visibleBoard, x, y, shape),
                            variables: initialVariableIds
                        }
                    ];
                    let numberCellsAdded = findAllUniqueAdjacencies(variablePositions, mapUnopenedToNumbers);
                    for (let j = 0; j < numberCellsAdded.length; j++) {
                        let numberCell = numberCellsAdded[j];
                        if (numberCell[0] == x && numberCell[1] == y) {
                            continue;
                        }
                        let value = visibleBoard[numberCell[0]][numberCell[1]];
                        value -= gCountAdjacentFlags(visibleBoard, numberCell[0], numberCell[1], shape);
                        let variableIds = [];
                        let unopenedAroundNumber = mapNumbersToUnopened[numberCell[0]][numberCell[1]];
                        for (let k = 0; k < unopenedAroundNumber.length; k++) {
                            let idx = variablePositions.findIndex((elem) => elem[0] == unopenedAroundNumber[k][0] && elem[1] == unopenedAroundNumber[k][1]);
                            if (idx != -1) {
                                variableIds.push(idx);
                            }
                        }
                        if (value < variableIds.length) {
                            constraints.push({
                                eq: false,
                                value: value,
                                variables: variableIds
                            });
                        }
                    }
                    // console.log(variablePositions);
                    // console.log(constraints);
                    if (numMinesTotal - numMinesFound > variablePositions.length) {
                        constraints.push({
                            eq: false,
                            value: numMinesTotal - numMinesFound,
                            variables: initialVariableIds
                        });
                    }
                    let [consistencyVector, consistentValues] = constraintSolve(constraints, variablePositions.length);
                    // console.log(consistencyVector);
                    if (consistentValues > 0 && consistencyVector != null) {
                        for (let i = 0; i < variablePositions.length; i++) {
                            if (consistencyVector[i] == 1) {
                                toFlag.push(variablePositions[i]);
                                stepsUsed.push("d2 flag");
                            } else if (consistencyVector[i] == 0) {
                                toClick.push(variablePositions[i]);
                                stepsUsed.push("d2 click");
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (toClick.length == 0 && toFlag.length == 0) {
            return {
                success: false,
                reason: "stuck"
            }
        }
        while (toClick.length > 0) {
            let [x, y] = toClick.pop();
            if (board[x][y] == "x") {
                console.error("Clicked mine at", x, y);
                return {
                    success: false,
                    reason: "clicked mine"
                }
            }
            visibleBoard[x][y] = gCountAdjacentMines(board, x, y, shape);
        }
        while (toFlag.length > 0) {
            let [x, y] = toFlag.pop();
            if (visibleBoard[x][y] == "f") {
                continue;
            }
            visibleBoard[x][y] = "f";
            if (board[x][y] != "x") {
                console.error("Flagged non-mine at", x, y);
                return {
                    success: false,
                    reason: "flagged non-mine"
                }
            }
            numMinesFound++;
        }
    }
    return {
        success: true,
        steps: stepsUsed
    }
}

function generateRandomBoard(width, height, nMines, startX, startY, shape) {
    let board = [];
    for (let i = 0; i < width; i++) {
        let column = [];
        for (let j = 0; j < height; j++) {
            column.push("-");
        }
        board.push(column);
    }
    let nMinesPlaced = 0;
    while (nMinesPlaced < nMines) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);
        if (x == startX && y == startY) {
            continue;
        }
        let skip = false;
        for (let i = 0; i < shape.length; i++) {
            let newX = x + shape[i][0];
            let newY = y + shape[i][1];
            if (newX == startX && newY == startY) {
                skip = true;
                break;
            }
        }
        if (skip) {
            continue;
        }
        if (board[x][y] != "x") {
            board[x][y] = "x";
            nMinesPlaced++;
        }
    }
    return board;
}

function printBoard(board) {
    let output = "";
    for (let i = 0; i < board[0].length; i++) {
        let row = "";
        for (let j = 0; j < board.length; j++) {
            if (j > 0) {
                row += " ";
            }
            row += board[j][i];
        }
        output += row;
        if (i < board[0].length - 1) {
            output += "\n";
        }
    }
    console.log(output);
}

function makeEmptyBoard(width, height) {
    let board = [];
    for (let i = 0; i < width; i++) {
        let column = [];
        for (let j = 0; j < height; j++) {
            column.push("-");
        }
        board.push(column);
    }
    return board;
}

/**
 * Picks a mine position on the Minesweeper board avoiding clumping at edges and ensuring even distribution.
 *
 * @param {Array<Array<string|null>>} board - The current Minesweeper board.
 * @param {number} clickX - The X-coordinate of the initial click.
 * @param {number} clickY - The Y-coordinate of the initial click.
 * @param {Object} [options] - Optional parameters for customization.
 * @param {number} [options.numRegionsX=2] - Number of regions along the X-axis.
 * @param {number} [options.numRegionsY=2] - Number of regions along the Y-axis.
 * @returns {[number, number]} - The selected mine position as [x, y].
 * @throws {Error} - If no valid cells are available for mine placement.
 */
function pickMinePosition(board, clickX, clickY, shape, options = {}) {
    const width = board.length;
    if (width === 0) throw new Error("Board width cannot be zero.");
    const height = board[0].length;
    if (height === 0) throw new Error("Board height cannot be zero.");

    const numRegionsX = options.numRegionsX || 2;
    const numRegionsY = options.numRegionsY || 2;
    const regionWidth = Math.ceil(width / numRegionsX);
    const regionHeight = Math.ceil(height / numRegionsY);

    // Calculate center
    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);

    // Function to determine region indices for a cell
    const getRegion = (x, y) => {
        const regionX = Math.floor(x / regionWidth);
        const regionY = Math.floor(y / regionHeight);
        // Ensure indices are within bounds
        return [
            Math.min(regionX, numRegionsX - 1),
            Math.min(regionY, numRegionsY - 1)
        ];
    };

    // Compute current mine counts per region based on the board
    const mineCountMap = Array.from({ length: numRegionsX }, () => Array(numRegionsY).fill(0));
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (board[x][y] === "x") {
                const [regionX, regionY] = getRegion(x, y);
                mineCountMap[regionX][regionY]++;
            }
        }
    }

    // Identify all eligible cells
    const candidates = [];
    let totalWeight = 0;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (x == clickX && y == clickY) {
                continue;
            }

            // Skip cell if shape[n] + click is where we are
            let skip = false;
            for (let i = 0; i < shape.length; i++) {
                let newX = x + shape[i][0];
                let newY = y + shape[i][1];
                if (newX == clickX && newY == clickY) {
                    skip = true;
                    break;
                }
            }
            if (skip) {
                continue;
            }

            // Skip cells that already have a mine
            if (board[x][y] === "x") {
                continue;
            }

            // Determine region
            const [regionX, regionY] = getRegion(x, y);
            const currentMineCount = mineCountMap[regionX][regionY];
            const maxMinesPerRegion = Math.ceil((width * height) / (numRegionsX * numRegionsY)); // Optional: Adjust as needed

            // Calculate region density weight (favor regions with fewer mines)
            // Using inverse proportionality; you can adjust the formula as needed
            const regionWeight = 1 / (currentMineCount + 1); // +1 to avoid division by zero

            // Calculate centrality weight (closer to center -> higher weight)
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const centralityWeight = 1 - (distance / maxDistance); // Normalize to [0,1]

            // Total weight for the cell
            const weight = centralityWeight * regionWeight;

            if (weight > 0) { // Only consider cells with positive weight
                candidates.push({ x, y, weight });
                totalWeight += weight;
            }
        }
    }

    if (candidates.length === 0) {
        throw new Error("No valid cells available to place a mine.");
    }

    // Perform weighted random selection
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    for (let cell of candidates) {
        cumulative += cell.weight;
        if (rand < cumulative) {
            return [cell.x, cell.y];
        }
    }

    // Fallback (due to floating-point precision)
    const lastCell = candidates[candidates.length - 1];
    return [lastCell.x, lastCell.y];
}



function runGenerator(width, height, nMines, clickX, clickY, difficulty, shape) {
    // console.log(difficulty);
    if (difficulty == "unlocked") {
        return generateRandomBoard(width, height, nMines, clickX, clickY, shape);
    }
    let capabilities;
    if (difficulty == "easy") {
        capabilities = {
            bfConE1: false,
            bfConE2: false,
            bfConE3: false,
        }
    } else if (difficulty == "medium") {
        capabilities = {
            bfConE1: true,
            bfConE2: false,
            bfConE3: false,
        }
    } else if (difficulty == "hard") {
        capabilities = {
            bfConE1: true,
            bfConE2: true,
            bfConE3: false,
        }
    }
    while (true) {
        let nFailedAttempts = 0;
        // attempt to caluculate density of mines we can confidently place
        // randomly while still being able to solve the board
        let density = 0.1;
        let nMinesImmediate = Math.floor(nMines * density);
        nMinesImmediate = Math.min(nMinesImmediate, nMines);
        let board;
        do {
            board = generateRandomBoard(width, height, nMinesImmediate, clickX, clickY, shape);
        } while (!solveBoard(board, clickX, clickY, capabilities, shape).success);
        let numMinesPlaced = nMinesImmediate;
        let status;
        while (numMinesPlaced < nMines) {
            let [x, y] = pickMinePosition(board, clickX, clickY, shape);
            board[x][y] = "x";
            // printBoard(board);
            status = solveBoard(board, clickX, clickY, capabilities, shape);
            if (status.success) {
                numMinesPlaced++;
                nFailedAttempts = 0;
            } else {
                board[x][y] = "-"
                nFailedAttempts++;
                if (status.reason == "impossible") {
                    console.error("Impossible to make it work");
                    break
                }
            }
            if (nFailedAttempts > 50) {
                do {
                    board = generateRandomBoard(width, height, nMinesImmediate, clickX, clickY, shape);
                } while (!solveBoard(board, clickX, clickY, capabilities, shape).success);
                numMinesPlaced = nMinesImmediate;
                nFailedAttempts = 0;
            }
        }
        // console.log(status.steps);
        // count how many of each step there were in the steps
        // printBoard(board);
        let steps = status.steps;
        let stepCounts = {
            "d0 click": 0,
            "d0 flag": 0,
            "d1 click": 0,
            "d1 flag": 0,
            "d2 click": 0,
            "d2 flag": 0,
        };
        for (let i = 0; i < steps.length; i++) {
            if (stepCounts[steps[i]] == undefined) {
                stepCounts[steps[i]] = 0;
            }
            stepCounts[steps[i]]++;
        }
        // console.log(stepCounts);
        if (difficulty == "hard") {
            // calculate ratio of d2 flags to total flags
            let funkyRatio = (stepCounts["d2 flag"] + stepCounts["d2 click"]) / (stepCounts["d0 flag"] + stepCounts["d1 flag"] + stepCounts["d2 flag"] + stepCounts["d0 click"] + stepCounts["d1 click"] + stepCounts["d2 click"]);
            console.log(funkyRatio);
            if (funkyRatio > 0.1) {
                return board;
            }
        } else {
            return board;
        }
        // while (true) {
        //     let board = generateRandomBoard(width, height, nMines, clickX, clickY);
        //     printBoard(board);
        //     let status = solveBoard(board, clickX, clickY, capabilities);
        //     if (status.success) {
        //         return board;
        //     }
        // }
    }

}

// Listen for messages from the main thread
self.onmessage = function (event) {
    const { width, height, nMines, clickX, clickY, difficulty, shape } = event.data;
    try {
        const board = runGenerator(width, height, nMines, clickX, clickY, difficulty, shape);
        // Post the result back to the main thread
        self.postMessage({ success: true, board });
    } catch (error) {
        // Post the error back to the main thread
        self.postMessage({ success: false, error: error.message });
    }
};