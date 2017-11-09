/**
 * @fileoverview Basic controllable cards with HTML Canvas and JS
 */

/**
 * Array of all Cards
 * @type {Array<Card>}
 */
let allCards = [];

/**
 * Array of all Stacks
 * @type {Array<Stack>}
 */
let allStacks = [];

/**
 * Array of all Piles
 * @type {Array<Pile>}
 */
let allPiles = [];

/**
 * Array of all lone Cards (cards not in a Stack or Pile)
 * @type {Array<Card>}
 */
let allLoneCards = [];

/**
 * If nothing is currently being dragged, false, if something is being dragged,
 * what is being dragged.
 * @type {Boolean|Object}       dragging
 * @type {undefined|String}     dragging.type         The type of Object being dragged. Can currently be "card" or "stack"
 * @type {undefined|Card|Stack} dragging.card         The Object being dragged.
 * @type {undefined|Number}     dragging.x            X value of the mouse
 * @type {undefined|Number}     dragging.y            Y value of the mouse
 * @type {undefined|MouseEvent} dragging.e            The mouse down event that triggered the dragging
 * @type {undefined|Number}     dragging.timeStamp    The timestamp of the start of dragging
 * @type {undefined|Boolean}    dragging.doubleClick  True if this is a double click, false if not
 * @type {undefined|Card}       dragging.specCard     The specific single card clicked in a Stack if dragging.card is a Stack, undefined otherwise
 */
let dragging = false;

/**
 * The previous Object to be dragged. Has a nonsense init value of false just
 * so any lastDragged.card or lastDragged.timeStamp does not throw an error and
 * instead just returns undefined
 * @type {undefined|Object}     dragging
 * @type {undefined|String}     dragging.type         The type of Object that was dragged. Can currently be "card" or "stack"
 * @type {undefined|Card|Stack} dragging.card         The Object that was dragged.
 * @type {undefined|Number}     dragging.x            X value of the mouse before last dragging
 * @type {undefined|Number}     dragging.y            Y value of the mouse before last dragging
 * @type {undefined|MouseEvent} dragging.e            The mouse down event that triggered the dragging
 * @type {undefined|Number}     dragging.timeStamp    The timestamp of the start of last dragging
 * @type {undefined|Boolean}    dragging.doubleClick  True if this is a double click, false if not
 * @type {undefined|Card}       dragging.specCard     The specific single card clicked in a Stack if lastDragged.card is a Stack, undefined otherwise
 */
let lastDragged = false;

/**
 * Constructor for cards.
 * @param       {String} a                                    Card rank + suit (e.g. "as" for Ace of Spades)
 * @param       {Number} [x=0]                                X position of top corner of card
 * @param       {Number} [y=0]                                Y position of top corner of card
 * @param       {Number} [e=0.5]                              Size (scale) of card.
 * @param       {Object<String, HTMLImageElement>} [d=cards]  Deck of card images to use. Default is global deck.
 * @constructor
 */
function Card(a, x = 0, y = 0, e = 0.5) {

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
        return this.x + this.width;
      },
    },

    /**
     * Y coordinate of bottom corner of the Card.
     * Used in determining if this Card was clicked
     * @type {Number}
     */
    cornerY: {
      get: function() {
        return this.y + this.height;
      },
    },
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
   * @param  {Number}       x                  X coordinate of the point to check
   * @param  {Number}       y                  Y coordinate of the point to check
   * @param  {Boolean}      [checkIsIn=false]  Whether to check if point is in the Stack using isIn(x,y) first. This defaults to false, since this function would generally only be called after confirmation that the point is in the Stack
   * @return {Card|Boolean}                    The Card in the Stack which the point is inside. If checkIsIn is true and if isIn is false, returns false. However, if checkIsIn is false (its default) and the point is not acutally inside the Stack, then this will likely return an error
   */
  getSpecCard(x, y, checkIsIn = false) {
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
    return this[index < this.length ? index : this.length - 1];
  }
}

/**
 * A sample Stack for testing
 * @type {Stack}
 */
let test = new Stack(600, 200, new Card("as"), new Card("ah"), new Card("ac"), new Card("ad"));

`
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
  let x = e.clientX,

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
      doubleClick: e.timeStamp - lastDragged.timeStamp < 500 && card === lastDragged.card,
    };
    console.log(dragging); // Logs the value for reference
    /** @todo Add better logic probably for left/right mouse detection. The division -> boolean method works but is probably not the best */
    card.flipped = Boolean(e.button / 2); // e.button will be 0 if left mouse click and 2 if right mouse click, so dividing by 2 makes it 0 if left click 1 if right click, and then converts it to a Boolean so flipped is false if left click and true if right click
    if (allLoneCards[0] !== card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
      allLoneCards.unshift(allLoneCards.splice(allLoneCards.indexOf(card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
    }
    tick(); // Ticks once Card is determined. This is mainly to redraw the Card immediately so that if it was hidden below another Card, it would jump to the front (because of the directly above code) immediately instead of when you start moving it
  } else { // If the mouse is not on a Card
    let stack = allStacks.find((a) => (a.isIn(x, y))); // Tries to find a Stack that the mouse is in
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
        doubleClick: e.timeStamp - lastDragged.timeStamp < 500 && stack === lastDragged.card,

        /**
         * The specific single card clicked in a Stack if dragging.card is a Stack, undefined otherwise
         * @type {Card}
         */
        specCard: stack.getSpecCard(x, y),
      };
      console.log(dragging); // Logs Stack if found otherwise undefined for reference
      stack.flipped = Boolean(e.button / 2); // e.button will be 0 if left mouse click and 2 if right mouse click, so dividing by 2 makes it 0 if left click 1 if right click, and then converts it to a Boolean so flipped is false if left click and true if right click
      if (allStacks[0] !== card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
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
      if (dragging.type === "card") { // If a card is being dragged
        if (allLoneCards[0] !== dragging.card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
          allLoneCards.unshift(allLoneCards.splice(allLoneCards.indexOf(dragging.card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
        }
      } else if (dragging.type === "stack") { // If a Stack is being dragged
        if (allStacks[0] !== dragging.card) { // Detects if the Card is topmost lone Card (the first in the allLoneCards array)
          allStacks.unshift(allStacks.splice(allStacks.indexOf(dragging.card), 1)[0]); // Gets index of the Card, splices it out of allLoneCards, then unshifts it to add it to the beginning, which basically moves it to the top
        }
      }
      if (dragging.type === "card") { // If a card is being dragged
        dragging.card.x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
        dragging.card.y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
      } else if (dragging.type === "stack") { // If a Stack is being dragged
        if (dragging.doubleClick) { // If the Stack was double clicked
          dragging.card.x += e.movementX; // Updates x position of the Card by adding mouse movement to the current x position
          dragging.card.y += e.movementY; // Updates x position of the Card by adding mouse movement to the current x position
        } else {

        }
      }
      tick(); // Redraws position changes
    }
  }
});
canvas.addEventListener("mouseup", function() {
  if (dragging) { // If something is being dragged (this would be false if the mouse was clicked on an empty spot in the Canvas)
    lastDragged = dragging;
    dragging = false;
  }
  console.log(false); // Logs dragging for reference. Since dragging was just set to false if it was not already false, it will now be false, so false is logged instead
}); `;

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
    allPiles.push(this); // Push this to array of allStacks for reference
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
let fullDeck = [];

for (let i of ["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k", ]) { // Iterates over ranks
  for (let j of ["h", "d", "c", "s", ]) { // Iterates over suits
    fullDeck.push(new Card(i + j)); // Creates Card of rank and suit iterators and pushes to Array
  }
}

/**
 * Creates sample Pile with (x,y) position of (300,200) (just a place away from
 * other samples) with the fullDeck of Cards
 * @type {Pile}
 */
let tester = new Pile(300, 200, ...fullDeck);

allLoneCards.push(new Card("ac", 77.5, 10), new Card("ad", 55, 10), new Card("ah", 32.5, 10), new Card("as", 10, 10)); // Adds samples spaced apart like a Stack (just similar in the distance between Cards)
