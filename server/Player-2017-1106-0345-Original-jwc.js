/**
 * Stores the state of the player on the server. This class will also store
 * other important information such as socket ID, packet number, and latency.
 * @author Alvin Lin (alvin.lin.dev@gmail.com)
 */

var Projectile = require('./Projectile');
var Entity = require('./Entity');
var Praesidium = require('./Praesidium');
var Construct = require('./Construct');

var Constants = require('../shared/Constants');
var Util = require('../shared/Util');

/**
 * Constructor for a Player.
 * @constructor
 * @param {number} x The x coordinate to generate the player at.
 * @param {number} y The y coordinate to generate the player at.
 * @param {number} orientation This represents the direction the player will
 *   face and is a radian measure.
 * @param {number} hitboxSize The hitbox size of this player. This number
 *   represents the radius of the circular hitbox in pixels.
 * @param {string} name The display name of the player.
 * @param {string} id The socket ID of the client associated with this
 *   player.
 * @param {number} vmag The magnitude of the player's velocity in
 *   pixels/millisecond.
 * @param {number} shotCooldown The time between the player's shots in
 *   milliseconds.
 * @param {number} health The amount of health that the player starts with.
 */
function Player(x, y, orientation, hitboxSize, name, id,
                vmag, shotCooldown, health) {
  this.x = x;
  this.y = y;
  this.orientation = orientation;
  this.hitboxSize = hitboxSize;

  this.name = name;
  this.id = id;
  this.vmag = vmag;
  this.shotCooldown = shotCooldown;
  this.lastShotTime = 0;

  this.health = health;
  this.praesidia = 0;
  this.kills = 0;
  this.deaths = 0;
}
require('./inheritable');
Player.inheritsFrom(Entity);

/**
 * DEFAULT_VELOCITY_MAGNITUDE is in pixels per millisecond.
 * DEFAULT_SHOT_COOLDOWN is in milliseconds.
 * DEFAULT_HITBOX_SIZE is in pixels.
 */
Player.DEFAULT_VELOCITY_MAGNITUDE = 0.3;
Player.DEFAULT_SHOT_COOLDOWN = 400;
Player.DEFAULT_HITBOX_SIZE = 32;

/**
 * Returns a new Player object given a name and id.
 * @param {string} name The display name of the player.
 * @param {string} id The socket ID of the client associated with this
 *   player.
 * @return {Player}
 */
Player.generateNewPlayer = function(name, id) {
  var point = Util.getRandomWorldPoint();
  var orientation = Util.randRange(0, 2 * Math.PI);
  var hitboxSize = Player.DEFAULT_HITBOX_SIZE;
  var vmag = Player.DEFAULT_VELOCITY_MAGNITUDE;
  var shotCooldown = Player.DEFAULT_SHOT_COOLDOWN;
  var health = Constants.PLAYER_MAX_HEALTH;
  return new Player(point[0], point[1], orientation, hitboxSize, name, id,
                    vmag, shotCooldown, health);
};

/**
 * Updates this player given the the client's keyboard state and mouse angle
 * for setting the tank turret.
 * @param {Object} keyboardState A JSON Object storing the state of the
 *   client keyboard.
 * @param {number} orientation The angle of the client's mouse with respect
 *   to their player sprite.
 * @param {boolean} shot This is true when the player is attempting to shoot.
 *   It is equivalent to the state of the player's left click.
 * @param {function()} addProjectileCallback The function to call if the player
 *   can shoot and has shot.
 */
Player.prototype.updateOnInput = function(keyboardState, orientation, shot,
                                          build, addProjectileCallback,
                                          addConstructCallback) {
  if (keyboardState.up) {
    this.vy = (keyboardState.left || keyboardState.right) ?
        -this.vmag / Math.SQRT2 : -this.vmag;
  }
  if (keyboardState.down) {
    this.vy = (keyboardState.left || keyboardState.right) ?
        this.vmag / Math.SQRT2 : this.vmag;
  }

  if (keyboardState.left) {
    this.vx = (keyboardState.up || keyboardState.down) ?
        -this.vmag / Math.SQRT2 : -this.vmag;
  }
  if (keyboardState.right) {
    this.vx = (keyboardState.up || keyboardState.down) ?
        this.vmag / Math.SQRT2 : this.vmag;
  }

  if ((!keyboardState.up && !keyboardState.down) ||
      (keyboardState.up && keyboardState.down)) {
    this.vy = 0;
  }
  if ((!keyboardState.left && !keyboardState.right) ||
      (keyboardState.left && keyboardState.right)) {
    this.vx = 0;
  }

  this.orientation = orientation;

  if (shot && (new Date()).getTime() > this.lastShotTime + this.shotCooldown) {
    this.lastShotTime = (new Date()).getTime();
    addProjectileCallback(Projectile.create(this.x, this.y, this.orientation, this.id));
  }

  if (build &&
      Util.getEuclideanDistance(this.x, this.y, build.x, build.y) <
      Constants.CONSTRUCT_BUILD_RADIUS &&
      this.praesidia >= Constants.CONSTRUCT_REQUIREMENT[build.type]) {
    // We reset the shot cooldown after building a construct to prevent the
    // player from shooting instantly during that click event.
    this.lastShotTime = (new Date()).getTime();
    addConstructCallback(Construct.create(build.x, build.y, 0, this.id,
                                          build.type));
    this.praesidia -= Constants.CONSTRUCT_REQUIREMENT[build.type];
  }
};

/**
 * Updates the player's position and powerup states, this runs in the 60Hz
 * server side loop so that powerups expire even when the player is not
 * moving or shooting.
 * @param {function()} addPraesidiumCallback The function to call if the
 *   player is dead and should drop a praesidium pallet.
 */
Player.prototype.update = function(constructs, addPraesidiumCallback) {
  this.parent.update.call(this);
  var boundedCoord = Util.boundWorld(this.x, this.y);
  this.x = boundedCoord[0];
  this.y = boundedCoord[1];
  for (var i = 0; i < constructs.length; ++i) {
    if (this.isCollidedWith(constructs[i])) {
      var angle = Math.atan2(constructs[i].y - this.y,
                             constructs[i].x - this.x) + Math.PI;
      var offset = constructs[i].hitboxSize + this.hitboxSize;
      this.x = constructs[i].x + offset * Math.cos(angle);
      this.y = constructs[i].y + offset * Math.sin(angle);
    }
  }

  if (this.isDead()) {
    var praesidiaPenalty = Math.floor(this.praesidia / 2);
    this.praesidia -= praesidiaPenalty;
    var praesidia = Praesidium.createBurst(this.x, this.y, praesidiaPenalty);
    for (var i = 0; i < praesidia.length; ++i) {
      addPraesidiumCallback(praesidia[i]);
    }

    var point = Util.getRandomWorldPoint();
    this.x = point[0];
    this.y = point[1];
    this.health = Constants.PLAYER_MAX_HEALTH;
    this.deaths++;
  }
};

/**
 * Returns a boolean determining if the player is dead or not.
 * @return {boolean}
 */
Player.prototype.isDead = function() {
  return this.health <= 0;
};

/**
 * Damages the player by the given amount.
 * @param {number} amount The amount to damage the player by.
 */
Player.prototype.damage = function(amount) {
  this.health = Math.max(this.health - amount, 0);
};

/**
 * Heals the player by the given amount.
 * @param {number} amount The amount to heal the player by.
 */
Player.prototype.heal = function(amount) {
  this.health = Math.min(this.health + amount, Constants.PLAYER_MAX_HEALTH);
};

module.exports = Player;
