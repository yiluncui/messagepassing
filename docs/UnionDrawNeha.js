//==============================================================================
// ORBITER VARIABLES
//==============================================================================
// The Orbiter object, which is the root of Union's JavaScript client framework
/*var orbiter;
// The MessageManager object, for sending and receiving messages
var msgManager;
// A convenience reference to net.user1.orbiter.UPC, which provides a
// list of valid client/server UPC messages. See: http://unionplatform.com/specs/upc/
var UPC = net.user1.orbiter.UPC;
// The ID of the room users will join in order to draw together
//var roomID = "examples.uniondraw";
// A hash of client attribute names used in this application. Each client sets a
// "thickness" attribute and a "color" attribute, specify the thickness and 
// color of the current line being drawn.*/
var Attributes = {THICKNESS:"thickness", 
                  COLOR:"color"};
// A hash of room message names used in this application. MOVE means move the
// drawing pen to the specified position. PATH supplies a list of points to be
// drawn.
var Messages = {MOVE:"MOVE", 
                PATH:"PATH"};

//==============================================================================
// LOCAL USER VARIABLES
//==============================================================================
// A flag to track whether the user is drawing or not
var isPenDown = false;

// Line defaults
var defaultLineColor = "#AAAAAA";
var defaultLineThickness = 1;
var maxLineThickness = 30;

// Tracks the current location of the user's drawing pen
var localPen = {};

// The user's line styles 
var localLineColor = defaultLineColor;
var localLineThickness = defaultLineThickness;

// A list of points in a path to send to other connected users
var bufferedPath = [];
// A timestamp indicating the last time a point was added to the bufferedPath
var lastBufferTime = new Date().getTime();

//==============================================================================
// REMOTE USER VARIABLES
//==============================================================================
// A hash of pen positions for remote users, in the following 
// format ("2345" is an example client ID):
//  {"2345": {x:10, y:10}}
var userCurrentPositions = {};
// A hash of pending drawing commands sent by remote users, the following format: 
//  {"2345": [{commandName:moveTo, arg:{x:10, y:10}}, {commandName:lineTo, arg:{x:55, y:35}}]};
var userCommands = {};
// A hash of line colors for remote users, in the following format:
//  {"2345": "#CCCCCC"};
var userColors = {};
// A hash of line thicknesses for remote users, in the following format:
//  {"2345": 5};
var userThicknesses = {};

//==============================================================================
// DRAWING VARIABLES
//==============================================================================
// The HTML5 drawing canvas
var canvas;
// The drawing canvas's context, through which drawing commands are performed
var context;
// A hash of drawing commands executed by UnionDraw's rendering process
var DrawingCommands = {LINE_TO:       "lineTo",
                       MOVE_TO:       "moveTo",
                       SET_THICKNESS: "setThickness",
                       SET_COLOR:     "setColor"};

//==============================================================================
// TIMER VARIABLES
//==============================================================================
// The ID for a timer that sends the user's drawing path on a regular interval
var broadcastPathIntervalID;
// The ID for a timer that executes drawing commands sent by remote users
var processDrawingCommandsIntervalID;

//==============================================================================
// TOUCH-DEVICE VARIABLES
//==============================================================================
var hasTouch = false;

//==============================================================================
// INITIALIZATION
//==============================================================================
// Trigger init() when the document finishes loading
window.onload = init;

// Main initialization function
function init () {
  console.log("***********************inside uniondraw's init***************************");
 chatHistory  = document.getElementById('chatHistory');
    chatMessage  = document.getElementById('chatMessage');
  initCanvas();
  registerInputListeners();

  //initOrbiter();
  //iPhoneToTop();
  
  //setStatus("Connecting to UnionDraw...");
}

// Set up the drawing canvas
function initCanvas () {
	console.log("inside init");
	
	var canvasContainer = document.getElementById("canvasContainer");
	
    canvasContainer.style.position="absolute";
    // Set to 100% so that it will have the dimensions of the document
    canvasContainer.style.left="0px";
    canvasContainer.style.top="35px";
    canvasContainer.style.width="600px";
    canvasContainer.style.height="400px";
    canvasContainer.style.backgroundColor="#333333";
    canvasContainer.style.zIndex="1";
	
	// Retrieve canvas reference
	canvas = document.getElementById("canvas");

	// If IE8, do IE-specific canvas initialization (required by excanvas.js)
	if (typeof G_vmlCanvasManager != "undefined") {
	this.canvas = G_vmlCanvasManager.initElement(this.canvas);
	}

	// Size canvas
	canvas.width  = 600;
	canvas.height = 400;

	// Retrieve context reference, used to execute canvas drawing commands

	context = canvas.getContext('2d');
	context.lineCap = "round";

	// Set control panel defaults
	document.getElementById("thickness").selectedIndex = 0;
	document.getElementById("color").selectedIndex = 1;
	console.log("completed init");
}

// Register callback functions to handle user input
function registerInputListeners () {
  canvas.onmousedown = pointerDownListener;
  document.onmousemove = pointerMoveListener;
  document.onmouseup = pointerUpListener;
  document.ontouchstart = touchDownListener;
  document.ontouchmove = touchMoveListener;
  document.ontouchend = touchUpListener;
  document.getElementById("thickness").onchange = thicknessSelectListener;
  document.getElementById("color").onchange = colorSelectListener;
  	console.log("finished registering listeners");
}

function init_canvas_context()
{
	console.log("************* initializing context here!!!");
	Signaling.CanvasContext[Signaling.fifoId] = context;
	console.log("the fifo id is :" + Signaling.fifoId + " and context is : " + Signaling.CanvasContext[Signaling.fifoId]);
	
}

function createPeerCanvas(peerFifoId) 
{
	console.log("creating a peer canvas! for fifo :" + peerFifoId);
	
	var canvasContainer = document.getElementById("canvasContainer");
	
    canvasContainer.style.position="absolute";
    // Set to 100% so that it will have the dimensions of the document
    //canvasContainer.style.left="0px";
    //canvasContainer.style.top="35px";
    //canvasContainer.style.width="600px";
    //canvasContainer.style.height="400px";
    canvasContainer.style.zIndex="1";
	
	var myCanvas = document.createElement('canvas');
	myCanvas.style.width = canvasContainer.scrollWidth+"px";
    myCanvas.style.height = canvasContainer.scrollHeight+"px";
    // You must set this otherwise the canvas will be streethed to fit the container
    myCanvas.width=canvasContainer.scrollWidth;
    myCanvas.height=canvasContainer.scrollHeight;
    myCanvas.style.overflow = 'visible';
    myCanvas.style.position = 'absolute';
    myCanvas.id = "c" + peerFifoId;
    //myCanvas.style.backgroundColor = "#CC8F2B";
    myCanvas.style.zIndex = "1";
    
    var myContext = myCanvas.getContext('2d');
    myContext.lineCap = "round";
    //myContext.globalAlpha = 0;
    Signaling.CanvasContext[peerFifoId] = myContext;
    canvasContainer.appendChild(myCanvas);
    
    var origCanvas = document.getElementById("canvas");
    console.log("orig canvas z-index is :" + origCanvas.style.zIndex);
    origCanvas.style.zIndex = "1005";
    
    /*var canvasContext  = myCanvas.getContext('2d');
    canvasContext.globalAlpha = 1;
	canvasContainer.appendChild(myCanvas);*/

}

//==============================================================================
// ORBITER EVENT LISTENERS
//==============================================================================
// Triggered when the connection to Union Server is ready
/*function readyListener (e) {
  // Register for UPC messages from Union Server
  msgManager.addMessageListener(UPC.JOINED_ROOM, joinedRoomListener, this);
  msgManager.addMessageListener(UPC.ROOM_OCCUPANTCOUNT_UPDATE, 
                                roomOccupantCountUpdateListener, this);  
  msgManager.addMessageListener(UPC.ROOM_SNAPSHOT, roomSnapshotListener, this);
  msgManager.addMessageListener(UPC.CLIENT_ATTR_UPDATE, clientAttributeUpdateListener, this);
  msgManager.addMessageListener(UPC.CLIENT_REMOVED_FROM_ROOM, clientRemovedFromRoomListener, this);
  
  // Register for custom messages from other users
  msgManager.addMessageListener(Messages.MOVE, moveMessageListener, this, [roomID]);
  msgManager.addMessageListener(Messages.PATH, pathMessageListener, this, [roomID]);
    
  // Create a room for the drawing app, then join it
  msgManager.sendUPC(UPC.CREATE_ROOM, roomID);
  msgManager.sendUPC(UPC.JOIN_ROOM, roomID);
}*/

// Triggered when the connection to Union Server is closed
/*function closeListener (e) {
  setStatus("Disconnected from UnionDraw.");
  // Stop drawing content sent by other users
  clearInterval(processDrawingCommandsIntervalID);
}*/

// Triggered when this client has joined the server-side drawing room
/*function joinedRoomListener (roomID) {
  // Periodically execute drawing commands sent by other users
  processDrawingCommandsIntervalID = setInterval(processDrawingCommands, 20);
}*/

// Triggered when this client is informed that number of users in the 
// server-side drawing room has changed
/*function roomOccupantCountUpdateListener (roomID, numOccupants) {
  numOccupants = parseInt(numOccupants);
  if (numOccupants == 1) {
    setStatus("Now drawing on your own (no one else is here at the moment)");
  } else if (numOccupants == 2) {
    setStatus("Now drawing with " + (numOccupants-1) + " other person");
  } else {
    setStatus("Now drawing with " + (numOccupants-1) + " other people");
  }
}*/

//==============================================================================
// HANDLE INCOMING CLIENT ATTRIBUTES
//==============================================================================
// Triggered when Union Server sends a "snapshot" describing the drawing room,
// including a list of users supplied as unnamed arguments after the 
// roomAttributes parameter. For a description of roomSnapshotListener()'s 
// parameters, see "u54" in the UPC specification, 
// at: http://unionplatform.com/specs/upc/. This client receives the room 
// snapshot automatically when it the joins the drawing room.
/*function roomSnapshotListener (requestID,
                               roomID,
                               occupantCount,
                               observerCount,
                               roomAttributes) {
  // The unnamed arguments following 'roomAttributes' is a list of 
  // clients in the room. Assign that list to clientList. 
  var clientList = Array.prototype.slice.call(arguments).slice(5);
  var clientID;
  var roomAttrString;
  var roomAttrs;
  var attrName;
  var attrVal;
  
  // Loop through the list of clients in the room to get each client's
  // "thickness" and "color" attributes.
  for (var i = 0; i < clientList.length; i+=5) {
    clientID = clientList[i];
    // Each client's room-scoped client attributes are passed as a 
    // pipe-delimited string. Split that string to get the attributes.
    clientAttrString = clientList[i+4];
    clientAttrs = clientAttrString == "" ? [] : clientAttrString.split("|");
    
    // Pass each client attribute to processClientAttributeUpdate(), which will
    // check for the "thickness" and "color" attributes.
    for (var j = 0; j < clientAttrs.length; j++) {
      attrName = clientAttrs[j];
      attrVal  = clientAttrs[j+1];
      processClientAttributeUpdate(clientID, attrName, attrVal);
    }
  }
}*/

// Triggered when one of the clients in the drawing room changes an attribute
// value. When an attribute value changes, check to see whether it was either 
// the "thickness" attribute or the "color" attribute.
/*function clientAttributeUpdateListener (attrScope, 
                                        clientID,
                                        userID,
                                        attrName,
                                        attrVal,
                                        attrOptions) { 
  if (attrScope == roomID) {
    processClientAttributeUpdate(clientID, attrName, attrVal);
  }
}*/

// Triggered when a clients leaves the drawing room.
/*function clientRemovedFromRoomListener (roomID, clientID) {
  // The client is gone now, so remove all information pertaining to that client
  delete userThicknesses[clientID];
  delete userColors[clientID];
  delete userCommands[clientID];
  delete userCurrentPositions[clientID];
}*/

// Checks for changes to the the "thickness" and "color" attributes.
/*function processClientAttributeUpdate (clientID, attrName, attrVal) {
  if (attrName == Attributes.THICKNESS) {
    // The "thickness" attribute changed, so push a "set thickness" command
    // onto the drawing command stack for the specified client. But first, 
    // bring the thickness into legal range if necessary (prevents thickness hacking).
    addDrawingCommand(clientID, DrawingCommands.SET_THICKNESS, getValidThickness(attrVal));
  } else if (attrName == Attributes.COLOR) {
    // The "color" attribute changed, so push a "set color" command
    // onto the drawing command stack for the specified client
    addDrawingCommand(clientID, DrawingCommands.SET_COLOR, attrVal);
  }
}*/

//==============================================================================
// HANDLE INCOMING CLIENT MESSAGES
//==============================================================================
// Triggered when a remote client sends a "MOVE" message to this client
var userCurrentPosition;

function handleMoveMessage (coordsString,peerFifoId) { 
	// Parse the specified (x, y) coordinate
	var coords = coordsString.split(",");
	var position = {x:parseInt(coords[0]), y:parseInt(coords[1])};
		  Signaling.PeerDrawingInfo[peerFifoId] = {x:position.x, y:position.y};
	// Push a "moveTo" command onto the drawing-command stack for the sender
	//addDrawingCommand(fromClientID, DrawingCommands.MOVE_TO, position);
  
}

// Triggered when a remote client sends a "PATH" message to this client
function handlePathMessage (pathString,peerFifoId) { //IMPORTANT, PASS CLIENT ID HERE SO WE KNOW WHICH COLOR TO DRAW WITH
  // Parse the specified list of points
  var path = pathString.split(",");
  console.log("inside handle path message");
  // For each point, push a "lineTo" command onto the drawing-command stack 
  // for the sender
  var position;
  for (var i = 0; i < path.length; i+=2) {
    position = {x:parseInt(path[i]), y:parseInt(path[i+1])};
	drawLine(peerFifoId,defaultLineColor, 
		defaultLineThickness, 
		Signaling.PeerDrawingInfo[peerFifoId].x, 
		Signaling.PeerDrawingInfo[peerFifoId].y,
		position.x, 
		position.y);
		
	Signaling.PeerDrawingInfo[peerFifoId].x = position.x;
	Signaling.PeerDrawingInfo[peerFifoId].y = position.y;
	//userCurrentPostion = {x : position.x,y : position.y};	
    //addDrawingCommand(fromClientID, DrawingCommands.LINE_TO, position);
  }
}

//==============================================================================
// BROADCAST DRAWING DATA TO OTHER USERS
//==============================================================================
// Sends the local user's drawing-path information to other users in the 
// drawing room.
function broadcastPath () {
  // If there aren't any points buffered (e.g., if the pen is down but not
  // moving), then don't send the PATH message.
  console.log("should broadcast path, object is :" + bufferedPath);
  if (bufferedPath.length == 0) {
    return;
  }
  // Use SEND_MESSAGE_TO_ROOMS to deliver the message to all users in the room
  // Parameters are: messageName, roomID, includeSelf, filters, ...args. For
  // details, see http://unionplatform.com/specs/upc/.
  /*msgManager.sendUPC(UPC.SEND_MESSAGE_TO_ROOMS, 
                     Messages.PATH, 
                     roomID, 
                     "false", 
                     "", 
                     bufferedPath.join(","));*/
  console.log("should send buffered path to all participants here" + bufferedPath.join());
  
	var contents;
	contents = { "command" : DrawingCommands.LINE_TO, "path" : bufferedPath.join(), "sendingPeer" : Signaling.fifoId }
	//contents = "MOVE:" + x + "," + y;
	console.log("inside broadcast PATH");

	for(i in Signaling.Peer) 
	{
		Signaling.Peer[i].send(JSON.stringify(contents));
	}
  
  // Clear the local user's outgoing path data
  bufferedPath = [];
  // If the user is no longer drawing, stop broadcasting drawing information
  if (!isPenDown) {
    clearInterval(broadcastPathIntervalID);
  }
}

// Sends all users in the drawing room an instruction to reposition the local
// user's pen.
function broadcastMove (x, y) {

  /*msgManager.sendUPC(UPC.SEND_MESSAGE_TO_ROOMS, 
                     Messages.MOVE, 
                     roomID, 
                     "false", 
                     "", 
                     x + "," + y);*/
	var contents;
	contents = { "command" : DrawingCommands.MOVE_TO, "path" : x + "," + y, "sendingPeer" : Signaling.fifoId }
	//contents = "MOVE:" + x + "," + y;
	//console.log("inside broadcast MOVE");

	for(i in Signaling.Peer) 
	{
		console.log("sending move command");
		Signaling.Peer[i].send(JSON.stringify(contents));
	}                     
}

//==============================================================================
// PROCESS DRAWING COMMANDS FROM OTHER USERS
//==============================================================================
// Pushes a drawing command onto the command stack for the specified client.
// At a regular interval, commands are pulled off the stack and executed,
// causing remote user's drawings to appear on-screen. 
function addDrawingCommand (clientID, commandName, arg) {
  // If this client does not yet have a command stack, make one. 
  if (userCommands[clientID] == undefined) {
    userCommands[clientID] = [];
  }
  // Push the command onto the stack.
  var command = {};
  command["commandName"] = commandName;
  command["arg"] = arg;
  userCommands[clientID].push(command);
}

// Executes the oldest command on all user's command stacks
/*function processDrawingCommands () {
  var command;
  // Loop over all command stacks
  for (var clientID in userCommands) {
    // Skip empty stacks
    if (userCommands[clientID].length == 0) {
      continue;
    }
    
    // Execute the user's oldest command
    command = userCommands[clientID].shift();
    switch (command.commandName) {
      case DrawingCommands.MOVE_TO:
        userCurrentPositions[clientID] = {x:command.arg.x, y:command.arg.y};
        break;
        
      case DrawingCommands.LINE_TO:
        if (userCurrentPositions[clientID] == undefined) {
          userCurrentPositions[clientID] = {x:command.arg.x, y:command.arg.y};
        } else {
          drawLine(userColors[clientID] || defaultLineColor, 
                   userThicknesses[clientID] || defaultLineThickness, 
                   userCurrentPositions[clientID].x, 
                   userCurrentPositions[clientID].y,
                   command.arg.x, 
                   command.arg.y);
           userCurrentPositions[clientID].x = command.arg.x; 
           userCurrentPositions[clientID].y = command.arg.y; 
        }
        break;
        
      case DrawingCommands.SET_THICKNESS:
        userThicknesses[clientID] = command.arg;
        break;
        
      case DrawingCommands.SET_COLOR:
        userColors[clientID] = command.arg;
        break;
    }
  }
}*/

//==============================================================================
// TOUCH-INPUT EVENT LISTENERS
//==============================================================================
// On devices that support touch input, this function is triggered when the 
// user touches the screen.
function touchDownListener (e) {
  // Note that this device supports touch so that we can prevent conflicts with
  // mouse input events.
  hasTouch = true;
  // Prevent the touch from scrolling the page, but allow interaction with the
  // control-panel menus. The "event.target.nodeName" variable provides the name
  // of the HTML element that was touched.
  if (event.target.nodeName != "SELECT") {
    e.preventDefault();
  }
  // Determine where the user touched screen.
  var touchX = e.changedTouches[0].clientX - canvas.offsetLeft;
  var touchY = e.changedTouches[0].clientY - canvas.offsetTop;
  // A second "touch start" event may occur if the user touches the screen with
  // two fingers. Ignore the second event if the pen is already down.
  if (!isPenDown) {
    // Move the drawing pen to the position that was touched
    penDown(touchX, touchY);
  }
}

// On devices that support touch input, this function is triggered when the user
// drags a finger across the screen.
function touchMoveListener (e) {
  hasTouch = true;
  e.preventDefault();
  var touchX = e.changedTouches[0].clientX - canvas.offsetLeft;
  var touchY = e.changedTouches[0].clientY - canvas.offsetTop;
  // Draw a line to the position being touched.
  penMove(touchX, touchY);
}

// On devices that support touch input, this function is triggered when the 
// user stops touching the screen.
function touchUpListener () {
  // "Lift" the drawing pen, so lines are no longer drawn
  penUp();
}

//==============================================================================
// MOUSE-INPUT EVENT LISTENERS
//==============================================================================
// Triggered when the mouse is pressed down
function pointerDownListener (e) {
  // If this is an iPhone, iPad, Android, or other touch-capable device, ignore
  // simulated mouse input.
  if (hasTouch) {
    return;
  }
  
  // Retrieve a reference to the Event object for this mousedown event.
  // Internet Explorer uses window.event; other browsers use the event parameter
  var event = e || window.event; 
  // Determine where the user clicked the mouse.
  var mouseX = event.clientX - canvas.offsetLeft;
  var mouseY = event.clientY - canvas.offsetTop;
  
  // Move the drawing pen to the position that was clicked
  penDown(mouseX, mouseY);
  
  // We want mouse input to be used for drawing only, so we need to stop the 
  // browser from/ performing default mouse actions, such as text selection. 
  // In Internet Explorer, we "prevent default actions" by returning false. In 
  // other browsers, we invoke event.preventDefault().
  if (event.preventDefault) {
    if (event.target.nodeName != "SELECT") {
      event.preventDefault();
    }
  } else {
    return false;  // IE
  }
}



// Triggered when the mouse moves
function pointerMoveListener (e) {
  if (hasTouch) {
    return;
  }
  
  var event = e || window.event; // IE uses window.event, not e
  var mouseX = event.clientX - canvas.offsetLeft;
  var mouseY = event.clientY - canvas.offsetTop;
  
  // Draw a line if the pen is down
  penMove(mouseX, mouseY);

  // Prevent default browser actions, such as text selection
  if (event.preventDefault) {
    event.preventDefault();
  } else {
    return false;  // IE
  }
}

// Triggered when the mouse button is released
function pointerUpListener (e) {
  if (hasTouch) {
    return;
  }
  // "Lift" the drawing pen
  penUp();
}

//==============================================================================
// CONTROL PANEL MENU-INPUT EVENT LISTENERS
//==============================================================================
// Triggered when an option in the "line thickness" menu is selected
function thicknessSelectListener (e) {
  // Determine which option was selected
  var newThickness = this.options[this.selectedIndex].value;
  // Locally, set the line thickness to the selected value
  localLineThickness = getValidThickness(newThickness);
  // Share the selected thickness with other users by setting the client
  // attribute named "thickness". Attributes are automatically shared with other 
  // clients in the room, triggering clientAttributeUpdateListener(). 
  // Arguments for SET_CLIENT_ATTR are:
  //   clientID 
  //   userID (None in this case)
  //   attrName 
  //   escapedAttrValue
  //   attrScope (The room) 
  //   attrOptions (An integer whose bits specify options. "4" means 
  //                the attribute should be shared).
 /* msgManager.sendUPC(UPC.SET_CLIENT_ATTR, 
                     orbiter.getClientID(),
                     "",
                     Attributes.THICKNESS,
                     newThickness,
                     roomID,
                     "4");*/
  // After the user selects a value in the drop-down menu, the iPhone
  // automatically scrolls the page, so scroll back to the top-left. 
  //iPhoneToTop();
}

// Triggered when an option in the "line color" menu is selected
function colorSelectListener (e) {
  // Determine which option was selected
  var newColor = this.options[this.selectedIndex].value;
  // Locally, set the line color to the selected value
  localLineColor = newColor;
  // Share selected color with other users
  /*msgManager.sendUPC(UPC.SET_CLIENT_ATTR, 
                     orbiter.getClientID(),
                     "",
                     Attributes.COLOR,
                     newColor,
                     roomID,
                     "4");*/

  // Scroll the iPhone back to the top-left. 
  //iPhoneToTop();
}

//==============================================================================
// PEN
//==============================================================================
// Places the pen in the specified location without drawing a line. If the pen
// subsequently moves, a line will be drawn.
function penDown (x, y) {
  isPenDown = true;
  localPen.x = x;
  localPen.y = y;
  
  // Send this user's new pen position to other users.
  broadcastMove(x, y);
  
  // Begin sending this user's drawing path to other users every 500 milliseconds.
  broadcastPathIntervalID = setInterval(broadcastPath, 500);
}

// Draws a line if the pen is down.
function penMove (x, y) { 
  if (isPenDown) {
    // Buffer the new position for broadcast to other users. Buffer a maximum
    // of 100 points per second.
    if ((new Date().getTime() - lastBufferTime) > 10) {
      bufferedPath.push(x + "," + y);
      lastBufferTime = new Date().getTime();
      //console.log("buffered path is :" +bufferedPath);
    }
    	
    // Draw the line locally.
    //console.log("drawing line locally");
    drawLine(Signaling.fifoId,localLineColor, localLineThickness, localPen.x, localPen.y, x, y);
    
    // Move the pen to the end of the line that was just drawn.
    localPen.x = x;
    localPen.y = y;
  }
}

// "Lifts" the drawing pen, so that lines are no longer draw when the mouse or
// touch-input device moves.
function penUp () {
  isPenDown = false;
}

//==============================================================================
// DRAWING
//==============================================================================
// Draws a line on the HTML5 canvas
function drawLine (fifoId, color, thickness, x1, y1, x2, y2) {
	console.log("fifo id is : " + fifoId + "the context is :" + Signaling.CanvasContext[fifoId]);
  Signaling.CanvasContext[fifoId].strokeStyle = color;
  Signaling.CanvasContext[fifoId].lineWidth   = thickness;
  
  Signaling.CanvasContext[fifoId].beginPath();
  Signaling.CanvasContext[fifoId].moveTo(x1, y1)
  Signaling.CanvasContext[fifoId].lineTo(x2, y2);
  Signaling.CanvasContext[fifoId].stroke();
}

//==============================================================================
// STATUS
//==============================================================================
// Updates the text of the on-screen HTML "status" div tag
function setStatus (message) {
  document.getElementById("status").innerHTML = message;
}

//==============================================================================
// IPHONE UTILS
//==============================================================================
// Hides the iPhone address bar by scrolling it out of view
/*function iPhoneToTop () {
  if (navigator.userAgent.indexOf("iPhone") != -1) {
    setTimeout (function () {
      window.scroll(0, 0);
    }, 100);
  }
}*/

//==============================================================================
// DATA VALIDATION
//==============================================================================
function getValidThickness (value) {
  value = parseInt(value);
  var thickness = isNaN(value) ? defaultLineThickness : value;
  return Math.max(1, Math.min(thickness, maxLineThickness));
}

