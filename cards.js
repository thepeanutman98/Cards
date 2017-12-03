/**
 * @fileoverview Basic controllable cards with HTML Canvas and JS
 */

/**
 * The Canvas element
 * @type {HTMLCanvasElement}
 */
let canvas = document.getElementById("canvas");

/**
 * The rendering context of the Canvas
 * @type {CanvasRenderingContext2D}
 */
let ctx = canvas.getContext('2d');

/**
 * Array of all Objects (Cards, Stacks, and Piles) in order of top to bottom.
 * @type {Array}
 */
let allObjects = [];

/**
 * If nothing is currently being dragged, false, if something is being dragged,
 * what is being dragged.
 * @type {Boolean|Object}       dragging
 * @type {undefined|String}     dragging.type         The type of Object being dragged. Can currently be "card" or "stack"
 * @type {undefined|Card|Stack} dragging.object       The Object being dragged.
 * @type {undefined|Number}     dragging.x            X value of the mouse
 * @type {undefined|Number}     dragging.y            Y value of the mouse
 * @type {undefined|MouseEvent} dragging.e            The mouse down event that triggered the dragging
 * @type {undefined|Number}     dragging.timeStamp    The timestamp of the start of dragging
 * @type {undefined|Boolean}    dragging.doubleClick  True if this is a double click, false if not
 * @type {undefined|Card}       dragging.specCard     The specific single card clicked in a Stack if dragging.object is a Stack, undefined otherwise
 */
let dragging = false;

/**
 * The previous Object to be dragged. Has a nonsense init value of false just
 * so any lastDragged.card or lastDragged.timeStamp does not throw an error and
 * instead just returns undefined
 * @type {undefined|Object}     dragging
 * @type {undefined|String}     dragging.type         The type of Object that was dragged. Can currently be "card" or "stack"
 * @type {undefined|Card|Stack} dragging.object       The Object that was dragged.
 * @type {undefined|Number}     dragging.x            X value of the mouse before last dragging
 * @type {undefined|Number}     dragging.y            Y value of the mouse before last dragging
 * @type {undefined|MouseEvent} dragging.e            The mouse down event that triggered the dragging
 * @type {undefined|Number}     dragging.timeStamp    The timestamp of the start of last dragging
 * @type {undefined|Boolean}    dragging.doubleClick  True if this is a double click, false if not
 * @type {undefined|Card}       dragging.specCard     The specific single card clicked in a Stack if lastDragged.card is a Stack, undefined otherwise
 */
let lastDragged = false;

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
  let temp = {};
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
const cards = getCards(["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k", ], ["h", "d", "c", "s", ], ["back", "empty", "outline", ]);

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
function clearCanvas() {
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
 * Draws all Piles, then Stacks, then lone Cards. The lone Cards will all
 * appear at the top, then the Stacks, then the Piles, since lone Cards are
 * drawn last and therefore overtop of Stacks, and the same for Stacks to Piles.
 * Piles, Stacks, and lone Cards are drawn in reverse order of their respective
 * arrays to ensure that the first item of each array is drawn above all others,
 * the second layered one down from the first, the third layered one down from
 * the second, etc.
 */
function tick() {
  clearCanvas(); // Clear canvas before drawing
  allObjects.slice().reverse().forEach(function(a) { // Iterates through allObjects from allObjects[0] to allObjects[allObjects.length-1] (the last)
    a.draw(); // Draws the Object
  });
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
   * False for no outline, "stack" or "pile" for showing an outline similar to
   * where the next card would be if it was in a Stack or Pile, respectively
   * @type {String|Boolean}
   */
  this.outline = false;

  /**
   * Draw Card with current flipped state, (x,y) position, and size
   */
  this.draw = function() {
    if (this.direction) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.direction);
      draw(this.flipped ? cards.back : this.image, 0, 0, this.size);
      if (this.outline) {
        if (this.outline === "stack") {
          draw(cards.outline, 22.5, 0, this.size);
        } else if (this.outline === "pile") {
          draw(cards.outline, 2, 2, this.size);
        }
        this.outline = false;
      }
      ctx.restore();
    } else {
      draw(this.flipped ? cards.back : this.image, this.x, this.y, this.size);
      if (this.outline) {
        if (this.outline === "stack") {
          draw(cards.outline, this.x + 22.5, this.y, this.size);
        } else if (this.outline === "pile") {
          draw(cards.outline, this.x + 2, this.y + 2, this.size);
        }
        this.outline = false;
      }
    }
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
      },
    },

    /**
     * Getter for height of Card
     * @type {Number}
     */
    height: {
      get: function() {
        return this.image.naturalHeight * this.size;
      },
    },

    /**
     * X coordinate of bottom corner of the Card.
     * Used in determining if this Card was clicked
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
      },
    },

    /**
     * Y coordinate of bottom corner of the Card.
     * Used in determining if this Card was clicked
     * @type {Number}
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
      },
    },
  });

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
    Object.defineProperties(this, { // Used to define getters and setters
      /**
       * Width of Stack used to calculate corner
       * @type {Number=}
       */
      width: {
        get: function() {
          return this[0] ? ((this.length - 1) * 45 * this[0].size) + (this[0].image.naturalWidth * this[0].size) : undefined;
        },
      },

      /**
       * Height of Stack used to calculate corner
       * @type {Number=}
       */
      height: {
        get: function() {
          return this[0] ? this[0].image.naturalHeight * this[0].size : undefined;
        },
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
        },
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
        },
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
        },
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
        },
      },
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

    /**
     * Index of the Card at which an outline should be drawn, or false if none
     * @type {Number|Boolean}
     */
    this.outlineIndex = false;

    /**
     * Whether or not to show an outline over where the last card would be if a
     * card was added to the Stack.
     * @type {Boolean}
     */
    this.lastOutline = false;

    if (typeof a[0] === "number") { // If x and y positions were specified
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
        if ((this.outlineIndex === b) || (dragging.specCard && !dragging.doubleClick && a === dragging.specCard)) {
          draw(cards.outline, (b * s * this[0].size), 0, this[0].size); // Draws the outline
          if (this.outlineIndex !== false) {
            this.outlineIndex = false;
          }
        }
      }, this);
      if (this.lastOutline) {
        draw(cards.outline, (this.length * s * this[0].size), 0, this[0].size); // Draws the last outline
        this.lastOutline = false;
      }
      ctx.restore(); // Resets rotation by restoring Canvas state
    } else { // If rotation is not neccessary
      this.forEach(function(a, b) { // Iterates through each Card in the Stack
        draw(this.flipped ? cards.back : a.image, this.x + (b * s * this[0].size), this.y, this[0].size); // Draws the Card with proper distance apart. this.x and this.y neccessary since Canvas origin is not being transalted
        if ((this.outlineIndex === b) || (dragging.specCard && !dragging.doubleClick && a === dragging.specCard)) {
          draw(cards.outline, this.x + (b * s * this[0].size), this.y, this[0].size); // Draws the Card with proper distance apart. this.x and this.y neccessary since Canvas origin is not being transalted
          if (this.outlineIndex !== false) {
            this.outlineIndex = false;
          }
        }
      }, this);
      if (this.lastOutline) {
        draw(cards.outline, this.x + (this.length * s * this[0].size), this.y, this[0].size); // Draws the last outline
        this.lastOutline = false;
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

  /**
   * Detects which Card in the Stack the (x,y) coordinate is inside
   * @param  {Number}       x                    X coordinate of the point to check
   * @param  {Number}       y                    Y coordinate of the point to check
   * @param  {Boolean}      [returnIndex=false]  True to return the numeric index, false (or blank) to return Card
   * @param  {Boolean}      [scrub=true]         Whether or not to scrub return value by changing indices higher than the length to the top card. Only applicalbe if returnIndex is true, otherwise has no effect
   * @param  {Boolean}      [checkIsIn=false]    Whether to check if point is in the Stack using isIn(x,y) first. This defaults to false, since this function would generally only be called after confirmation that the point is in the Stack
   * @return {Card|Boolean}                      The Card in the Stack which the point is inside. If checkIsIn is true and if isIn is false, returns false. However, if checkIsIn is false (its default) and the point is not acutally inside the Stack, then this will likely return an error
   */
  getSpecCard(x, y, returnIndex = false, scrub = true, checkIsIn = false) {
    if (checkIsIn) {
      if (!this.isIn(x, y)) {
        return false;
      }
    }
    let index;
    switch (this.direction) { // Different formulas depending on direction
      case 0: // Facing forward
        index = Math.floor((x-this.x)/22.5);
        break;
      case Math.PI * 0.5: // Turned 90 deg clockwise
        index = Math.floor((y-this.y)/22.5);
        break;
      case Math.PI: // Turned 180 degrees
        index = Math.floor((this.x-x)/22.5);
        break;
      case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
        index = Math.floor((this.y-y)/22.5);
        break;
    }
    if (returnIndex) {
      return scrub ? (index < this.length ? index : this.length - 1) : index;
    } else {
      return this[index < this.length ? index : this.length - 1];
    }
  }
}

/**
 * Handler for mouse downs.
 * @param  {MouseEvent} e MouseEvent that the EventListener was called on
 * @todo Add double click support for proper Stack moving
 * @todo Add Pile moving
 */
canvas.addEventListener("mousedown", function(e) {
  if (!dragging) {
    /**
     * X position of the mouse relative to the document
     * @type {Number}
     */
    let x = e.clientX,

    /**
     * Y position of the mouse relative to the document
     * @type {Number}
     */
      y = e.clientY,

    /**
     * If the mouse is in any Object, the index of allObjects corresponding to the Object the mouse is in. If not, -1.
     * @type {Number}
     */
    index = allObjects.findIndex((a) => (a.isIn(x, y))), // Tries to find the index of a lone Card that the mouse is in

    /**
     * If the mouse is in any Object, the Object the mouse is in. If not, undefined.
     * @type {Card|Stack|Pile|undefined}
     */
     object = allObjects[index];
    if (object) { // If the mouse is in an Object
      let type = object.constructor.name.toLowerCase();
      if (e.button === 0) { // left mouse button
        if (object.flipped) {
          if (type === "stack" || type === "pile") {
            object.reverse();
          }
          object.flipped = false;
        }
      } else if (e.button === 2) { // right mouse button
        if (!object.flipped) {
          if (type === "stack" || type === "pile") {
            object.reverse();
          }
          object.flipped = true;
        }
      }
      dragging = {

        /**
         * The type of Object being dragged. Can currently be "card", "stack", or "pile"
         * @type {String}
         */
        type: type,

        /**
         * The Object being dragged.
         * @type {Card|Stack|Pile}
         */
        object: object,

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
        e: e,

        /**
         * The timestamp of the start of dragging
         * @type {Number}
         */
        timeStamp: e.timeStamp,

        /**
         * True if this is a double click, false if not.
         * @type {Boolean}
         */
        doubleClick: ((e.timeStamp - lastDragged.timeStamp) < 500) && (object === lastDragged.object),

        /**
         * The specific single card clicked in a Stack if dragging.object is a Stack, undefined otherwise
         * @type {Card|undefined}
         */
        specCard: (object.constructor.name.toLowerCase() === "stack") ? object.getSpecCard(x, y) : undefined,

        /**
         * If dragging.object is a Stack, the index of the specific single card clicked, undefined otherwise
         * @type {Number|undefined}
         */
        specCardIndex: (object.constructor.name.toLowerCase() === "stack") ? object.indexOf(object.getSpecCard(x, y)) : undefined,

        /**
         * Whether or not the card has actually been moved yet (if movemouse has been dispatched yet).
         * Defaults to false, since the Object has not been moved when it has just been clicked.
         * @type {Boolean}
         */
        draggedYet: false,

        /**
         * If the mouse is in any Object, the index of allObjects corresponding to the Object the mouse is in. If not, -1.
         * @type {Number}
         */
        index: index,
      };
      console.log(dragging); // Logs the value for reference
      if (allObjects[0] !== object) { // Detects if the Object is topmost Object (the first in the allObjects array)
        allObjects.unshift(allObjects.splice(allObjects.indexOf(object), 1)[0]); // Gets index of the Card, splices it out of allObjects, then unshifts it to add it to the beginning, which basically moves it to the top
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
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    if (!dragging.draggedYet) {
      if (dragging.type === "card") { // If a card is being dragged
        // if first time card actions ever need to be taken
      } else if (dragging.type === "stack") { // If a Stack is being dragged
        if (dragging.doubleClick) { // If the Stack was double clicked
          console.log("first time double clicked stack");
        } else {
          allObjects.unshift(dragging.object.splice(dragging.specCardIndex, 1)[0]);
          let specCardIndex = dragging.specCardIndex;
          allObjects[0].flipped = allObjects[1].flipped;
          allObjects[0].direction = allObjects[1].direction;
          if (allObjects[1].length === 1) {
            allObjects[1][0].flipped = allObjects[1].flipped;
            allObjects[1][0].direction = allObjects[1].direction;
            allObjects[1][0].x = allObjects[1].x;
            allObjects[1][0].y = allObjects[1].y;
            allObjects.splice(1, 1, allObjects[1][0]);
          }
          dragging = {
            type: "card",
            object: allObjects[0],
            x: e.clientX,
            y: e.clientY,
            e: e,
            timeStamp: e.timeStamp,
            doubleClick: false,
            draggedYet: true,
            index: 0,
          };
          switch (allObjects[0].direction) { // Different formulas depending on direction
            case 0: // Facing forward
              allObjects[0].x = allObjects[1].x + (specCardIndex * 22.5);
              allObjects[0].y = allObjects[1].y;
              break;
            case Math.PI * 0.5: // Turned 90 deg clockwise
              allObjects[0].x = allObjects[1].x;
              allObjects[0].y = allObjects[1].y + (specCardIndex * 22.5);
              break;
            case Math.PI:  // Turned 180 degrees
              allObjects[0].x = allObjects[1].x - (specCardIndex * 22.5);
              allObjects[0].y = allObjects[1].y;
              break;
            case Math.PI * 1.5: // Turned 90 deg counterclockwise (270 clockwise)
              allObjects[0].x = allObjects[1].x;
              allObjects[0].y = allObjects[1].y - (specCardIndex * 22.5);
              break;
          }
          allObjects[0].direction = allObjects[1].direction;
        }
      } else if (dragging.type === "pile") { // If a Stack is being dragged
        if (dragging.doubleClick) { // If the Stack was double clicked
          console.log("first double clicked pile");
        } else {
          allObjects.unshift(dragging.object.shift());
          allObjects[0].flipped = allObjects[1].flipped;
          allObjects[0].direction = allObjects[1].direction;
          if (allObjects[1].length === 1) {
            allObjects[1][0].flipped = allObjects[1].flipped;
            allObjects[1][0].direction = allObjects[1].direction;
            allObjects[1][0].x = allObjects[1].x - 2;
            allObjects[1][0].y = allObjects[1].y - 2;
            allObjects.splice(1, 1, allObjects[1][0]);
          }
          dragging = {
            type: "card",
            object: allObjects[0],
            x: e.clientX,
            y: e.clientY,
            e: e,
            timeStamp: e.timeStamp,
            doubleClick: false,
            draggedYet: true,
            index: 0,
          };
        }
      }
      dragging.draggedYet = true;
    }
    if (dragging.type === "card") { // If a card is being dragged
      allObjects[0].x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
      allObjects[0].y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
    } else if (dragging.type === "stack") { // If a Stack is being dragged
      if (dragging.doubleClick) { // If the Stack was double clicked
        allObjects[0].x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
        allObjects[0].y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
      } else {
        console.log("single clicked stack");
      }
    } else if (dragging.type === "pile") { // If a Stack is being dragged
      if (dragging.doubleClick) { // If the Stack was double clicked
        allObjects[0].x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
        allObjects[0].y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
      } else {
        console.log("single clicked pile");
      }
    } else {
      console.log("object type not recognized in mousemove", dragging);
    }
    if (dragging.type === "card") {
      dragging.overIndex = allObjects.findIndex((a) => (a !== dragging.object && a.isIn(e.clientX, e.clientY)));
      dragging.over = allObjects[dragging.overIndex];
      if (dragging.over) {
        if (dragging.over.constructor.name.toLowerCase() === "pile") {
          dragging.over.isOutline = true;
        } else if (dragging.over.constructor.name.toLowerCase() === "stack") {
          let overSpecCardIndex = dragging.over.getSpecCard(e.clientX, e.clientY, true, false);
          if (overSpecCardIndex > dragging.over.length) {
            dragging.over.lastOutline = true;
            dragging.over.outlineIndex = dragging.over.length;
          } else {
            dragging.over.outlineIndex = overSpecCardIndex;
          }
        } else if (dragging.over.constructor.name.toLowerCase() === "card") {
          let xDiff = dragging.object.x - dragging.over.x,
            yDiff = dragging.object.y - dragging.over.y;
          if (yDiff < 0.5 * dragging.over.height) {
            if (22.5 <= xDiff && xDiff < 45) {
              dragging.over.outline = "stack";
            } else if (-22.5 <= xDiff && xDiff < 22.5) {
              dragging.over.outline = "pile";
            }
          }
        }
      }
    }
    tick(); // Redraws position changes
  }
});
canvas.addEventListener("mouseup", function() {
  if (dragging) { // If something is being dragged (this would be false if the mouse was clicked on an empty spot in the Canvas)
    lastDragged = dragging;
    if (dragging.over) {
      if (dragging.over.constructor.name.toLowerCase() === "pile") {
        dragging.over.unshift(allObjects[0]);
        allObjects.splice(0, 1);
      } else if (dragging.over.constructor.name.toLowerCase() === "stack") {
        let overSpecCardIndex = dragging.over.getSpecCard(dragging.x, dragging.y, true, false);
        dragging.over.splice(overSpecCardIndex > dragging.over.length ? dragging.over.length : overSpecCardIndex, 0, allObjects[0]);
        if (dragging.over.lastOutline) {
          dragging.over.outlineIndex = false;
          dragging.over.lastOutline = false;
        }
        allObjects.splice(0, 1);
        tick();
      } else if (dragging.over.constructor.name.toLowerCase() === "card") {
        let xDiff = dragging.object.x - dragging.over.x,
          yDiff = dragging.object.y - dragging.over.y;
        if (yDiff < 0.5 * dragging.over.height) {
          if (22.5 <= xDiff && xDiff < 45) {
            allObjects.splice(0, 1, new Stack(dragging.over.x, dragging.over.y, allObjects.splice(dragging.overIndex, 1)[0], dragging.object));
            allObjects[0].flipped = dragging.over.flipped;
            allObjects[0].direction = dragging.over.direction;
          } else if (-22.5 <= xDiff && xDiff < 22.5) {
            allObjects.splice(0, 1, new Pile(dragging.over.x, dragging.over.y, allObjects.splice(dragging.overIndex, 1)[0], dragging.object));
            allObjects[0].flipped = dragging.over.flipped;
            allObjects[0].direction = dragging.over.direction;
          }
        }
      }
    }
    dragging = false;
  }
  console.log(false); // Logs dragging for reference. Since dragging was just set to false if it was not already false, it will now be false, so false is logged instead
  tick();
});

window.addEventListener("keypress", function(e) {
  switch (e.key) {
    case "d":
      console.log(dragging);
      break;
    case "a":
      console.log(allObjects);
      break;
    default:
      console.log(e);
  }
});

canvas.oncontextmenu=()=>(false); // Disables context menu

cards.empty.addEventListener("load", function() { // When the final card (since empty is the last in the extras list in cards=getCards...) image is loaded
  tick(); // Draw everything
}, {
  once: true, // Delete this EventListener after it is dispatched
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
    * @param  {Number|Card|undefined}  a[0]        X position, first Card, or nothing
    * @param  {Number|Card|undefined}  a[1]        Y position, second Card, or nothing
    * @param  {...Card|undefined}      a.slice(2)  Rest of Card(s) to add to stack, or
    *                                     nothing
    */
  constructor(...a) {
    super();  // Called to allow later call of pushing all specified Cards to this
    Object.defineProperties(this, { // Used to define getters and setters
      /**
       * Width of Stack used to calculate corner
       * @type {Number=}
       */
      width: {
        get: function() {
          return this[0] ? this[0].image.naturalWidth * this[0].size : undefined;
        },
      },

      /**
       * Height of Stack used to calculate corner
       * @type {Number=}
       */
      height: {
        get: function() {
          return this[0] ? this[0].image.naturalHeight * this[0].size : undefined;
        },
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
        },
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
        },
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
        },
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
        },
      },
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

    /**
     * Whether or not the outline should be drawn on top.
     * @type {Boolean}
     */
    this.isOutline = false;

    if (typeof a[0] === "number") { // If x and y positions were specified
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
      [this[0].x, this[0].y, this[0].size, ] = [this.x, this.y, z, ];
      if (this.direction) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        let i;
        for (i of Array.from(Array(this.length > 5 ? 4 : this.length - 1).keys()).reverse()) {
          draw(cards.empty, this.x - (i + 1) * 2, this.y - (i + 1) * 2);
        }
        draw(this.flipped ? cards.back : this[0].image, 0, 0, this[0].size);
        if (this.isOutline || (dragging.object === this && !dragging.doubleClick)) {
          draw(cards.outline, this.x, this.y);
          if (this.isOutline) {
            this.isOutline = false;
          }
        }
        ctx.restore();
      } else {
        for (let j of Array.from(Array(this.length > 5 ? 4 : this.length - 1).keys()).reverse()) {
          draw(cards.empty, this.x - (j + 1) * 2, this.y - (j + 1) * 2);
        }
        draw(this.flipped ? cards.back : this[0].image, this.x, this.y, this[0].size);
        if (this.isOutline || (dragging.object === this && !dragging.doubleClick)) {
          draw(cards.outline, this.x, this.y);
          if (this.isOutline) {
            this.isOutline = false;
          }
        }
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

allObjects.push(new Stack(600, 200, new Card("as"), new Card("ah"), new Card("ac"), new Card("ad")));

/**
 * An Array holding one of each of a normal deck of Cards.
 * @type {Array<Card>}
 */
let fullDeck = [];

for (let i of ["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k", ]) { // Iterates over ranks
  for (let j of ["h", "d", "c", "s", ]) { // Iterates over suits
    fullDeck.push(new Card(i + j)); // Creates Card of rank and suit iterators and pushes to Array
  }
}

allObjects.push(new Pile(300, 200, ...fullDeck));

allObjects.push(new Card("ac", 77.5, 10), new Card("ad", 55, 10), new Card("ah", 32.5, 10), new Card("as", 10, 10)); // Adds samples spaced apart like a Stack (just similar in the distance between Cards)
