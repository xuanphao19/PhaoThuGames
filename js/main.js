//  ---------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All rights reserved.
//https://learn.microsoft.com/en-us/samples/microsoft/windows-appsample-get-started-js2d/get-started-javascript-2d/?ns-enrollment-type=Collection&ns-enrollment-id=jg60cd0ox2z4nk

//  ---------------------------------------------------------------------------------

// The canvas and stage are where our sprites are displayed. The canvas is defined in
// the index.html file, and the stage is an EaselJS object.
var canvas, stage, loader;
var width, height;
var dino_walk, dino_stand, dino_lying;
var sky, grass;
var barrel,
  cloud = [];
var scoreText;
var dy,
  score = 0,
  jumping = false;

// Game state management.
GameStateEnum = {
  Ready: 0,
  Playing: 1,
  GameOver: 2,
};
var GameState = GameStateEnum.Ready;

// This method is called to start the game.
// It creates the various game objects, adds them to the stage, and kicks off
// a gameLoop() called by a timer.

init();

function init() {
  canvas = document.getElementById("gameCanvas");
  stage = new createjs.Stage("gameCanvas");
  // Some sky for the background.
  sky = new createjs.Shape();
  sky.graphics.beginFill("DeepSkyBlue");

  // Some grass background shapes.
  grass = new createjs.Shape();
  grass.graphics.beginFill("green");

  // Text to display the score and other messages.
  scoreText = new createjs.Text("Score: 00000", "42px Arial", "#ffffff");

  // Add these objects to the stage so they are visible.
  stage.addChild(sky, grass, scoreText);

  manifest = [
    {
      src: "walkingDino-SpriteSheet.png",
      id: "dino",
    },
    { src: "barrel.png", id: "barrel" },
    { src: "cloud-small.png", id: "cloud" },
    // <img src='../' alt='' />;
  ];

  // Now we create a special queue, and finally a handler that is
  // called when they are loaded. The queue object is provided by preloadjs.
  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", loadingComplete);
  loader.loadManifest(manifest, true, "./images/");
}

function loadingComplete() {
  // Images have been loaded at this point, so we can continue.
  // Create some clouds to drift by..
  for (var i = 0; i < 3; i++) {
    cloud[i] = new createjs.Bitmap(loader.getResult("cloud"));
    cloud[i].x = Math.random() * 1524;
    cloud[i].y = 24 + i * 48;
    stage.addChild(cloud[i]);
  }
  // Define the animated dino walk using a spritesheet of images,
  // and also a standing still state, and a knocked-over state.
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
  barrel.x = width + 100; // Move the obstical to the edge of the screen, and a little further.
  stage.addChild(barrel);

  // Now position everything according to the current window dimensions.
  resizeGameWindow();

  // Set up the game loop and keyboard handler.
  // The keyword 'tick' is required to automatically animated the sprite.
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", gameLoop);

  // This code will call the method 'keyboardPressed' is the user presses a key.
  this.document.onkeydown = keyboardPressed;

  // Add support for mouse clicks
  stage.on("stagemousedown", mouseClicked);

  // This code makes the app call the method 'resizeGameWindow' if the user resizes the current window.
  window.addEventListener("resize", resizeGameWindow);
}

function resizeGameWindow() {
  // Get the current width and height of the view, and resize and position everything accordingly.
  // This method is also called once at the start of the app to put everything in an initial position.
  width = window.innerWidth;
  //     Windows.UI.ViewManagement.ApplicationView.getForCurrentView().visibleBounds
  //       .width;
  height = window.innerHeight;
  //     Windows.UI.ViewManagement.ApplicationView.getForCurrentView().visibleBounds
  //       .height;

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
      barrel.x -= 8 + score; // The barrel moves faster the more points you have!
      if (barrel.x < 0) {
        barrel.x = width + Math.random() * 200;
        score++;
      }

      // Handle moving the dino up and down if the player is making it jump.
      jumpingDino();

      // Very simple check for collision between dino and barrel
      if (barrel.x > 220 && barrel.x < 380 && !jumping) {
        barrel.x = 380;
        GameState = GameStateEnum.GameOver;
      }
      break;
    }
    case GameStateEnum.GameOver: {
      dino_walk.visible = false;
      dino_lying.visible = true;
      scoreText.x = width / 2 - 220;
      scoreText.text = "Thôi chết em rồi. Cửa tử: " + score.toString();
      break;
    }
  }
  animate_clouds();
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

function mouseClicked() {
  userDidSomething();
}
function keyboardPressed(event) {
  if (event.keyCode == 32) userDidSomething();
}
function userDidSomething() {
  // This is called when the user either clicks with the mouse, or presses the Space Bar.
  if (GameState === GameStateEnum.Playing) {
    if (jumping == false) {
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
    cloud[i].x = cloud[i].x - (i + 1) * 0.2;
    if (cloud[i].x <= -1228) cloud[i].x = width + 128;
  }
}
