function gIterateNeighbors(board, x, y, callback) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) {
                continue;
            }
            let newX = x + i;
            let newY = y + j;
            if (newX >= 0 && newX < board.length && newY >= 0 && newY < board[0].length) {
                callback(newX, newY);
            }
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

function gCountAdjacentMines(board, x, y) {
    let count = 0;
    gIterateNeighbors(board, x, y, (newX, newY) => {
        if (board[newX][newY] == "x") {
            count++;
        }
    });
    return count;
}

function gCountAdjacentFlags(visibleBoard, x, y) {
    let count = 0;
    gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
        if (visibleBoard[newX][newY] == "f") {
            count++;
        }
    });
    return count;
}

function findNumberCellsWithUnopenedNeighbors(visibleBoard) {
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
        gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
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

function createMapsOfNeighbors(visibleBoard, numberCells) {
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
        gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
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

function solveBoard(board, startX, startY, capabilities) {
    let stepsUsed = [];
    let visibleBoard = [];
    for (let i = 0; i < board.length; i++) {
        let column = [];
        for (let j = 0; j < board[i].length; j++) {
            column.push("-");
        }
        visibleBoard.push(column);
    }
    let nMines = gCountAdjacentMines(board, startX, startY);
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
        gIterateBoard(visibleBoard, (x, y) => {
            if (visibleBoard[x][y] == "-") {
                return;
            }
            if (visibleBoard[x][y] == "f") {
                return;
            }
            let nFlags = 0;
            let nUnopened = 0;
            gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
                if (visibleBoard[newX][newY] == "f") {
                    nFlags++;
                } else if (visibleBoard[newX][newY] == "-") {
                    nUnopened++;
                }
            });
            if (nFlags == visibleBoard[x][y]) {
                gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
                    if (visibleBoard[newX][newY] == "-") {
                        toClick.push([newX, newY]);
                        stepsUsed.push("d0 click");
                    }
                });
            } else if (nFlags + nUnopened == visibleBoard[x][y]) {
                gIterateNeighbors(visibleBoard, x, y, (newX, newY) => {
                    if (visibleBoard[newX][newY] == "-") {
                        toFlag.push([newX, newY]);
                        stepsUsed.push("d0 flag");
                    }
                });
            }
        });
        let numberCells;
        let mapUnopenedToNumbers;
        let mapNumbersToUnopened;
        if (toClick.length == 0 && toFlag.length == 0 && (capabilities.bfConE1 || capabilities.bfConE2)) {
            numberCells = findNumberCellsWithUnopenedNeighbors(visibleBoard);
            [mapUnopenedToNumbers, mapNumbersToUnopened] = createMapsOfNeighbors(visibleBoard, numberCells);
        }
        if (toClick.length == 0 && toFlag.length == 0 && capabilities.bfConE1) {
            // console.log(numberCells);
            for (let i = 0; i < numberCells.length; i++) {
                let [x, y] = numberCells[i];
                // console.log(x, y);
                let variablePositions = mapNumbersToUnopened[x][y];
                let initialVariableIds = [];
                // console.log(variablePositions);
                for (let j = 0; j < variablePositions.length; j++) {
                    initialVariableIds.push(j);
                }
                let constraints = [
                    {
                        eq: true,
                        value: visibleBoard[x][y] - gCountAdjacentFlags(visibleBoard, x, y),
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
                    value -= gCountAdjacentFlags(visibleBoard, numberCell[0], numberCell[1]);
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
                    for (let j = 0; j < variablePositions.length; j++) {
                        initialVariableIds.push(j);
                    }
                    let constraints = [
                        {
                            eq: true,
                            value: visibleBoard[x][y] - gCountAdjacentFlags(visibleBoard, x, y),
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
                        value -= gCountAdjacentFlags(visibleBoard, numberCell[0], numberCell[1]);
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
            visibleBoard[x][y] = gCountAdjacentMines(board, x, y);
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

function generateRandomBoard(width, height, nMines, startX, startY) {
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
        if (Math.abs(x - startX) <= 1 && Math.abs(y - startY) <= 1) {
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

function pickMinePosition(board, clickX, clickY) {
    while (true) {
        let x = Math.floor(Math.random() * board.length);
        let y = Math.floor(Math.random() * board[0].length);
        if (Math.abs(x - clickX) <= 1 && Math.abs(y - clickY) <= 1) {
            continue;
        }
        if (board[x][y] == "x") {
            continue;
        }
        return [x, y];
    }
}

function runGenerator(width, height, nMines, clickX, clickY) {
    let capabilities = {
        bfConE1: false,
        bfConE2: true,
        bfConE3: false,
    }
    let numMinesPlaced = 0;
    let nFailedAttempts = 0;
    // attempt to caluculate density of mines we can confidently place
    // randomly while still being able to solve the board
    let density = 0;
    let nMinesImmediate = Math.floor(nMines * density);
    nMinesImmediate = Math.min(nMinesImmediate, nMines);
    let genImmediate = true;
    let board = generateRandomBoard(width, height, nMinesImmediate, clickX, clickY);
    let status;
    while (numMinesPlaced < nMines) {
        let [x, y] = pickMinePosition(board, clickX, clickY);
        board[x][y] = "x";
        // printBoard(board);
        status = solveBoard(board, clickX, clickY, capabilities);
        if (status.success) {
            numMinesPlaced++;
            nFailedAttempts = 0;
            genImmediate = false;
        } else {
            board[x][y] = "-"
            nFailedAttempts++;
            if (status.reason == "impossible") {
                console.error("Impossible to make it work");
                break
            }
        }
        if (nFailedAttempts > 20 || genImmediate) {
            board = generateRandomBoard(width, height, nMinesImmediate, clickX, clickY);
            genImmediate = true;
            numMinesPlaced = 0;
            nFailedAttempts = 0;
        }
    }
    // console.log(status.steps);
    // count how many of each step there were in the steps
    let steps = status.steps;
    let stepCounts = {};
    for (let i = 0; i < steps.length; i++) {
        if (stepCounts[steps[i]] == undefined) {
            stepCounts[steps[i]] = 0;
        }
        stepCounts[steps[i]]++;
    }
    // console.log(stepCounts);
    return board;
    // while (true) {
    //     let board = generateRandomBoard(width, height, nMines, clickX, clickY);
    //     printBoard(board);
    //     let status = solveBoard(board, clickX, clickY, capabilities);
    //     if (status.success) {
    //         return board;
    //     }
    // }

}