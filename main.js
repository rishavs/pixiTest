var stage, renderer,
    mapData,
    gridLayer;


/*Game steps:
1. define game logic & entities
2. define game levels info. load default level
3. define scene data
4. upload assets
5. render/populate scene data
*/

function init() {
    // create an new instance of a pixi stage
    stage = new PIXI.Stage(0xf0f0f0, true);

    // create a renderer instance.
    renderer = new PIXI.autoDetectRenderer(1200, 600, null, false, true);

    // add the renderer view element to the DOM
    document.getElementById('renderer_container').appendChild(renderer.view);
    
    // creating the layers
    tileLayer = new PIXI.DisplayObjectContainer ();
    tileLayer.interactive = true;
    stage.addChild(gridLayer);    
    
    gridLayer = new PIXI.DisplayObjectContainer ();
    gridLayer.interactive = true;
    stage.addChild(gridLayer);
    
    var loader = new PIXI.JsonLoader('/map.json');
    loader.load();
    loader.on( 'error', function( err ) {
        console.log( 'error', err );
    });
    loader.on('loaded', function(event) {
        mapData = event.content.json;
        
        createHexGrid();
    });

    requestAnimFrame( animate );
};



function createHexGrid () {

	// calculate hex width and height. We will use these values to offset neighbouring hexes
	var mapHexWidth = Math.sqrt(3)/2 * 2 * mapData.hex.hexSize;
	var mapHexHeight = 3/4 * 2 * mapData.hex.hexSize;
	
	for (var i=0;i<mapData.grid.length;i++) {                      // iterate over total number of hex rows
		// remove the "-" character representing the offset from the map data
		mapData.grid[i] = mapData.grid[i].replace(/-/g,"");
		
		for (var j=0;j<mapData.grid[i].length;j++) {                 // iterate over each hex to be created in a single row.
			var hexY = mapData.hex.mapStartY + i * mapHexHeight;

			if (i%2 == 0) {
				var hexX = mapData.hex.mapStartX + j * mapHexWidth;
			}
			else {
				var hexX = mapData.hex.mapStartX + j * mapHexWidth + 1/2* mapHexWidth;
			}
            // create the hexagon geom
            var hexType = mapData.grid[i][j]
            if ( hexType !="X") {
                drawHexagon (hexX, hexY, mapData.hex.hexSize,mapData.hex.hexGap, mapData.hex.hexScale, mapData.type[hexType], i, j, hexType);
            }
		}       
	}

}

function drawHexagon(x,y, size, gap,scale, color, iterI, iterJ, type) {
    var shape = new PIXI.Graphics();
	// set a fill and line style
	shape.beginFill(color);
	shape.lineStyle(1, 0xa0a0a0, 1);
    size = size-gap;
    
    var vertices = [];
    for (i = 0; i < 7; i++) {
        angle = 2 * Math.PI / 6 * (i + 0.5);
        var x_i = x + size * Math.cos(angle);
        var y_i = scale * (y + size * Math.sin(angle));
        vertices.push(new PIXI.Point(x_i, y_i));
        
        if (i === 0) { 
            shape.moveTo(x_i, y_i) 
            }
        else {
            shape.lineTo(x_i, y_i)
            }
    };

	shape.endFill();
    
    // calculate and save the axial coordinates
	var cX = iterJ - (iterI - (iterI&1)) / 2;
    var cZ = iterI;
    var cY = -1*(cX+cZ);
    
	shape.hexId = cX + "x" + cY + "y" + cZ + "z";
    shape.hexPosX = x;
    shape.hexPosY = y;
    
    shape.hitArea = new PIXI.Polygon(vertices);
    shape.interactive = true;

    shape.click = function(mouseData){
       console.log("MOUSE CLICK " + shape.hexId);
    }
    shape.mouseover = function(mouseData){
       console.log("MOUSE OVER " + shape.hexId);
    }
    shape.mousedown = function(mouseData) {
        console.log("MOUSE DOWN " + shape.hexId);
    }    
    shape.mouseout = function(mouseData) {
        console.log("MOUSE OUT " + shape.hexId);
    }    
    shape.mouseup = function(mouseData) {
        console.log("MOUSE UP " + shape.hexId);
    }    
    shape.mouseupoutside = function(mouseData) {
        console.log("MOUSE UP OUTSIDE " + shape.hexId);
    }    

    gridLayer.addChild(shape);
}

function animate() {
    requestAnimFrame( animate );


    
    
    // render the stage   
    renderer.render(stage);
};