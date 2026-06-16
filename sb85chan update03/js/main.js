const loadingScreen = document.getElementById("loading-screen");
const loadingImg = document.getElementById("loading-img");

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const background = document.getElementById("background");
const roundCounter = document.getElementById("round-counter");
const dayIndicator = document.getElementById("day-indicator");

const bgMusic = new Audio("audio/music/background_music.mp3");

// sloty na jedzenie
const foodSlots = [
  document.getElementById("food1"),
  document.getElementById("food2"),
  document.getElementById("food3")
];

let playerLevel = 1;
let roundCount = 0;
let gamePhase = 1; // 1 = normalna, 2 = glitch, 3 = nóż
const maxRoundsPerPhase = 20;
let phase2HumanMeatShown = false; // czy human_meat pojawił się już w fazie 2

// lista jedzenia
const foodList = [
  {src: "img/food/weed.png", minLevel: 1},
  {src: "img/food/pills.png", minLevel: 1},
  {src: "img/food/lsd.png", minLevel: 1},
  {src: "img/food/mushrooms.png", minLevel: 1},
  {src: "img/food/cookies.png", minLevel: 1},
  {src: "img/food/butter_toast.png", minLevel: 1},
  {src: "img/food/mirinda.png", minLevel: 1},
  {src: "img/food/lean.png", minLevel: 1},
  {src: "img/food/pizza.png", minLevel: 1},
  {src: "img/food/cream_rolls.png", minLevel: 1},
  {src: "img/food/french_fries.png", minLevel: 1},
  {src: "img/food/vape.png", minLevel: 1},
  {src: "img/food/dr_pepper.png", minLevel: 1},
  {src: "img/food/human_meat.png", minLevel: 8},
  {src: "img/food/knife.png", minLevel: 15}
];

let currentTarget = "";

// --- START GRY ---
startBtn.addEventListener("click", startGame);

function startGame() {
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  dayIndicator.style.display = "none";

  // zmiana tła i playerLevel zależnie od fazy
  if (gamePhase === 1) {
    background.src = "img/backgrounds/tlo1.png";
    playerLevel = 1;
  } else if (gamePhase === 2) {
    background.src = "img/backgrounds/tlo2.png";
    playerLevel = 8;
  } else if (gamePhase === 3) {
    background.src = "img/backgrounds/tlo3.png";
    playerLevel = 15;
  }

  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();

  const narration = new Audio("audio/sfx/startup_narration.mp3");
  const character = document.getElementById("character");

  let talking = true;
  const talkingInterval = setInterval(() => {
    if (talking) {
      character.src = character.src.includes("char_1_idle")
        ? "img/character/char_2_talking.png"
        : "img/character/char_1_idle.png";
    }
  }, 200);

  narration.play();

  narration.addEventListener("ended", () => {
    talking = false;
    clearInterval(talkingInterval);
    character.src = "img/character/char_1_idle.png";

    roundCount = 0;

    // faza 3 — od razu jedna runda z nożem
    if (gamePhase === 3) {
      startKnifeRound();
    } else {
      startNextRound();
    }
  });
}

// --- START NASTĘPNEJ RUNDY ---
function startNextRound() {
  roundCount++;

  roundCounter.textContent = `${Math.min(roundCount, 20)} / 20`;

  // koniec fazy — wróć do ekranu startowego
  if (roundCount > maxRoundsPerPhase) {
    const thanksAudio = new Audio("audio/sfx/thanks.mp3");
    thanksAudio.play();

    gameScreen.style.display = "none";
    startScreen.style.display = "block";

    roundCount = 0;
    roundCounter.textContent = `0 / 20`;

    if (gamePhase === 1) {
      gamePhase = 2;
      phase2HumanMeatShown = false; // reset flagi dla fazy 2
      dayIndicator.src = "img/ui/day2.png";
      dayIndicator.style.display = "block";
    } else if (gamePhase === 2) {
      gamePhase = 3;
      dayIndicator.src = "img/ui/day3.png";
      dayIndicator.style.display = "block";
    }

    return;
  }

  const availableFood = foodList.filter(f => f.minLevel <= playerLevel);
  const character = document.getElementById("character");
  let talking = true;

  // losuj target
  let targetPool;
  if (gamePhase === 1) {
    // Faza 1: human_meat nie może być targetem
    targetPool = availableFood.filter(f => !f.src.includes("human_meat"));
  } else if (gamePhase === 2 && !phase2HumanMeatShown && roundCount === maxRoundsPerPhase) {
    // Faza 2: ostatnia runda i jeszcze nie było human_meat — wymuś go
    targetPool = availableFood.filter(f => f.src.includes("human_meat"));
  } else {
    targetPool = availableFood;
  }

  const randomTargetIndex = Math.floor(Math.random() * targetPool.length);
  currentTarget = targetPool[randomTargetIndex].src.split("/").pop().replace(".png", "");

  // Zapamiętaj, że human_meat pojawił się w fazie 2
  if (gamePhase === 2 && currentTarget === "human_meat") {
    phase2HumanMeatShown = true;
  }

  const audio = new Audio(`audio/food/${currentTarget}.mp3`);

  const talkingInterval = setInterval(() => {
    if (talking) {
      character.src = character.src.includes("char_1_idle")
        ? "img/character/char_2_talking.png"
        : "img/character/char_1_idle.png";
    }
  }, 200);

  audio.play();

  // glitch tylko w fazie 2 (30% szans)
if (gamePhase === 2) {
  const glitchWillPlay = Math.random() < 0.2;
  if (glitchWillPlay) {
    const glitchDelay = 300 + Math.random() * 1500;
    setTimeout(() => {
      const glitch = new Audio("audio/sfx/glitch.mp3");
      
      // DODAJ TĘ LINIĘ PONIŻEJ:
      glitch.volume = 0.50;
      
      glitch.play();
    }, glitchDelay);
  }
}

  // po zakończeniu audio — pokaż sloty
  audio.addEventListener("ended", () => {
    talking = false;
    clearInterval(talkingInterval);
    character.src = "img/character/char_1_idle.png";
    setupFoodSlots(availableFood, currentTarget);
  });
}

// --- FAZA 3: RUNDA Z NOŻEM ---
function startKnifeRound() {
  const character = document.getElementById("character");
  currentTarget = "knife";

  roundCounter.textContent = ``;

  const audio = new Audio("audio/food/knife.mp3");

  let talking = true;
  const talkingInterval = setInterval(() => {
    if (talking) {
      character.src = character.src.includes("char_1_idle")
        ? "img/character/char_2_talking.png"
        : "img/character/char_1_idle.png";
    }
  }, 200);

  audio.play();

  audio.addEventListener("ended", () => {
    talking = false;
    clearInterval(talkingInterval);
    character.src = "img/character/char_1_idle.png";

    // pokaż nóż + 2 losowe inne rzeczy
    const others = foodList.filter(f => f.minLevel <= 8 && !f.src.includes("knife"));
    const chosenFood = ["img/food/knife.png"];
    const copy = [...others];

    while (chosenFood.length < 3 && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length);
      chosenFood.push(copy[idx].src);
      copy.splice(idx, 1);
    }

    chosenFood.sort(() => Math.random() - 0.5);

    for (let i = 0; i < foodSlots.length; i++) {
      foodSlots[i].src = chosenFood[i];
    }
  });
}

// --- JUMPSCARE ---
function triggerJumpscare() {
  // zatrzymaj muzykę
  bgMusic.pause();

  // ukryj grę
  gameScreen.style.display = "none";
  startScreen.style.display = "none";

  // stwórz jumpscare div na cały ekran
  const jumpscare = document.createElement("div");
  jumpscare.style.position = "fixed";
  jumpscare.style.top = "0";
  jumpscare.style.left = "0";
  jumpscare.style.width = "100vw";
  jumpscare.style.height = "100vh";
  jumpscare.style.zIndex = "9999";
  jumpscare.style.backgroundImage = "url('img/jumpscare.jpg')";
  jumpscare.style.backgroundSize = "cover";
  jumpscare.style.backgroundPosition = "center";
  document.body.appendChild(jumpscare);

  const jumpscareSound = new Audio("audio/sfx/jumpscare.mp3");
  jumpscareSound.volume = 1.0;
  jumpscareSound.play();
}

// --- PRZYPISANIE JEDZENIA DO SLOTÓW ---
function setupFoodSlots(availableFood, forcedTarget = null) {
  const copyAvailable = [...availableFood];
  const chosenFood = [];

  if (forcedTarget) chosenFood.push(availableFood.find(f => f.src.includes(forcedTarget)).src);

  while (chosenFood.length < 3 && copyAvailable.length > 0) {
    const idx = Math.floor(Math.random() * copyAvailable.length);
    if (!chosenFood.includes(copyAvailable[idx].src)) chosenFood.push(copyAvailable[idx].src);
    copyAvailable.splice(idx, 1);
  }

  chosenFood.sort(() => Math.random() - 0.5);

  for (let i = 0; i < foodSlots.length; i++) {
    foodSlots[i].src = chosenFood[i];
  }
}

// --- KLIK NA JEDZENIE ---
foodSlots.forEach(slot => {
  slot.addEventListener("click", () => {
    const clickedFood = slot.src.split("/").pop().replace(".png", "");
    const character = document.getElementById("character");

    // FAZA 3 — klik w nóż
    if (gamePhase === 3 && clickedFood === "knife") {
      // ukryj sloty
      foodSlots.forEach(s => s.src = "");

      // animacja postaci
      character.src = "img/character/char_5_suspicious.png";
      setTimeout(() => {
        character.src = "img/character/char_6_psycho.png";
        setTimeout(() => {
          character.src = "img/character/char_7_psycho_knife.png";
          setTimeout(() => {
            character.src = "img/character/char_8_attack.png";
            setTimeout(() => {
              triggerJumpscare();
            }, 800);
          }, 600);
        }, 600);
      }, 800);

      return;
    }

    // normalne rundy
    if (clickedFood === currentTarget) {
      const correctSound = new Audio("audio/sfx/correct_item.mp3");
      correctSound.play();
      // Red tint flash when human_meat is eaten
      if (clickedFood === "human_meat") {
        const redTint = document.getElementById("red-tint");
        redTint.style.transition = "none";
        redTint.style.opacity = "1";
        setTimeout(() => {
          redTint.style.transition = "opacity 1.1s ease";
          redTint.style.opacity = "0";
        }, 700);
      }
      setTimeout(() => { startNextRound(); }, 300);
    } else {
      const wrongSound = new Audio("audio/sfx/wrong_item.mp3");
      wrongSound.play();
      character.src = "img/character/char_4_disgust.png";
      // Screen shake
      const gameContainer = document.getElementById("game-container");
      gameContainer.classList.remove("shake");
      void gameContainer.offsetWidth; // force reflow to restart animation
      gameContainer.classList.add("shake");
      gameContainer.addEventListener("animationend", () => gameContainer.classList.remove("shake"), { once: true });
      setTimeout(() => { character.src = "img/character/char_1_idle.png"; }, 1000);
    }
  });
});
window.addEventListener("load", () => {
  setTimeout(() => {
    if (loadingImg) loadingImg.style.opacity = "0";
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = "none";
    }, 2000);
  }, 500);
});
