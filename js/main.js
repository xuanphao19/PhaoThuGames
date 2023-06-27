﻿"use strict";
//  ----------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All rights reserved.
//https://learn.microsoft.com/en-us/samples/microsoft/windows-appsample-get-started-js2d/get-started-javascript-2d/?ns-enrollment-type=Collection&ns-enrollment-id=jg60cd0ox2z4nk
//  -----------------------------------------------------------------------------

var canvas, stage, loader;
var width, height;
var dino_walk, dino_stand, dino_lying;
var sky, grass;
var barrel,
  explosion,
  cloud = [],
  car = [],
  fireTruck = [],
  Mic21 = [],
  police = [];
var scoreText;
var dx,
  dy,
  score = 0,
  jumping = false;

// Game state management.
var GameStateEnum = {
  Ready: 0,
  Playing: 1,
  GameOver: 2,
};
var GameState = GameStateEnum.Ready;
const numRandom = function (a, b) {
  return b
    ? Math.floor(Math.random() * (a - b) + b)
    : Math.floor(Math.random() * a);
};

init();
function init() {
  canvas = document.getElementById("gameCanvas");
  stage = new createjs.Stage("gameCanvas");
  sky = new createjs.Shape();
  sky.graphics.beginFill("DeepSkyBlue");
  grass = new createjs.Shape();
  grass.graphics.beginFill("green");
  scoreText = new createjs.Text("Score: 00000", "42px Arial", "violet");
  // Add these objects to the stage so they are visible.
  stage.addChild(sky, grass, scoreText);

  var manifest = [
    { src: "walkingDino.png", id: "dino" },
    { src: "barTrap.png", id: "barrel" },
    { src: "cloud-small.png", id: "cloud" },
    { src: "car.png", id: "car" },
    { src: "police.png", id: "police" },
    { src: "fireTruck.png", id: "fireTruck" },
    { src: "explosion.png", id: "explosion" },
    { src: "Mic21.png", id: "Mic21" },
    // <img src='../' alt='' fireTruck/>;
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", loadingComplete);
  loader.loadManifest(manifest, true, "./images/");
}

function loadingComplete() {
  height = window.innerHeight;
  width = window.innerWidth;
  for (var i = 0; i < 3; i++) {
    cloud[i] = new createjs.Bitmap(loader.getResult("cloud"));
    cloud[i].x = Math.random() * 524;
    cloud[i].y = 64 + i * 28;
    stage.addChild(cloud[i]);
  }
  for (var i = 0; i < 2; i++) {
    car[i] = new createjs.Bitmap(loader.getResult("car"));
    car[i].x = Math.random() * 1524;
    car[i].y = height / 2 - 90 + i * 2;
    police[i] = new createjs.Bitmap(loader.getResult("police"));
    police[i].x = Math.random() * 824;
    police[i].y = height / 2 - 90 + i * 2;
    fireTruck[i] = new createjs.Bitmap(loader.getResult("fireTruck"));
    fireTruck[i].x = Math.random() * 1224;
    fireTruck[i].y = height / 2 - 90 + i * 2;
    // car[i].scale = Math.random() + 0.3;
    // police[i].scale = Math.random() + 0.3;
    // fireTruck[i].scale = Math.random() + 0.3;

    Mic21[i] = new createjs.Bitmap(loader.getResult("Mic21"));
    Mic21[i].scale = Math.random() + 0.3;
    Mic21[i].x = Math.random() * 1224;
    Mic21[i].y = height / 2 - 290 + i * 2;
    stage.addChild(fireTruck[i], car[i], police[i], Mic21[i]);
  }
  explosion = new createjs.Bitmap(loader.getResult("explosion"));

  var data = {
    images: [loader.getResult("dino")],
    frames: { width: 373, height: 256 },
    animations: {
      stand: 0,
      lying: {
        frames: [0, 1],
        speed: 0.1,
      },
      walk: {
        frames: [0, 1, 2, 3, 2, 1],
        speed: 0.4,
      },
    },
  };
  var spriteSheet = new createjs.SpriteSheet(data);
  dino_walk = new createjs.Sprite(spriteSheet, "walk");
  dino_stand = new createjs.Sprite(spriteSheet, "stand");
  dino_lying = new createjs.Sprite(spriteSheet, "lying");
  dino_lying.skewX = -50; // Make the dino lie down.
  stage.addChild(dino_walk, dino_stand, dino_lying);

  // Create an obsticle the dino must jump over.
  barrel = new createjs.Bitmap(loader.getResult("barrel"));
  barrel.regX = 32;
  barrel.regY = 32;
  barrel.x = width + 100;

  /* ================ */
  stage.addChild(barrel);
  /* ============= */
  resizeGameWindow();
  // Set up the game loop and keyboard handler. nuclear explosion
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", gameLoop);
  document.onkeydown = keyboardPressed;
  stage.on("stagemousedown", mouseClicked);

  window.addEventListener("resize", resizeGameWindow);
}

function resizeGameWindow() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  stage.setBounds(0, 0, width, height);
  scoreText.y = 26;
  sky.graphics.drawRect(0, 0, width, height / 2);
  sky.x = 0;
  sky.y = 0;
  grass.graphics.drawRect(0, 0, width, height / 2);
  grass.x = 0;
  grass.y = height / 2;
  dino_walk.x = 20;
  dino_walk.y = height / 2 - 100;
  dino_stand.x = dino_walk.x;
  dino_stand.y = height / 2 - 100;
  dino_lying.x = dino_walk.x - 75;
  dino_lying.y = dino_walk.y + 75;
  barrel.y = height / 2 + 100;
}

function gameLoop() {
  switch (GameState) {
    // The game state defines what should be happening at each
    // stage of the game.

    case GameStateEnum.Ready: {
      // This is the 'get ready to play' screen.
      scoreText.x = width / 2 - 150;
      scoreText.text = "Gamer Xuân Pháo!";
      barrel.x = width + 100;
      jumping = false;
      dino_walk.y = height / 2 - 100;
      score = 0;
      dino_stand.visible = true;
      dino_walk.visible = false;
      dino_lying.visible = false;
      break;
    }

    case GameStateEnum.Playing: {
      // This is where the main game action happens.
      dino_stand.visible = false;
      dino_walk.visible = true;
      // Display the score
      scoreText.x = width / 2 - 100;
      scoreText.text = "Qua cửa: " + score.toString();
      // Move the obsticle across the screen, rolling as it goes.
      barrel.rotation = barrel.x;
      var ballSpeed = score <= 10 ? score : 5;
      barrel.x -= 8 + ballSpeed; // The barrel moves faster the more points you have!
      if (barrel.x < 0) {
        barrel.x = width + Math.random() * 200;
        score++;
      }

      // Handle moving the dino up and down if the player is making it jump.
      jumpingDino();
      // Very simple check for collision between dino and barrel
      // if (barrel.x > 220 && barrel.x < 380 && !jumping) {
      //   barrel.x = 380;
      //   GameState = GameStateEnum.GameOver;
      // }
      break;
    }
    // case GameStateEnum.GameOver: {
    // dino_walk.visible = false;
    // dino_lying.visible = true;
    // scoreText.x = width / 2 - 220;
    // scoreText.text = "Thôi chết em rồi. Cửa tử: " + score.toString();
    // break;
    // }
  }
  animate_clouds();
  loadSound();
  // Redraw all the object in new positions.
  stage.update();
}

function jumpingDino() {
  // Make the dino move up and down the screen, if the user has pressed the space bar.
  if (jumping) {
    dino_walk.y += dy;
    if (dy < 0) {
      dy = dy / 1.1;
      if (dy > -2) dy = 2;
    } else {
      dy = dy * 1.2;
      if (dino_walk.y > height / 2 - 100) {
        jumping = false;
        dino_walk.y = height / 2 - 100;
      }
    }
  }
}

const mouseClicked = (e) => {
  let scale = null;
  if (e.rawY >= 300) {
    scale = Math.random() * (e.rawY * 0.004) + 0.5;
  } else {
    scale = 1 * (e.rawY * 0.005);
  }
  scale = scale <= 0.4 ? 0.4 : scale;
  nuclearExplosion(e, scale);
  createjs.Sound.play(soundID);
  userDidSomething();
};

function keyboardPressed(event) {
  if (event.keyCode == 32) {
    if (GameState == GameStateEnum.Ready) {
      GameState = GameStateEnum.Playing;
    }
    if (GameState == GameStateEnum.GameOver) {
      GameState = GameStateEnum.Ready;
    }
    userDidSomething();
  }
  if (event.keyCode == 37) {
    if (dino_walk.x > 20) {
      dino_walk.x -= 20;
    } else {
      dino_walk.x = 20;
    }
  }
}

function userDidSomething() {
  // This is called when the user either clicks with the mouse, or presses the Space Bar.
  if (GameState === GameStateEnum.Playing) {
    if (jumping == false) {
      createjs.Sound.play(soundID);
      jumping = true;
      dy = -32;
    }
  }
  if (GameState == GameStateEnum.Ready) {
    GameState = GameStateEnum.Playing;
  }
  if (GameState == GameStateEnum.GameOver) {
    GameState = GameStateEnum.Ready;
  }
}

function animate_clouds() {
  for (var i = 0; i < 3; i++) {
    cloud[i].x = cloud[i].x - i * `0.${i}`;
    if (cloud[i].x <= -1528) cloud[i].x = width;
  }

  for (var i = 0; i < 2; i++) {
    let speed = numRandom(18, 4);
    police[i].x = police[i].x - speed * 0.4 + i;
    if (police[i].x <= -228) police[i].x = width;
    fireTruck[i].x = fireTruck[i].x - speed * 0.2 + i;
    if (fireTruck[i].x <= -228) fireTruck[i].x = width;
    car[i].x = car[i].x - (i * 2 + speed) * 0.1;
    if (car[i].x <= -228) car[i].x = width;

    Mic21[i].x = Mic21[i].x + (i + speed) * 0.04;
    if (Mic21[i].y <= -30) {
      Mic21[i].y = height / 2 - 300;
    } else {
      Mic21[i].y = Mic21[i].y - 0.03;
    }
    if (Mic21[i].x >= width) Mic21[i].x = 0;
  }
  if (dino_walk.x <= width - 200) {
    dino_walk.x += 2;
  } else {
    dino_walk.x = 20;
  }
}

var soundID = "Thunder";
function loadSound() {
  createjs.Sound.registerSound("./audio/machineGun.ogg", soundID);
}

function nuclearExplosion(e, sca) {
  let tolerance = sca > 1 ? 15 : sca <= 0.5 ? 5 : 10;
  explosion.x = e.rawX - sca * 32 - tolerance;
  explosion.y = e.rawY - sca * 32 - tolerance;
  explosion.scale = sca;
  stage.addChild(explosion);
  var timer = setTimeout(() => {
    explosion.scale = 0;
    window.clearTimeout(timer);
  }, 50);
}
// function getMousePos(canvas, evt) {
//   var rect = canvas.getBoundingClientRect();
//   return {
//     x: evt.clientX - rect.left,
//     y: evt.clientY - rect.top,
//   };
// }
