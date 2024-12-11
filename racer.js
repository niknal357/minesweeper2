// racist.js

function determineOptimalWorkerCount(taskType) {
    const logicalCores = navigator.hardwareConcurrency || 4;

    if (taskType === 'cpu') {
        return logicalCores;
    } else if (taskType === 'io') {
        return logicalCores * 2;
    } else {
        return logicalCores;
    }
}

const difficultiesThatNeedOptimization = [0, 1];

/**
 * Function to race multiple Web Workers running the same task and return the first completed result.
 * @param {number} width - Width of the board.
 * @param {number} height - Height of the board.
 * @param {number} nMines - Number of mines.
 * @param {number} clickX - X-coordinate of the initial click.
 * @param {number} clickY - Y-coordinate of the initial click.
 * @param {number} difficulty - Difficulty level.
 * @param {number} numberOfWorkers - Number of workers to launch (default is 12).
 * @param {number} timeoutDuration - Maximum time to wait for a worker to respond in milliseconds (optional).
 * @returns {Promise<Object>} - Resolves with the first successful board or rejects with an error.
 */
function raceRunGenerator(width, height, nMines, clickX, clickY, difficulty, numberOfWorkers = 12, timeoutDuration = 60000) {
    if (!difficultiesThatNeedOptimization.includes(difficulty)) {
        return runGenerator(width, height, nMines, clickX, clickY, difficulty);
    }
    return new Promise((resolve, reject) => {
        let resolved = false;
        const workers = [];
        const results = [];
        const errors = [];

        // Optional timeout to prevent indefinite waiting
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                // Terminate all workers
                workers.forEach(worker => worker.terminate());
                reject(new Error('Race timed out. No workers completed in time.'));
            }
        }, timeoutDuration);

        // Handler to clean up workers after a result is obtained
        const handleResult = (result) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                // Terminate all other workers
                workers.forEach(worker => worker.terminate());
                resolve(result);
            }
        };

        // Handler to clean up workers after an error
        const handleError = (error) => {
            errors.push(error);
            // If all workers have errored, reject the promise
            if (errors.length === numberOfWorkers && !resolved) {
                resolved = true;
                clearTimeout(timeout);
                workers.forEach(worker => worker.terminate());
                reject(new Error('All workers failed.'));
            }
        };

        // Launch the specified number of workers
        for (let i = 0; i < numberOfWorkers; i++) {
            const worker = new Worker('generator.js'); // Ensure 'worker.js' is correctly referenced
            workers.push(worker);

            // Listen for messages from the worker
            worker.onmessage = function (event) {
                const { success, board, error } = event.data;
                if (success) {
                    handleResult(board);
                } else {
                    handleError(error);
                }
            };

            // Listen for errors from the worker
            worker.onerror = function (error) {
                handleError(error.message);
            };

            // Post the task data to the worker
            worker.postMessage({ width, height, nMines, clickX, clickY, difficulty });
        }
    });
}