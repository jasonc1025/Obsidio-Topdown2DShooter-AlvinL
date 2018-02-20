/**
 * Methods for drawing all the sprites onto the HTML5 canvas. All coordinates
 * passed the methods of the Drawing class should be canvas coordinates and not
 * absolute game coordinates. They must be passed through the ViewPort class
 * before coming into the Drawing class.
 * @author Kenneth Li (kennethli.3470@gmail.com)
 */

/**
 * Creates a Drawing object.
 * @param {CanvasRenderingContext2D} context The context this object will
 *   draw to.
 * @constructor
 */
function Drawing(context) {
  this.context = context;

  this.selfPlayerImage = null;
  this.otherPlayerImage = null;
  this.projectileImage = null;
  this.praesidiumImage = null;
  this.tileImage = null;
  
  this.constructImages = {};

  this.cancelImage = null;
};

/**
 * Constants for the Drawing class.
 */
Drawing.FONT = '14px Helvetica';
Drawing.FONT_COLOR = 'black';

Drawing.HP_COLOR = 'green';
Drawing.HP_MISSING_COLOR = 'red';

Drawing.BASE_IMG_URL = '/static/img/';

Drawing.SELF_URL = Drawing.BASE_IMG_URL + Constants.SELF_ID;
Drawing.OTHER_URL = Drawing.BASE_IMG_URL + Constants.OTHER_ID;
Drawing.NEUTRAL_URL = Drawing.BASE_IMG_URL + Constants.NEUTRAL_ID;

Drawing.SELF_PLAYER_SRC = Drawing.SELF_URL + '_player.png';
Drawing.OTHER_PLAYER_SRC = Drawing.OTHER_URL + '_player.png';

Drawing.SELF_TURRET_SRC = Drawing.SELF_URL + '_turret.png';
Drawing.OTHER_TURRET_SRC = Drawing.OTHER_URL + '_turret.png';
Drawing.NEUTRAL_TURRET_SRC = Drawing.NEUTRAL_URL + '_turret.png';
Drawing.SELF_HEALER_SRC = Drawing.SELF_URL + '_healer.png';
Drawing.OTHER_HEALER_SRC = Drawing.OTHER_URL + '_healer.png';
Drawing.NEUTRAL_HEALER_SRC = Drawing.NEUTRAL_URL + '_healer.png';

Drawing.CANCEL_SRC = Drawing.BASE_IMG_URL + 'cancel.png';
Drawing.WALL_SRC = Drawing.BASE_IMG_URL + 'wall.png';

Drawing.PROJECTILE_SRC = Drawing.BASE_IMG_URL + 'projectile.png';
Drawing.PRAESIDIUM_SRC = Drawing.BASE_IMG_URL + 'praesidium.png';
Drawing.TILE_SRC = Drawing.BASE_IMG_URL + 'tile.png';

Drawing.NEUTRAL_CONSTRUCT_SRCS = [Drawing.NEUTRAL_TURRET_SRC,
                                 '',
                                 '',
                                 Drawing.WALL_SRC,
                                 Drawing.NEUTRAL_HEALER_SRC,
                                 ''];

Drawing.SELF_CONSTRUCT_SRCS = [Drawing.SELF_TURRET_SRC,
                              '',
                              '',
                              Drawing.WALL_SRC,
                              Drawing.SELF_HEALER_SRC,
                              ''];

Drawing.OTHER_CONSTRUCT_SRCS = [Drawing.OTHER_TURRET_SRC,
                               '',
                               '',
                               Drawing.WALL_SRC,
                               Drawing.OTHER_HEALER_SRC,
                               ''];

Drawing.PLAYER_SIZE = [64, 64];
Drawing.PROJECTILE_SIZE = [8, 8];
Drawing.PRAESIDIUM_SIZE = [32, 32];
Drawing.CONSTRUCT_SIZE = [64, 64];
Drawing.TILE_SIZE = 100;

/**
 * Factory method for a Drawing object.
 * @param {CanvasRenderingContext2D} context The context this object will
 *   draw to.
 */
Drawing.create = function(context) {
  return new Drawing(context);
};

/**
 * Initializes the Drawing object.
 */
Drawing.prototype.init = function() {
  this.selfPlayerImage = createImage(Drawing.SELF_PLAYER_SRC);
  this.otherPlayerImage = createImage(Drawing.OTHER_PLAYER_SRC);
  this.projectileImage = createImage(Drawing.PROJECTILE_SRC);
  this.praesidiumImage = createImage(Drawing.PRAESIDIUM_SRC);
  this.tileImage = createImage(Drawing.TILE_SRC);

  this.constructImages[Constants.SELF_ID] = [];
  this.constructImages[Constants.OTHER_ID] = [];
  this.constructImages[Constants.NEUTRAL_ID] = [];
  
  for (var i = 0; i < Constants.NUM_CONSTRUCTS; ++i) {
    this.constructImages[Constants.SELF_ID].push(createImage(
        Drawing.SELF_CONSTRUCT_SRCS[i]));
    this.constructImages[Constants.OTHER_ID].push(createImage(
        Drawing.OTHER_CONSTRUCT_SRCS[i]));
    this.constructImages[Constants.NEUTRAL_ID].push(createImage(
        Drawing.NEUTRAL_CONSTRUCT_SRCS[i]));
  }
}

/**
 * Clears the canvas context.
 */
Drawing.prototype.clear = function() {
  this.context.clearRect(
      0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
};

/**
 * Draws a player on the canvas.
 * @param {boolean} isSelf This is true if we want this method to draw the
 *   client player and false if we want to draw an enemy player.
 * @param {[number, number]} coords The canvas coordinates to draw the player
 *   at.
 * @param {number} orientation The orientation of the player in radians.
 * @param {string} name The name of the player, which will be displayed above
 *   the player sprite.
 * @param {number} health The health of the player to display in the healthbar
 *   above their sprite.
 */
Drawing.prototype.drawPlayer = function(isSelf, coords, orientation, name, health) {
  this.context.save();
  this.context.translate(coords[0], coords[1]);
  this.context.rotate(orientation);
  var playerImage = isSelf ? this.selfPlayerImage : this.otherPlayerImage;
  this.context.drawImage(playerImage,
                         -Drawing.PLAYER_SIZE[0] / 2,
                         -Drawing.PLAYER_SIZE[1] / 2,
                         Drawing.PLAYER_SIZE[0],
                         Drawing.PLAYER_SIZE[1]);
  this.context.restore();

  this.context.save();
  this.context.translate(coords[0], coords[1]);
  var healthBarInterval = 96 / Constants.PLAYER_MAX_HEALTH;
  for (var i = 0; i < Constants.PLAYER_MAX_HEALTH; ++i) {
    if (i < health) {
      this.context.fillStyle = Drawing.HP_COLOR;
    } else {
      this.context.fillStyle = Drawing.HP_MISSING_COLOR;
    }
    this.context.fillRect(-48 + healthBarInterval * i, -48,
                          healthBarInterval, 8);
  }
  this.context.font = Drawing.FONT;
  this.context.fillStyle = Drawing.FONT_COLOR;
  this.context.textAlign = 'center';
  this.context.fillText(name, 0, -56);
  this.context.restore();
};

/**
 * Draws a projectile on the canvas.
 * @param {[number, number]} coords The canvas coordinates to generate the
 *   projectile at.
 * @param {number} orientation The orientation of the projectile in radians.
 */
Drawing.prototype.drawProjectile = function(coords, orientation) {
  this.context.save();
  this.context.translate(coords[0], coords[1]);
  this.context.rotate(orientation);
  this.context.drawImage(this.projectileImage,
                         -Drawing.PROJECTILE_SIZE[0] / 2,
                         -Drawing.PROJECTILE_SIZE[1] / 2,
                         Drawing.PROJECTILE_SIZE[0],
                         Drawing.PROJECTILE_SIZE[1]);
  this.context.restore();
};

/**
 * Draws a praesidium pallet at the given coordinates.
 * @param {[number, number]} coords The canvas coordinates to draw the
 *   praesidium pallet at.
 */
Drawing.prototype.drawPraesidium = function(coords) {
  this.context.save();
  this.context.translate(coords[0], coords[1]);
  this.context.drawImage(this.praesidiumImage,
                         -Drawing.PRAESIDIUM_SIZE[0] / 2,
                         -Drawing.PRAESIDIUM_SIZE[1] / 2,
                         Drawing.PRAESIDIUM_SIZE[0],
                         Drawing.PRAESIDIUM_SIZE[1]);
  this.context.restore();
};

/**
 * Draws a construct on the canvas.
 * @param {string} owner A string that is either 'self', 'other', or 'neutral'
 *   to determine how to draw the construct.
 * @param {[number, number]} coords The canvas coordinates to draw the
 *   construct at.
 * @param {number} orientation The orientation of the construct in radians.
 * @param {number} health The health of the construct.
 * @param {number} type The type of the construct as defined in Constants.
 */
Drawing.prototype.drawConstruct = function(owner, coords, orientation,
                                           health, type) {
  this.context.save();
  this.context.translate(coords[0], coords[1]);
  this.context.rotate(orientation);
  this.context.drawImage(this.constructImages[owner][type],
                         -Drawing.CONSTRUCT_SIZE[0] / 2,
                         -Drawing.CONSTRUCT_SIZE[1] / 2,
                         Drawing.CONSTRUCT_SIZE[0],
                         Drawing.CONSTRUCT_SIZE[1]);
  this.context.restore();

  this.context.save();
  this.context.translate(coords[0], coords[1]);
  if (owner != Constants.NEUTRAL_ID) {
    var healthBarInterval = 96 / Constants.CONSTRUCT_MAX_HEALTH[type];
    for (var i = 0; i < Constants.CONSTRUCT_MAX_HEALTH[type]; ++i) {
      if (i < health) {
        this.context.fillStyle = Drawing.HP_COLOR;
      } else {
        this.context.fillStyle = Drawing.HP_MISSING_COLOR;
      }
      this.context.fillRect(-48 + healthBarInterval * i, -48,
                            healthBarInterval, 8);
    }
  }
  this.context.restore();
}

/**
 * Draws a circle around the player showing the range that the player can build
 * in.
 * @param {[number, number]} coords The canvas coordinates of the player.
 * @param {number} radius The radius of the player's build range.
 * @param {string} color The color of the build range indicator.
 */
Drawing.prototype.drawBuildRange = function(coords, radius, color) {
  this.context.fillStyle = color;
  this.context.globalAlpha = 0.3;
  this.context.beginPath();
  this.context.arc(coords[0], coords[1], radius, 0, 2 * Math.PI);
  this.context.closePath();
  this.context.fill();
  this.context.globalAlpha = 1;
}

/**
 * Draws the UI that shows the player's health and praesidia level.
 * @param {number} health The health of the player.
 * @param {number} praesidia The amount of praesidia the player has.
 */
Drawing.prototype.drawUI = function(health, praesidia) {
  this.context.fillStyle = '#AAAAAA';
  this.context.fillRect(0, 0, 200, 50);
  this.context.font = Drawing.FONT;
  this.context.fillStyle = Drawing.FONT_COLOR;
  this.context.fillText("Health: ", 10, 20);
  this.context.fillText("Praesidia: " + praesidia, 10, 40);
  for (var i = 0; i < 10; ++i) {
    if (i < health) {
      this.context.fillStyle = Drawing.HP_COLOR;
    } else {
      this.context.fillStyle = Drawing.HP_MISSING_COLOR;
    }
    this.context.fillRect(70 + 10 * i, 10, 10, 10)
  }
};

/**
 * Draws the background tiles.
 * @param {[number, number]} topLeft The coordinates of the top-leftmost
 *   point to start laying down the tiles from.
 * @param {[number, number]} bottomRight The coordinates of the
 *   bottom-rightmost point to stop laying the tiles down at.
 */
Drawing.prototype.drawTiles = function(topLeft, bottomRight) {
  this.context.save();
  for (var x = topLeft[0]; x < bottomRight[0]; x += Drawing.TILE_SIZE) {
    for (var y = topLeft[1]; y < bottomRight[1]; y += Drawing.TILE_SIZE) {
      this.context.drawImage(this.tileImage, x, y);
    }
  }
  this.context.restore();
}
