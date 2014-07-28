var stage, renderer,

    gridLayer, tileLayer,
    
    masterGameData = {"mapData" : {}}, // the object which contains things like definitions, mapdata, logic rules etc.
    masterSceneData = {"tileDetails" : {}, "artefactDetails" :{}, "creatureDetails":{}}, // the default sceneData that the serverSceneData is a copy of. it borrows a bit from masterGameData.
    serverSceneData = {}, // the current scenData specific to a game instance
    clientSceneData = {}, // the client side subset of the serverSceneData specific to a game instance and a client

    textLog;
    

/*Game steps:
1. define game logic & entities
2. define game levels info. load default level
3. define scene data
4. upload assets
5. render/populate scene data
*/

function init() {
    // create an new instance of a pixi stage
    stage = new PIXI.Stage(0x101010);

    // create a renderer instance.
    renderer = new PIXI.autoDetectRenderer(1200, 600, null, false, true);

    // add the renderer view element to the DOM
    document.getElementById('renderer_container').appendChild(renderer.view);
    
    // creating the layers
    tileLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(tileLayer);    
    
    gridLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(gridLayer);
    
    artefactLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(artefactLayer);
    
    uiLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(uiLayer);
    
    // Add text logger
    textLog = new PIXI.Text("Showing log here", {font: "12px Snippet", fill: "yellow", align: "left"});
    textLog.position.x = 10;
    textLog.position.y = 10;
    uiLayer.addChild(textLog);


    // import the game definitions
    var manifest = [
        {src:"/map.json", id:"mapJson"},
        {src:"/data/crystals.json", id:"crystalsJson"},
        {src:"/data/creatures.json", id:"creaturesJson"}
    ];
    
    fileLoadQueue = new createjs.LoadQueue();
    fileLoadQueue.setMaxConnections(5);
    fileLoadQueue.loadManifest(manifest);
    
    fileLoadQueue.on( 'error', function( err ) {
        console.log( 'error', err );
        textLog.setText('error : ' + err);
    });
    
    fileLoadQueue.on("complete", function () {
		masterGameData.mapData = fileLoadQueue.getResult("mapJson");
		masterGameData.crystalsData = fileLoadQueue.getResult("crystalsJson");
		masterGameData.creaturesData = fileLoadQueue.getResult("creaturesJson");
		
        console.log( "PreloadJS manifest uploaded" );
        textLog.setText('PreloadJS manifest uploaded');
		}
	);
    
    
    // load visual assets. may merge the jsonloader asset here
    var assetsList = [
        '/images/creatures.json',
        '/images/tiles.json',
        '/images/artefacts.json'
    ]
    var assetLoader = new PIXI.AssetLoader (assetsList)
    assetLoader.load();
    assetLoader.on( 'error', function( err ) {
        console.log( 'error', err );
    });    

    assetLoader.on('onComplete', function(event) {
        textLog.setText('All Assets uploaded');
        sleep(1000);
        populateHexGrid();
        populateArtefacts();
        populateObstacles();
        populateCreatures();

    });
    
    requestAnimFrame( animate );
};

function populateArtefacts() {
    // we want to do two things. randomly populate crystals/artefacts in all the available positions and 
    // ensuring that each crystal is represented in the map
    var avalPosList = masterGameData.mapData.artefacts.crystals.positions;
    var artefactObj = masterGameData.mapData.artefacts.crystals.types;
    
    var tempArtefactList = [];
    for (var prop in artefactObj) {
        if (artefactObj.hasOwnProperty(prop)) {
            tempArtefactList.push(prop);
        }
    }

    // to achieve this we will first populate every artefact from tempArtefactObj into the avalPosObj, making sure to trim the two arrays in each step. 
    // then all the empty places in the avalPosObj will be randomly filled by artefactObj crystals.
    while (avalPosList.length > 0) {      
        var crystalType;
        var crystalHexPos = avalPosList[ avalPosList.length * Math.random() << 0]
        
        // check if tempArtefactObj is empty.
        // If not, use a random one from tempArtefactObj. trim the list then. if yes, use a random one from artefactObj
        if (tempArtefactList.length === 0) {
            crystalType = returnRandomObjectKey(artefactObj);
        }
        else {
            crystalType = tempArtefactList[ tempArtefactList.length * Math.random() << 0]
            removeFromArray (tempArtefactList, crystalType )
        }
        
        createArtefact(crystalHexPos, crystalType);
        
        removeFromArray (avalPosList, crystalHexPos )
    };

    
    textLog.setText('All Artefacts Populated');
    console.log('All Artefacts Populated');
}

function createArtefact(hexId, artefactName) {
    var spriteCoords = getPosXnYFromGrid(hexId);
    var spriteImg = masterGameData.mapData.artefacts.crystals.types[artefactName];
    
    var sprite = new PIXI.Sprite.fromImage(spriteImg);
    // size = size-gap;
    
    sprite.x = spriteCoords[0];
    sprite.y = spriteCoords[1];
    
    // set registration point to centre of the sprite
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    
    artefactLayer.addChild(sprite);
    
    // create a concept of artefact id. add it to scenedata
    sprite.gameObjectType = "artefact";
    sprite.artefactId =  sprite.gameObjectType + "_" + artefactName + _.uniqueId('_');
    
    var tempObj = {};
    //Leaving empty for now. May choose to add other attributes later or just remove this object.
    masterSceneData.artefactDetails[sprite.artefactId] = tempObj;
    
    // set the "contains" value in scenedata hexdetails to the artefact Id.
    masterSceneData.tileDetails[hexId].contains.artefact = [sprite.artefactId]
}

function populateObstacles() {
    textLog.setText('All Obstacles Populated');
    console.log('All Obstacles Populated');
}

function createObstacle() {
    textLog.setText('Obstacle created');
    console.log('Obstacle created');
}

function populateCreatures() {
    
    var creaturesObj = masterGameData.mapData.creatures;
    
    for (var prop in creaturesObj) {
        if (!creaturesObj.hasOwnProperty(prop)) {
            continue;
        }
        
        console.log(prop);
        
    }
    
    textLog.setText('All Creatures Populated');
    console.log('All Creatures Populated');
}

function createCreature() {
    textLog.setText('Creature created');
    console.log('Creature created');
}

function populateHexGrid () {
    
    var mapData = masterGameData.mapData;
    
    // local variables for the object values. this is because we dont want to read the object over and over again in the for loop
    var tileWidth = mapData.hex.tileWidth;
    var tileHeight = mapData.hex.tileHeight;
    var tileOffsetX = mapData.hex.tileOffsetX;
    var tileOffsetY = mapData.hex.tileOffsetY;
    var mapStartX = mapData.hex.mapStartX;
    var mapStartY = mapData.hex.mapStartY;

    for (var i=0;i<mapData.grid.length;i++) {                      // iterate over total number of hex rows
        // remove the "-" character representing the offset from the map data
        mapData.grid[i] = mapData.grid[i].replace(/-/g,"");
        
        for (var j=0;j<mapData.grid[i].length;j++) {                 // iterate over each hex to be created in a single row.
            var hexY = mapStartY + (i * (tileHeight-(tileOffsetY * 1.5)));

            if (i%2 == 0) {
                var hexX = mapStartX + j * tileWidth;
            }
            else {
                var hexX = mapStartX + (j * tileWidth) + (1/2* tileWidth);
            }
            // create the hexagon geom
            var hexType = mapData.grid[i][j]
            if ( hexType !="X") {
                
                // create the sprite based hex grid
                createHexTile (hexX, hexY, i, j, mapData.tiles[hexType], hexType);
            }
        }
    }
    
    textLog.setText('Hexgrid Populated');
    console.log('Hexgrid Populated');

};


function createHexTile(x,y, iterI, iterJ, name, type) {
    
    var sprite = new PIXI.Sprite.fromImage(name);
    // size = size-gap;
    
    sprite.x = x;
    sprite.y = y;
    
    // set registration point to centre of the sprite
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    
    // calculate and save the axial coordinates
    var cX = iterJ - (iterI - (iterI&1)) / 2;
    var cZ = iterI;
    var cY = -1*(cX+cZ);
    
    sprite.gameObjectType = "hexTile";
    sprite.hexId = cX + "x" + cY + "y" + cZ + "z";

    sprite.interactive = true;
    sprite.click = function(mouseData){
        textLog.setText("MOUSE CLICK " + sprite.hexId);
        console.log("MOUSE CLICK " + sprite.hexId);
    } 

    tileLayer.addChild(sprite);
    
    // since we dont want to read through the stage or display container every time we need some info on a tile, we will save it in a new array for easier access
    var tempObj = {};
    tempObj.posX = x;
    tempObj.posY = y;
    tempObj.contains = {}; //setting occupied empty for now

    masterSceneData.tileDetails[sprite.hexId] = tempObj;

};

function animate() {
    requestAnimFrame( animate );


    // render the stage   
    renderer.render(stage);
};

function getPosXnYFromGrid (hexId) {
    var posXnY = [masterSceneData.tileDetails[hexId].posX, masterSceneData.tileDetails[hexId].posY];
    return posXnY;
}

function depthCompare(a,b) {
  if (a.z < b.z)
     return -1;
  if (a.z > b.z)
    return 1;
  return 0;
  // USAGE: myContainer.children.sort(depthCompare);
  
}

// debug functions
// ----------------------------------------------------------------------------------------------------------------------------
function sleep( sleepDuration ){
    console.log("Sleeping for", sleepDuration);
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

//toolkit functions
// ----------------------------------------------------------------------------------------------------------------------------
function removeFromArray (array, element ) {
    // I seriously have to write this? wow... how bass-ackwards is this lang?
    while (array.indexOf(element) !== -1) {
        array.splice(array.indexOf(element), 1);
    }
}

function returnRandomObjectKey (obj) {
    var keys = Object.keys(obj)
    return keys[ keys.length * Math.random() << 0];
};

function returnRandomObjectProperty (obj) {
    var keys = Object.keys(obj)
    console.log(keys);
    return obj[keys[ keys.length * Math.random() << 0]];
};