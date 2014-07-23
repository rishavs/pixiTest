var stage, renderer,

    gridLayer, tileLayer,
    
    masterGameData = {"madpData" : {}}, // the object which contains things like definitions, mapdata, logic rules etc.
    masterSceneData = {"tileProperties" : {}}, // the default sceneData that the serverSceneData is a copy of. it borrows a bit from masterGameData.
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
    
    objLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(objLayer);
    
    uiLayer = new PIXI.DisplayObjectContainer ();
    stage.addChild(uiLayer);
    
    // Add text logger
    textLog = new PIXI.Text("Showing log here", {font: "12px Snippet", fill: "yellow", align: "left"});
    textLog.position.x = 10;
    textLog.position.y = 10;
    uiLayer.addChild(textLog);
    
    // load map data
    var loader = new PIXI.JsonLoader('/map.json');
    loader.load();
    loader.on( 'error', function( err ) {
        console.log( 'error', err );
    });
    loader.on('loaded', function(event) {
        masterGameData.mapData = event.content.json;
        textLog.setText('Map data uploaded');
    });
    
    // load other assets. may merge the jsonloader asset here
    var assetsList = [
        '/images/sprites.json',
        '/images/tiles2.json'
    ]
    var assetLoader = new PIXI.AssetLoader (assetsList)
    assetLoader.load();
    assetLoader.on( 'error', function( err ) {
        console.log( 'error', err );
    });    

    assetLoader.on('onComplete', function(event) {
        textLog.setText('All Assets uploaded');
        
        populateHexGrid();
        populateArtefacts();
        populateCreatures();

    });
    
    requestAnimFrame( animate );
};

function populateArtefacts() {
    textLog.setText('All Objects Populated');
    console.log('All Objects Populated');
}
function createArtefact() {
    textLog.setText('Artefact created');
    console.log('Artefact created');
}

function populateCreatures() {
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
    
    sprite.hexId = cX + "x" + cY + "y" + cZ + "z";

    sprite.interactive = true;
    sprite.click = function(mouseData){
        textLog.setText("MOUSE CLICK " + sprite.hexId);
    } 

    tileLayer.addChild(sprite);
    
    // since we dont want to read through the stage or display container every time we need some info on a tile, we will save it in a new array for easier access
    var tempObj = {};
    tempObj.posX = x;
    tempObj.posy = y;

    masterSceneData.tileProperties[sprite.hexId] = tempObj;

};

function animate() {
    requestAnimFrame( animate );


    // render the stage   
    renderer.render(stage);
};