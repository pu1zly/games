import { beatmaps } from "./beatmaps.js";
import {fishData} from "./fishData.js";

const noteContainer = document.getElementById("note-container");
const scoreDisplay = document.getElementById("score");
const beatmapDisplay = document.getElementById("beatmap-name");
const bgMusic = document.getElementById("bg-music");

const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const retryBtn = document.getElementById("retry-btn");
const songSelectBtn = document.getElementById("song-select-btn");
const mainMenuBtn = document.getElementById("main-menu-btn");
const mainMenu = document.getElementById("main-menu");
const gameContainer = document.getElementById("game-container");
const body = document.body;
const backBtn = document.getElementById("back-btn");

const resultsScreen = document.getElementById("results-screen");
const finalScoreDisplay = document.getElementById("final-score");
const retryFromResultsBtn = document.getElementById("retry-from-results-btn");
const mainMenuFromResultsBtn = document.getElementById("main-menu-from-results-btn");
const goBackSongSelectBtn = document.getElementById("go-back-song-select-btn");

let score = 0;
let notes = [];
let noteSpeed = 4;
let currentBeatmap = [];
let beatmapName = "";
let musicSrc = "";

let isPaused = false;
let animationFrame;
let selectedMap = null;
let selectedDifficulty = "";
let spawnTimeouts = [];
let isCountdownActive = false;

const hitzoneWidth = 45;
const hitzoneStartX = 190;

document.getElementById("easy-btn").addEventListener("click", () => setDifficulty("easy"));
document.getElementById("medium-btn").addEventListener("click", () => setDifficulty("medium"));
document.getElementById("hard-btn").addEventListener("click", () => setDifficulty("hard"));

function setDifficulty(level) {
    selectedDifficulty = level;
    mainMenu.style.display = "none";
    document.getElementById("song-menu").style.display = "block";

    body.classList.remove("easy-bg", "medium-bg", "hard-bg");
    body.classList.add(`${level}-bg`);

    showSongMenu(level);
}

function showSongMenu(level) {
    const songList = document.getElementById("song-list");
    songList.innerHTML = "";  // Clear the existing song list

    beatmaps[level].forEach(map => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("beatmap-item");

        const btn = document.createElement("button");
        btn.classList.add("beatmap-button");

        // Get the current high score for this map and difficulty level
        const bestScore = getHighScore(map.name, level);
        const maxScore = map.beats.length * 100; // Max score based on number of beats
        const grade = getScoreGrade(bestScore, maxScore);

        // Set button text with the map name, best score, and grade
        btn.textContent = `${map.name} — Best: ${bestScore} (${grade})`;

        btn.addEventListener("click", () => selectSong(map));
        wrapper.appendChild(btn);

        const info = document.createElement("div");
        info.classList.add("beatmap-info");

        const fish = fishData[map.name];

        if (fish) {
            info.innerHTML = `
                <h4><strong>${map.name}</strong></h4>
                <br>
                <img src="${map.fishImage}" alt="${map.name}" class="fish-preview">
                <p><strong>Scientific Name:</strong> ${fish.scientificName}</p>
                <br>
                <strong>Description:</strong> ${fish.description}</p>
                <br>
                <p><strong>Size:</strong> ${fish.size || 'Unknown'} </p>
            `;
        } else {
            info.innerHTML = `
                <h4>${map.name}</h4>
                <p>Fish data not available</p>
            `;
        }

        wrapper.appendChild(info);
        songList.appendChild(wrapper);
    });
}

document
    .getElementById("reset-scores-btn")
    .addEventListener("click", () => {
        if (
            !confirm(
                "Are you sure you want to reset _all_ high‑scores?"
            )
        )
            return;

        // Remove the entire highScores entry
        localStorage.removeItem("highScores");
        console.log("All high-scores cleared from localStorage.");

        // Refresh the song menu display so “Best: 0” appears everywhere
        if (selectedDifficulty) {
            showSongMenu(selectedDifficulty);
        }

        alert("All high‑scores have been reset!");
    });



function selectSong(map) {
    selectedMap = map;
    beatmapName = map.name;
    musicSrc = map.music;

    // --- normalize timing data so we only ever look at map.beats & map.bpm ---
    if (map.beats && map.bpm) {
        const beatDuration = 60000 / map.bpm;
        // convert each beat (in beats) to milliseconds
        currentBeatmap = map.beats.map(b => (map.offset || 0) + b * beatDuration);
    } else {
        // fallback if you ever have raw millisecond data in your beatmaps file:
        console.warn(`Beatmap "${map.name}" has no beats/bpm, starting with an empty map.`);
        currentBeatmap = [];
    }

    document.getElementById("song-menu").style.display = "none";
    gameContainer.style.display = "block";

    // set speed…
    if (selectedDifficulty === "easy") noteSpeed = 2;
    if (selectedDifficulty === "medium") noteSpeed = 4;
    if (selectedDifficulty === "hard") noteSpeed = 6;

    beatmapDisplay.textContent = `Currently Catching: ${beatmapName}`;
    startGame();
}


function startGame() {
    const countdownElem = document.getElementById("countdown");
    let count = 3;

    countdownElem.textContent = count;
    countdownElem.style.display = "block";
    isPaused = true; // Pause the game during countdown
    isCountdownActive = true;  // Set countdown active

    // Disable pause button during countdown
    pauseBtn.disabled = true;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownElem.textContent = count;
        } else if (count === 0) {
            countdownElem.textContent = "Start!";
        } else {
            clearInterval(countdownInterval);
            countdownElem.style.display = "none";
            isPaused = false; // Unpause when countdown finishes
            isCountdownActive = false;  // Set countdown inactive

            // Enable pause button after countdown ends
            pauseBtn.disabled = false;

            beginGameplay();  // Start the actual game
        }
    }, 1000);
}

function beginGameplay() {
    if (musicSrc) {
        bgMusic.src = musicSrc;
        bgMusic.currentTime = 0;
        bgMusic.play();
    }

    // Start spawning notes at the correct timings
    currentBeatmap.forEach((time) => {
        const timeout = setTimeout(() => {
            if (!isPaused) spawnNote();
        }, time);
        spawnTimeouts.push(timeout);
    });

    animationFrame = requestAnimationFrame(gameLoop);  // Start game loop
}

function gameLoop() {
    if (isPaused) return;  // Ensure the game loop does not continue when paused

    // Move notes based on their current x-position
    for (let i = notes.length - 1; i >= 0; i--) {
        let note = notes[i];
        note.x -= noteSpeed;  // Move the note leftward by the speed

        // Update the note's position
        note.elem.style.left = note.x + "px";

        // If note goes off-screen, remove it from the array and the DOM
        if (note.x < -20) {
            note.elem.remove();
            notes.splice(i, 1);  // Remove note from the array
        }
    }

    // Continue the game loop
    animationFrame = requestAnimationFrame(gameLoop);
}

function spawnNote() {
    const note = document.createElement("div");
    note.classList.add("note");
    note.style.left = "800px";  // Initial position of the note
    noteContainer.appendChild(note);

    // Push the note object into the notes array with its DOM element and initial position
    notes.push({
        elem: note,
        x: 800
    });
}


document.addEventListener("keydown", (e) => {
    const validKeys = ["KeyW", "KeyE"];
    if (validKeys.includes(e.code) && !isPaused) {
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (note.x > hitzoneStartX && note.x < hitzoneStartX + hitzoneWidth) {
                score += 100;
                note.elem.remove();
                notes.splice(i, 1);
                break;
            }
        }
        scoreDisplay.textContent = score;
    }

    if (e.code === "Escape") {
        if (!isPaused && !isCountdownActive) {
            pauseGame();
        }
    }
});

// Pause and resume
pauseBtn.addEventListener("click", pauseGame);

function pauseGame() {
    isPaused = true;
    bgMusic.pause();  // Pause the background music
    pauseOverlay.style.display = "flex";  // Show pause overlay
    cancelAnimationFrame(animationFrame);  // Stop the game loop

    // Clear spawn timeouts so no new notes are spawned
    spawnTimeouts.forEach(timeout => clearTimeout(timeout));
    spawnTimeouts = [];

    // Clear notes from the screen
    notes.forEach(note => note.elem.remove());
    notes = [];

    // Hide countdown during pause
    document.getElementById("countdown").style.display = "none";
}

// FULL reset logic for retry
function resetGame() {
    // Cancel game loop and reset animation frame
    cancelAnimationFrame(animationFrame);

    // Stop and reset music
    bgMusic.pause();
    bgMusic.currentTime = 0;

    // Clear all notes from the screen
    notes.forEach(note => note.elem.remove());
    notes = [];

    // Clear pending timeouts
    spawnTimeouts.forEach(timeout => clearTimeout(timeout));
    spawnTimeouts = [];

    // Reset score
    score = 0;
    scoreDisplay.textContent = score;

    // Hide overlays
    pauseOverlay.style.display = "none";

    // Reset game state
    isPaused = false;

    // Make sure visual elements are restored
    document.getElementById("countdown").style.display = "none";
    document.getElementById("note-bar").style.display = "block";
    document.getElementById("hitzone").style.display = "block";
    document.getElementById("note-container").style.display = "block";

    // Start game again
    startGame();
}


// Retry button to reset the game
retryBtn.addEventListener("click", () => {
    resetGame();  // Full reset and start the game from the beginning
});

// Song select from pause menu
songSelectBtn.addEventListener("click", () => {
    stopGame();  // Stop the game completely
    document.getElementById("song-menu").style.display = "block";  // Show song select menu
    pauseOverlay.style.display = "none";  // Hide the pause overlay
    gameContainer.style.display = "none";  // Hide the game container
});

// Main menu from pause menu
mainMenuBtn.addEventListener("click", () => {
    stopGame();  // Stop the game completely
    mainMenu.style.display = "block";  // Show the main menu
    gameContainer.style.display = "none";  // Hide the game container
    body.classList.remove("easy-bg", "medium-bg", "hard-bg");  // Reset background styles
});

// Back to Main Menu
backBtn.addEventListener("click", () => {
    document.getElementById("song-menu").style.display = "none";
    mainMenu.style.display = "block";
    body.classList.remove("easy-bg", "medium-bg", "hard-bg");
});

function stopGame() {
    // Call the pauseGame function to stop all game-related processes
    pauseGame();

    // Reset all game-specific state
    isPaused = false;  // Just to ensure it's reset
    score = 0;  // Reset score
    scoreDisplay.textContent = score;

    // Hide game container and pause overlay
    gameContainer.style.display = "none";
    pauseOverlay.style.display = "none";

    // Clear all notes and spawn timeouts
    spawnTimeouts.forEach(timeout => clearTimeout(timeout));
    spawnTimeouts = [];
    notes.forEach(note => note.elem.remove());
    notes = [];
}

function endGame() {
    console.log("endGame() called");

    bgMusic.pause();
    cancelAnimationFrame(animationFrame);
    isPaused = true;
    console.log("Game paused");

    finalScoreDisplay.textContent = score;
    console.log("Score displayed:", score);

    const nameResultEl = document.getElementById("beatmap-name-result");
    if (nameResultEl) {
        nameResultEl.textContent = beatmapName;
        console.log("Beatmap name set:", beatmapName);
    } else {
        console.warn("Missing element: beatmap-name-result");
    }

    const isNewBest = saveHighScore(beatmapName, selectedDifficulty, score);
    const highScoreEl = document.getElementById("high-score-result");

    if (highScoreEl) {
        const best = getHighScore(beatmapName, selectedDifficulty);
        highScoreEl.innerHTML = isNewBest
            ? `🎉 New High Score! ${score}`
            : `High Score: ${best}`;
        console.log("High score displayed");
    } else {
        console.warn("Missing element: high-score-result");
    }

    resultsScreen.style.display = "block";
    gameContainer.style.display = "none";
    console.log("Switched to results screen");

    const size = getFishSize(score, selectedDifficulty);
    document.getElementById("fish-size-display").innerHTML = `You caught a <strong>${size}kg ${beatmapName}!</strong>`;

    const fishImage = document.getElementById("fish-image");
    const fishContainer = document.getElementById("fish-image-container");

    if (selectedMap && selectedMap.fishImage) {
        fishImage.src = selectedMap.fishImage;
        fishContainer.style.display = "block";

        const scale = Math.min(1 + size / 10, 3);
        fishImage.style.transform = `scale(${scale})`;
        console.log("Fish image set and scaled");
    } else {
        fishContainer.style.display = "none";
        console.log("No fish image for this map");
    }
}


bgMusic.addEventListener("ended", endGame);

retryFromResultsBtn.addEventListener("click", () => {
    // Fully reset the game state to its original state
    resetGame();  // Full reset and start the game from the beginning

    // Hide the results screen
    resultsScreen.style.display = "none";

    // Hide the fish image container
    document.getElementById("fish-image-container").style.display = "none";  // 👈 Add this

    // Hide the song menu and main menu (if they are visible)
    document.getElementById("song-menu").style.display = "none";
    mainMenu.style.display = "none";

    // Show the game container (to prepare for the new game session)
    gameContainer.style.display = "block";

    // Reset the background music and UI elements if needed
    bgMusic.currentTime = 0;
    bgMusic.pause();
});


goBackSongSelectBtn.addEventListener("click", () => {
    stopGame();  // Stop the game completely
    document.getElementById("song-menu").style.display = "block";  // Show song select menu
    document.getElementById("fish-image-container").style.display = "none";
    resultsScreen.style.display = "none";  // Hide the results screen
    pauseOverlay.style.display = "none";  // Hide the pause overlay
    gameContainer.style.display = "none";  // Hide the game container

    // 🔁 Refresh the song menu with updated scores
    showSongMenu(selectedDifficulty);
});


mainMenuFromResultsBtn.addEventListener("click", () => {
    stopGame();  // Stop the game completely
    document.getElementById("fish-image-container").style.display = "none";
    resultsScreen.style.display = "none";  // Hide the results screen
    mainMenu.style.display = "block";  // Show the main menu
    body.classList.remove("easy-bg", "medium-bg", "hard-bg");  // Reset background styles
});

let gameOverCondition = score >= 1000;  // For example, when score exceeds 1000
if (gameOverCondition) {
    endGame();
}

function getFishSize(score, difficulty) {
    let fishSize = 0;

    // Adjust the fish size based on difficulty and score
    if (difficulty === "easy") {
        if (score < 500) {
            fishSize = 1;  // Small fish (1kg)
        } else if (score < 800) {
            fishSize = 2.5;  // Medium fish (2.5kg)
        } else if (score < 1000) {
            fishSize = 3;  // Large fish (5kg)
        } else {
            fishSize = 5;  // Bigger fish (5kg)
        }
    } else if (difficulty === "medium") {
        if (score < 300) {
            fishSize = 2;  // Small fish (2kg)
        } else if (score < 600) {
            fishSize = 4;  // Medium fish (4kg)
        } else if (score < 900) {
            fishSize = 6;  // Large fish (6kg)
        } else {
            fishSize = 9;  // Bigger fish (9kg)
        }
    } else if (difficulty === "hard") {
        if (score < 400) {
            fishSize = 3;  // Small fish (3kg)
        } else if (score < 700) {
            fishSize = 5;  // Medium fish (5kg)
        } else if (score < 1000) {
            fishSize = 8;  // Large fish (8kg)
        } else {
            fishSize = 12;  // Massive fish (12kg)
        }
    }

    return fishSize;
}

function _scoreKey(mapName, difficulty) {
    return `${mapName}__${difficulty}`;
}

function loadHighScores() {
    return JSON.parse(localStorage.getItem("highScores") || "{}");
}

function getHighScore(mapName, difficulty) {
    const scores = loadHighScores();
    return scores[_scoreKey(mapName, difficulty)] || 0;
}

function saveHighScore(mapName, difficulty, score) {
    const key = _scoreKey(mapName, difficulty);
    const scores = loadHighScores();
    if (!scores[key] || score > scores[key]) {
        scores[key] = score;
        localStorage.setItem("highScores", JSON.stringify(scores));
        return true; // new personal best
    }
    return false;
}

function getScoreGrade(score, maxScore, difficulty) {
    const ratio = score / maxScore;

    // Define grade thresholds for each difficulty
    const gradeThresholds = {
        easy:   { S: 0.95, A: 0.9, B: 0.8, C: 0.7, D: 0.6 },
        medium: { S: 0.97, A: 0.92, B: 0.85, C: 0.75, D: 0.65 },
        hard:   { S: 0.99, A: 0.95, B: 0.9,  C: 0.8,  D: 0.7 },
    };

    const thresholds = gradeThresholds[difficulty] || gradeThresholds.easy;

    if (ratio >= thresholds.S) return "S";
    if (ratio >= thresholds.A) return "A";
    if (ratio >= thresholds.B) return "B";
    if (ratio >= thresholds.C) return "C";
    if (ratio >= thresholds.D) return "D";
    return "F";
}




