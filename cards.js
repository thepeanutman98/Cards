/**
 * @fileoverview Basic controllable cards with HTML Canvas and JS
 */


/**
 * Gets card images with given info. Given folder should have card
 * images in format of rank + suit + extension or extra + extension
 * @param  {Array<String>} ranks                                         Array of rank values
 * @param  {Array<String>} suits                                         Array of suit values
 * @param  {Array<String>} extras                                        Extra card images to be loaded
 * @param  {String} [path="C:/Users/Adam/Desktop/SVG-cards-1.3/"]        Path to card directory (local or online) including an ending /
 * @param  {String} [extension=".svg"]                                   Extension of image files including .
 * @return {Object<String, HTMLImageElement>}                            Object to get images from by referencing rank + suit
 */
function getCards(ranks, suits, extras, path = "images/", extension = ".svg") {
  var temp = {};
  for (let rank of ranks) {
    for (let suit of suits) {
      temp[rank + suit] = new Image();
      temp[rank + suit].src = path + rank + suit + extension;
    }
  }
  for (let extra of extras) {
    temp[extra] = new Image();
    temp[extra].src = path + extra + extension;
  }
  return temp;
}
/**
 * Object to get card image from Card name
 * Use like cards["as"] to get image for the Ace of Spades
 * @type {Object<String, HTMLImageElement>}
 */
const cards = getCards(["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k"], ["h", "d", "c", "s"],["back","empty"]);

/**
 * Clears canvas by drawing a large, clear rectangle from the origin to the
 * origin plus the canvas height/width (theoretically the bottom right corner).
 * In practice, this will not work if the Canvas is transformed at all (if the
 * currentTransform (the current transformation matrix, an SVGMatrix) is not
 * {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0}) since then the origin would probably
 * not be the top left corner and the origin plus the canvas height/width would
 * probably not be the bottom right corner. If it was translated and scaled,
 * rotated, or undergone any other transformation which can preserve to location
 * of one point, one could be correct, but both could not. So, only use this if
 * the Canvas has not been transformed (of course transforming and then
 * restoring would not change anything, so if transformed, make sure to
 * restore).
 *
 * @param  {CanvasRenderingContext2D=} [ctx=window.ctx] The ctx to clear. Defaults to window.ctx, the global ctx
 */
function clearCanvas(ctx = window.ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Allows easier drawing of images of the Canvas
 * @param  {CanvasImageSource} e       Image to draw
 * @param  {Number} x                  X position of top corner of where to draw image
 * @param  {Number} y                  Y position of top corner of where to draw image
 * @param  {Number} [b=0.5]            Scale of image (scales image around (x,y), the
 *                                     top corner of the image). Defaults to 0.5
 *                                     because the cards look best at that scale.
 */
function draw(e, x, y, b = 0.5) {
  ctx.drawImage(e, x, y, e.naturalWidth * b, e.naturalHeight * b);
}

/**
 * Constructor for cards.
 * @param       {String} a                                    Card rank + suit (e.g. "as" for Ace of Spades)
 * @param       {Number} [x=0]                                X position of top corner of card
 * @param       {Number} [y=0]                                Y position of top corner of card
 * @param       {Number} [e=0.5]                              Size (scale) of card.
 * @param       {Object<String, HTMLImageElement>} [d=cards]  Deck of card images to use. Default is global deck.
 * @constructor
 */
function Card(a, x = 0, y = 0, e = 0.5, d = cards) {

  /**
   * Direction indicates the angle at which the Stack should appear in
   * @type {Number}
   */
  this.direction = 0;

  /**
   * False by default, true flips Card to back
   * @type {Boolean}
   */
  this.flipped = false;

  /**
   * Size (scale) of Card. Defaults to 0.5, where cards look the best
   * @type {Number}
   */
  this.size = e;

  /**
   * Card rank. Determined by first character of a
   * @type {String}
   */
  this.num = a[0];

  /**
   * Card suit. Determined by first character of a
   * @type {String}
   */
  this.suit = a[1];

  /**
   * valueOf function to return Card name (rank + suit)
   * @return {String} The rank + suit
   */
  this.valueOf = function() {
    return this.num + this.suit;
  };

  /**
   * X position of top corner of Card
   * @type {Number}
   */
  this.x = x;

  /**
   * Y position of top corner of Card
   *
   * @type {Number}
   */
  this.y = y;

  /**
   * Image of Card to be referenced when drawn
   * @type {HTMLImageElement}
   */
  this.image = d[a];

  /**
   * Draw Card with current flipped state, (x,y) position, and size
   * @return {[type]} [description]
   * @todo Add direction support
   */
  this.draw = function() {
    draw(this.flipped ? cards.back : this.image, this.x, this.y, this.size);
  };

  // Define getters and setters
  Object.defineProperties(this, {
    /**
     * Getter for width of Card
     * @type {Number}
     */
    width: {
      get: function() {
        return this.image.naturalWidth * this.size;
      }
    },

    /**
     * Getter for height of Card
     * @type {Number}
     */
    height: {
      get: function() {
        return this.image.naturalHeight * this.size;
      }
    },

    /**
     * X coordinate of bottom corner of the Card.
     * Used in determining if this Card was clicked
     * @type {Number}
     */
    cornerX: {
      get: function() {
        return this.x + this.width;
      }
    },

    /**
     * Y coordinate of bottom corner of the Card.
     * Used in determining if this Card was clicked
     * @type {Number}
     */
    cornerY: {
      get: function() {
        return this.y + this.height;
      }
    }
  });

  // Adds this Card to list of all Cards
  allCards.push(this);

  /**
   * Detects whether a given point (x,y) is inside the Card.
   * @param  {Number} x  X coordinate of the point to check
   * @param  {Number} y  Y coordinate of the point to check
   * @return {Boolean}   Whether or not the given point is inside the Card
   */
  this.isIn = function(x, y) {
    switch (this.direction) {
      case 0:
        return x >= this.x && x <= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI * 0.5:
        return x <= this.x && x >= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI:
        return x <= this.x && x >= this.cornerX && y <= this.y && y >= this.cornerY;
      case Math.PI * 1.5:
        return x >= this.x && x <= this.cornerX && y <= this.y && y >= this.cornerY;
    }
  };
}

/**
 * Array of all Cards
 * @type {Array<Card>}
 */
var allCards = [];

/**
 * Array of all Stacks
 * @type {Array<Stack>}
 */
var allStacks = [];

/**
 * Array of all Piles
 * @type {Array<Pile>}
 */
var allPiles = [];

/**
 * Class for card Stacks, which are Cards layed out so that all Cards in the
 * stack can be seen, but are overlapping so no excess area is shown, like
 * how one might hold one's Cards in one's hand when viewing them all
 * @extends Array
 */
class Stack extends Array {
  /**
   * Creates a Stack. Parameter can be applied four ways:
   *  1) Supply a variable amount of Cards. Creates a Stack with those Cards
   *     and sets position (x,y) to (0,0)
   *  2) Supply an x position, a y position, then a variable amount of Cards.
   *     Creates a Stack with those Cards and sets position (x,y) to the
   *     supplied (x,y) coordinates
   *  3) Supply only an x position and y position. Creates an empty Stack
   *     with the supplied (x,y) coordinates
   *  4) Supply no parameters. Creates an empty Stack and sets position (x,y)
   *     to (0,0)
   * @todo Add normalized this.size to replace this[0].size
   * @param  {Number|Card=}  a[0]        X position, first Card, or nothing
   * @param  {Number|Card=}  a[1]        Y position, second Card, or nothing
   * @param  {...Card=}      a.slice(2)  Rest of Card(s) to add to Stack, or nothing
   */
  constructor(...a) {
    super();  // Called to allow later call of pushing all specified Cards to this
    allStacks.push(this); // Push this to array of allStacks for reference
    Object.defineProperties(this, { // Used to define getters and setters
      /**
       * Width of Stack used to calculate corner
       * @type {Number=}
       */
      width: {
        get: function() {
          return this[0] ? ((this.length - 1) * 45 * this[0].size) + (this[0].image.naturalWidth * this[0].size) : undefined;
        }
      },

      /**
       * Height of Stack used to calculate corner
       * @type {Number=}
       */
      height: {
        get: function() {
          return this[0] ? this[0].image.naturalHeight * this[0].size : undefined;
        }
      },

      /**
       * The x position of the opposite corner of the origin of Stack
       * @type {Number}
       */
      cornerX: {
        get: function() {
          switch (this.direction) { // Different formulas depending on direction
            case 0: // Facing forward
              return this.x + this.width;
            case Math.PI * 0.5: // Turned 90 deg clockwise
              return this.x - this.height;
            case Math.PI:  // Turned 180 degrees
              return this.x - this.width;
            case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
              return this.x + this.height;
          }
        }
      },

      /**
       * The y position of the opposite corner of the origin of the Stack
       * @type {Object}
       */
      cornerY: {
        get: function() {
          switch (this.direction) { // Different formulas depending on direction
            case 0: // Facing forward
              return this.y + this.height;
            case Math.PI * 0.5: // Turned 90 deg clockwise
              return this.y + this.width;
            case Math.PI:  // Turned 180 degrees
              return this.y - this.height;
            case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
              return this.y - this.width;
          }
        }
      },

      /**
       * X position of the Stack. Defined as setter and getter so that the
       * X position of the first Card in the Stack is set as well as the
       * X position of the Stack itself
       * @type {Number}
       */
      x: {
        get: function() {
          return this.X;
        },
        set: function(a) {
          if (this[0]) {
            this[0].x = a;
          }
          this.X = a;
        }
      },

      /**
       * Y position of the Stack. Defined as setter and getter so that the
       * Y position of the first Card in the Stack is set as well as the
       * Y position of the Stack itself
       * @type {Number}
       */
      y: {
        get: function() {
          return this.Y;
        },
        set: function(a) {
          if (this[0]) {
            this[0].y = a;
          }
          this.Y = a;
        }
      }
    });

    /**
     * If true, the stack will appear flipped over such that the Card value is
     * not visible. If false, the Card appears as normal. Default false.
     * @type {Boolean}
     */
    this.flipped = false;

    /**
     * Direction indicates the angle at which the Stack should appear in
     *
     * @type {Number}
     */
    this.direction = 0;

    if (typeof a[0] == "number") { // If x and y positions were specified
      this.x = a[0]; // Sets x to provided x value
      this.y = a[1]; // Sets y to provided y value
      this.push(...(a.splice(2))); // Pushes all provided Cards to the Stack. Does nothing if no Cards were provided, since pushing nothing to an array does nothing. Needs splice to not push x and y values.
    } else { // If x and y positions were not specified
      this.x = 0; // Sets x to default 0
      this.y = 0; // Sets y to default 0
      this.push(...a); // Pushes all provided Cards to the Stack. Does nothing if no Cards were provided, since pushing nothing to an array does nothing.
    }
  }

  /**
   * Draws Stack on canvas with current (x,y) position, flipped state, and
   * direction
   * @param  {Number} [s=45]  Size-relative distance between Cards. Defaults to 45, which is really 22.5 for default size
   */
  draw(s = 45) {
    if (this.direction) { // Detect if rotation is neccessary
      ctx.save(); // Saves Canvas state for rotation
      ctx.translate(this.x, this.y); // Moves origin to Stack corner for rotation
      ctx.rotate(this.direction); // Rotates Canvas about new origin
      this.forEach(function(a, b) { // Iterates through each Card in the Stack
        draw(this.flipped ? cards.back : a.image, (b * s * this[0].size), 0, this[0].size); // Draws the Card with proper distance apart
      }, this);
      ctx.restore(); // Resets rotation by restoring Canvas state
    } else { // If rotation is not neccessary
      this.forEach(function(a, b) { // Iterates through each Card in the Stack
        draw(this.flipped ? cards.back : a.image, this.x + (b * s * this[0].size), this.y, this[0].size); // Draws the Card with proper distance apart. this.x and this.y neccessary since Canvas origin is not being transalted
      }, this);
    }
  }

  /**
   * Detects whether a given (x,y) coordinate is inside the Stack
   * @param  {Number}  x  X coordinate of the point to check
   * @param  {Number}  y  Y coordinate of the point to check
   * @return {Boolean}    True if the point is in the Stack, false if not
   */
  isIn(x, y) {
    switch (this.direction) { // Different formulas depending on direction
      case 0: // Facing forward
        return x >= this.x && x <= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI * 0.5: // Turned 90 deg clockwise
        return x <= this.x && x >= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI: // Turned 180 degrees
        return x <= this.x && x >= this.cornerX && y <= this.y && y >= this.cornerY;
      case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
        return x >= this.x && x <= this.cornerX && y <= this.y && y >= this.cornerY;
    }
  }
}

/**
 * A sample Stack for testing
 * @type {Stack}
 */
var test = new Stack(600, 200, new Card("as"), new Card("ah"), new Card("ac"), new Card("ad"));

/**
 * Handler for mouse downs.
 * @param  {MouseEvent} e MouseEvent that the EventListener was called on
 * @todo Add double click support for proper Stack moving
 * @todo Add Pile moving
 */
canvas.addEventListener("mousedown", function(e) {

  /**
   * X position of the mouse relative to the document
   * @type {Number}
   */
  var x = e.clientX,

  /**
   * Y position of the mouse relative to the document
   * @type {Number}
   */
    y = e.clientY,

    /**
     * If the mouse is in any lone Card, the lone Card the mouse is in. If not, undefined.
     * @type {Card|undefined}
     */
    card = allLoneCards.find((a) => (a.isIn(x, y))); // Tries to find a lone Card that the mouse is in
  if (card) { // If the mouse is in a lone Card
    dragging = {

      /**
       * The type of Object being dragged. Can currently be "card" or "stack"
       * @type {String}
       * @todo Need to add "pile" when pile dragging is added
       */
      type: "card",

      /**
       * The Object being dragged.
       * @type {Card|Stack}
       * @todo Change name ("card") to something more general (like "subject" or something), since now it can be a Card or Stack (and soon to be Pile)
       */
      card: card,

      /**
       * X value of the mouse
       * @type {Number}
       */
      x: x,

      /**
       * Y value of the mouse
       * @type {Number}
       */
      y: y,

      /**
       * The mouse down event that triggered the dragging
       * @type {MouseEvent}
       */
      e: e
    };
    console.log(dragging); // Logs the value for reference
    /** @todo Add better logic probably for left/right mouse detection. The division -> boolean method works but is probably not the best */
    card.flipped = Boolean(e.button / 2); // e.button will be 0 if left mouse click and 2 if right mouse click, so dividing by 2 makes it 0 if left click 1 if right click, and then converts it to a Boolean so flipped is false if left click and true if right click
    if (allLoneCards[0] != card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
      allLoneCards.unshift(allLoneCards.splice(allLoneCards.indexOf(cafrd), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
    }
    tick(); // Ticks once Card is determined. This is mainly to redraw the Card immediately so that if it was hidden below another Card, it would jump to the front (because of the directly above code) immediately instead of when you start moving it
  } else { // If the mouse is not on a Card
    var stack = allStacks.find((a) => (a.isIn(x, y))); // Tries to find a Stack that the mouse is in
    console.log(stack); // Logs Stack if found otherwise undefined for reference
    if (stack) { // If Stack was found
      dragging = {

        /**
         * The type of Object being dragged. Can currently be "card" or "stack"
         * @type {String}
         * @todo Need to add "pile" when pile dragging is added
         */
        type: "stack",

        /**
         * The Object being dragged.
         * @type {Card|Stack}
         * @todo Change name ("card") to something more general (like "subject" or something), since now it can be a Card or Stack (and soon to be Pile)
         */
        card: stack,

        /**
         * X value of the mouse
         * @type {Number}
         */
        x: x,

        /**
         * Y value of the mouse
         * @type {Number}
         */
        y: y,

        /**
         * The mouse down event that triggered the dragging
         * @type {MouseEvent}
         */
        e: e
      };
      console.log(dragging); // Logs Stack if found otherwise undefined for reference
      stack.flipped = Boolean(e.button / 2); // e.button will be 0 if left mouse click and 2 if right mouse click, so dividing by 2 makes it 0 if left click 1 if right click, and then converts it to a Boolean so flipped is false if left click and true if right click
      if (allStacks[0] != card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
        allStacks.unshift(allStacks.splice(allStacks.indexOf(card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
      }
      tick(); // Ticks once Card is determined. This is mainly to redraw the Card immediately so that if it was hidden below another Card, it would jump to the front (because of the directly above code) immediately instead of when you start moving it
    }
  }
});

/**
 * Handler for mouse movements.
 * @param  {MouseEvent} e MouseEvent that the EvenListener was called on
 */
canvas.addEventListener("mousemove", function(e) {
  if (dragging) { // If something is being dragged (no else, so if not, nothing happens; keep in mind, this is called every time the mouse is moved, so almost all calls will be dismissed)
    if (e.movementX || e.movementY) { /** @todo Check if having this if statement is redundant */ // If the mouse was actually moved, for redundancy (might be overly redundant and unneccessary)
      /** @todo Might not need anymore since it should be done in the onmousedown handler */
      if (dragging.type == "card") { // If a card is being dragged
        if (allLoneCards[0] != dragging.card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
          allLoneCards.unshift(allLoneCards.splice(allLoneCards.indexOf(dragging.card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
        }
      } else if (dragging.type == "stack") { // If a Stack is being dragged
        if (allStacks[0] != dragging.card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
          allStacks.unshift(allStacks.splice(allStacks.indexOf(card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
        }
      }
      dragging.card.x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
      dragging.card.y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
      tick(); // Redraws position changes
    }
  }
});
canvas.addEventListener("mouseup", function(e) {
  if (dragging) { // If something is being dragged (this would be false if the mouse was clicked on an empty spot in the Canvas)
    dragging = false;
  }
  console.log(false); // Logs dragging for reference. Since dragging was just set to false if it was not already false, it will now be false, so false is logged instead
});

/**
 * If nothing is currently being dragged, false, if something is being dragged,
 * what is being dragged.
 * @type {Boolean|Object}       dragging
 * @type {Undefined|String}     dragging.type  The type of Object being dragged. Can currently be "card" or "stack"
 * @type {undefined|Card|Stack} dragging.card  The Object being dragged.
 * @type {Number}               dragging.x     X value of the mouse
 * @type {Number}               dragging.y     Y value of the mouse
 */
var dragging = false;

canvas.oncontextmenu=()=>(false); // Disables context menu

/**
 * Draws all Piles, then Stacks, then lone Cards. The lone Cards will all
 * appear at the top, then the Stacks, then the Piles, since lone Cards are
 * drawn last and therefore overtop of Stacks, and the same for Stacks to Piles.
 * Piles, Stacks, and lone Cards are drawn in reverse order of their respective
 * arrays to ensure that the first item of each array is drawn above all others,
 * the second layered one down from the first, the third layered one down from
 * the second, etc.
 * @todo Eventually combine allPiles, allStacks, and allLoneCards into one
 * allObjects array. This would allow, for example, a Stack to be on top of a
 * lone Card, which due to current ordering cannot be done now. Would need to
 * heavily modify all code to use allObjects instead of the others, but most of
 * the work would just be find -> replace.
 */
function tick() {
  clearCanvas(); // Clear canvas before drawing
  allPiles.slice().reverse().forEach(function(a) { // Iterates through allPiles from allPiles[0] to allPiles[allPiles.length-1] (the last)
    a.draw(); // Draws the Pile
  });
  allStacks.slice().reverse().forEach(function(a) { // Iterates through allStacks from allStacks[0] to allStacks[allStacks.length-1] (the last)
    a.draw(); // Draws the Stack
  });
  allLoneCards.slice().reverse().forEach(function(a) { // Iterates through allLoneCards from allLoneCards[0] to allLoneCards[allLoneCards.length-1] (the last)
    a.draw(); // Draws the Card
  });
}

/**
 * Array of all lone Cards (cards not in a Stack or Pile). Inits to a list of 4
 * samples spaced apart like a Stack (just similar in the distance between
 * Cards)
 * @type {Array<Card>}
 */
var allLoneCards = [new Card("ac", 77.5, 10), new Card("ad", 55, 10), new Card("ah", 32.5, 10), new Card("as", 10, 10)];

cards.empty.addEventListener("load", function() { // When the final card (since empty is the last in the extras list in cards=getCards...) image is loaded
  tick(); // Draw everything
}, {
  once: true // Delete this EventListener after it is dispatched
});

/**
 * Class for card Piles, which are Cards stacked on top of one another such that
 * only the top card is visible, such as how one might place a deck of cards on
 * a table.
 * @extends Array
 */
class Pile extends Array {
  /**
    * Creates a Stack. Parameter can be applied four ways:
    *  1) Supply a variable amount of Cards. Creates a Stack with those Cards
    *     and sets position (x,y) to (0,0)
    *  2) Supply an x position, a y position, then a variable amount of Cards.
    *     Creates a Stack with those Cards and sets position (x,y) to the
    *     supplied (x,y) coordinates
    *  3) Supply only an x position and y position. Creates an empty Stack
    *     with the supplied (x,y) coordinates
    *  4) Supply no parameters. Creates an empty Stack and sets position (x,y)
    *     to (0,0)
    * @todo Add normalized this.size to replace this[0].size
    * @param  {Number|Card=}  a[0]        X position, first Card, or nothing
    * @param  {Number|Card=}  a[1]        Y position, second Card, or nothing
    * @param  {...Card=}      a.slice(2)  Rest of Card(s) to add to stack, or
    *                                     nothing
    */
  constructor(...a) {
    super();  // Called to allow later call of pushing all specified Cards to this
    allStacks.push(this); // Push this to array of allStacks for reference
    Object.defineProperties(this, { // Used to define getters and setters
      /**
       * Width of Stack used to calculate corner
       * @type {Number=}
       */
      width: {
        get: function() {
          return this[0] ? ((this.length - 1) * 45 * this[0].size) + (this[0].image.naturalWidth * this[0].size) : undefined;
        }
      },

      /**
       * Height of Stack used to calculate corner
       * @type {Number=}
       */
      height: {
        get: function() {
          return this[0] ? this[0].image.naturalHeight * this[0].size : undefined;
        }
      },

      /**
       * The x position of the opposite corner of the origin of Stack
       * @type {Number}
       */
      cornerX: {
        get: function() {
          switch (this.direction) { // Different formulas depending on direction
            case 0: // Facing forward
              return this.x + this.width;
            case Math.PI * 0.5: // Turned 90 deg clockwise
              return this.x - this.height;
            case Math.PI:  // Turned 180 degrees
              return this.x - this.width;
            case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
              return this.x + this.height;
          }
        }
      },

      /**
       * The y position of the opposite corner of the origin of the Stack
       * @type {Object}
       */
      cornerY: {
        get: function() {
          switch (this.direction) { // Different formulas depending on direction
            case 0: // Facing forward
              return this.y + this.height;
            case Math.PI * 0.5: // Turned 90 deg clockwise
              return this.y + this.width;
            case Math.PI:  // Turned 180 degrees
              return this.y - this.height;
            case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
              return this.y - this.width;
          }
        }
      },

      /**
       * X position of the Stack. Defined as setter and getter so that the
       * X position of the first Card in the Stack is set as well as the
       * X position of the Stack itself
       * @type {Number}
       */
      x: {
        get: function() {
          return this.X;
        },
        set: function(a) {
          if (this[0]) {
            this[0].x = a;
          }
          this.X = a;
        }
      },

      /**
       * Y position of the Stack. Defined as setter and getter so that the
       * Y position of the first Card in the Stack is set as well as the
       * Y position of the Stack itself
       * @type {Number}
       */
      y: {
        get: function() {
          return this.Y;
        },
        set: function(a) {
          if (this[0]) {
            this[0].y = a;
          }
          this.Y = a;
        }
      }
    });

    /**
     * If true, the stack will appear flipped over such that the Card value is
     * not visible. If false, the Card appears as normal. Default false.
     * @type {Boolean}
     */
    this.flipped = false;

    /**
     * Direction indicates the angle at which the Stack should appear in
     *
     * @type {Number}
     */
    this.direction = 0;

    if (typeof a[0] == "number") { // If x and y positions were specified
      this.x = a[0]; // Sets x to provided x value
      this.y = a[1]; // Sets y to provided y value
      this.push(...(a.splice(2))); // Pushes all provided Cards to the Stack. Does nothing if no Cards were provided, since pushing nothing to an array does nothing. Needs splice to not push x and y values.
    } else { // If x and y positions were not specified
      this.x = 0; // Sets x to default 0
      this.y = 0; // Sets y to default 0
      this.push(...a); // Pushes all provided Cards to the Stack. Does nothing if no Cards were provided, since pushing nothing to an array does nothing.
    }
  }

  draw(z = 0.5) {
    if (this[0]) {
      [this[0].x, this[0].y, this[0].size] = [this.x, this.y, z];
      if (this.direction) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        for (var i of Array.from(Array(this.length > 5 ? 4 : this.length - 1).keys()).reverse()) {
          draw(cards.empty, this.x - (i + 1) * 2, this.y - (i + 1) * 2);
        }
        this[0].draw();
        ctx.restore();
      } else {
        for (var j of Array.from(Array(this.length > 5 ? 4 : this.length - 1).keys()).reverse()) {
          draw(cards.empty, this.x - (j + 1) * 2, this.y - (j + 1) * 2);
        }
        this[0].draw();
      }
    }
  }

  /**
   * Detects whether a given (x,y) coordinate is inside the Stack
   * @param  {Number}  x  X coordinate of the point to check
   * @param  {Number}  y  Y coordinate of the point to check
   * @return {Boolean}    True if the point is in the Stack, false if not
   */
  isIn(x, y) {
    switch (this.direction) { // Different formulas depending on direction
      case 0: // Facing forward
        return x >= this.x && x <= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI * 0.5: // Turned 90 deg clockwise
        return x <= this.x && x >= this.cornerX && y >= this.y && y <= this.cornerY;
      case Math.PI: // Turned 180 degrees
        return x <= this.x && x >= this.cornerX && y <= this.y && y >= this.cornerY;
      case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
        return x >= this.x && x <= this.cornerX && y <= this.y && y >= this.cornerY;
    }
  }
}

/**
 * An Array holding one of each of a normal deck of Cards.
 * @type {Array<Card>}
 */
var fullDeck = [];

for (var i of ["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k"]) { // Iterates over ranks
  for (var j of ["h", "d", "c", "s"]) { // Iterates over suits
    fullDeck.push(new Card(i + j)); // Creates Card of rank and suit iterators and pushes to Array
  }
}

/**
 * Creates sample Pile with (x,y) position of (300,200) (just a place away from
 * other samples) with the fullDeck of Cards
 * @type {Pile}
 */
var tester = new Pile(300, 200, ...fullDeck);
