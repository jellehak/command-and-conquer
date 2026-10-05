import { removeFrom } from '../core/array.js';
import { canvas, context, debuggerPanel } from '../core/dom.js';
import { buildings } from './buildings.js';
import { fog } from './fog.js';
import { infantry } from './infantry.js';
import { levels } from './levels.js';
import { mouse } from './mouse.js';
import { overlay } from './overlay.js';
import { sidebar } from './sidebar.js';
import { sounds } from './sounds.js';
import { turrets } from './turrets.js';
import { vehicles } from './vehicles.js';

export const game = {
    screenWidth:canvas.width,
    screenHeight:canvas.height,
    viewportTop:35,
    viewportLeft:0,
    viewportX:0,
    viewportY:0,
    viewportDeltaX:0,
    viewportDeltaY:0,
    gridSize:24,
    animationLoop:null,
    animationTimeout:50,
    debugMode:false,
    speedAdjustmentFactor:0.2,
    setViewport:function(){
    	    context.beginPath();
    	    this.viewportWidth = (sidebar.visible)?(this.screenWidth-sidebar.width):this.screenWidth;
    	    this.viewportHeight = 480;
    	    context.rect(this.viewportLeft,this.viewportTop,this.viewportWidth-this.viewportLeft,this.viewportHeight);
    	    context.clip();
    	},
    	drawMap:function(){
  	    //context.drawImage(this.currentLevel.mapImage,0,0);
  	        mouse.handlePanning();
    	    context.drawImage(this.currentLevel.mapImage,
    			this.viewportX,this.viewportY,this.viewportWidth,this.viewportHeight, 
    			this.viewportLeft,this.viewportTop,this.viewportWidth,this.viewportHeight);
    	    
    	    
    	    // Create an obstruction grid from the level 
    	    game.obstructionGrid = []; // normal obstructions
    	    game.heroObstructionGrid = []; // Cannot see in fog, so pretend
    	    game.buildingObstructionGrid = [];  // Cannot build on fog; Cannot build on bib
    	    
    	    for (var y=0; y < this.currentLevel.obstructionGrid.length; y++) {
    	        game.obstructionGrid[y] = [];
    	        game.heroObstructionGrid[y] = [];
    	        game.buildingObstructionGrid[y] = [];
    	       for (var x=0; x < this.currentLevel.obstructionGrid[y].length; x++) {
    	           game.obstructionGrid[y][x] = this.currentLevel.obstructionGrid[y][x];
    	           game.heroObstructionGrid[y][x] = this.currentLevel.obstructionGrid[y][x];
    	           game.buildingObstructionGrid[y][x] = this.currentLevel.obstructionGrid[y][x];
           }
    	    }
            
    	    for (var i = this.buildings.length - 1; i >= 0; i--){
    	        var bldng = this.buildings[i];
    	        for (var y = 0;y<bldng.gridShape.length;y++){
    	            for(var x = 0;x<bldng.gridShape[y].length;x++){
    	                if(bldng.gridShape[y][x]==1){
    	                    game.obstructionGrid[y+bldng.y][x+bldng.x] = 1;
    	                    game.heroObstructionGrid[y+bldng.y][x+bldng.x] = 1;
    	                    game.buildingObstructionGrid[y+bldng.y][x+bldng.x] = 1;

    	                    //include an extra row for bib as a no building zone
    	                    if(y == bldng.gridShape.length-1){
    	                        game.buildingObstructionGrid[y+1+bldng.y][x+bldng.x] = 1;
    	                    }
    	                }
    	            }
    	        }

    	    };
    	    for (var i = this.turrets.length - 1; i >= 0; i--){
    	        game.obstructionGrid[this.turrets[i].y][this.turrets[i].x] = 1;
    	        game.heroObstructionGrid[y+bldng.y][x+bldng.x] = 1;
    	        game.buildingObstructionGrid[y+bldng.y][x+bldng.x] = 1;
    	    };
    	    
    	    
    	    for (var i = this.units.length - 1; i >= 0; i--){
    	            var unit = this.units[i];
    	        
    	            var x = unit.x;
        	        var y = unit.y;
        	        //var collisionRadius = unit.collisionRadius/game.gridSize;
        	        game.buildingObstructionGrid[Math.floor(y)][Math.floor(x)] = 1;
    	            //game.obstructionGrid[Math.floor(y-collisionRadius)][Math.floor(x-collisionRadius)] = 1;
    	            //game.obstructionGrid[Math.floor(y-collisionRadius)][Math.floor(x+collisionRadius)] = 1;
    	            //game.obstructionGrid[Math.floor(y+collisionRadius)][Math.floor(x-collisionRadius)] = 1;
    	            //game.obstructionGrid[Math.floor(y+collisionRadius)][Math.floor(x+collisionRadius)] = 1;
    	        
    	    };
    	    
    	    for (var i = this.overlay.length - 1; i >= 0; i--){
    	        var over= this.overlay[i];
                 if(over.name == 'tree'){
                    game.obstructionGrid[over.y][over.x] = 1;
                    game.heroObstructionGrid[over.y][over.x] = 1;
                    game.buildingObstructionGrid[over.y][over.x] = 1;
                } else if(over.name == 'trees'){
                    game.obstructionGrid[over.y][over.x] = 1;
                    game.obstructionGrid[over.y][over.x+1] = 1;
                    game.heroObstructionGrid[over.y][over.x] = 1;
                    game.heroObstructionGrid[over.y][over.x+1] = 1;
                    game.buildingObstructionGrid[over.y][over.x] = 1;
                    game.buildingObstructionGrid[over.y][over.x+1] = 1;
                }else if(over.name == 'tiberium'){
                    game.buildingObstructionGrid[over.y][over.x] = 1;
                }
    	    };
    	    
    	    
    	    // If hero cannot see under fog, he assumes he can travel there... 
    	    // when he sees the building, he goes oops!!! and then starts avoiding it....
    	    
    	    // Buildings can't be built on fog either
    	    for (var y=0; y < game.heroObstructionGrid.length; y++) {
    	       for (var x=0; x < game.heroObstructionGrid[y].length; x++) {
    	           if(fog.isOver((x+0.5)*game.gridSize,(y+0.5)*game.gridSize)){
    	               //game.heroObstructionGrid[y][x] = 0;
    	               game.buildingObstructionGrid[y][x] = 1;
    	           }
           }
    	    }
    	    
    	},
    	controlGroups:[],
    	keyPressed:function(ev){
    	    var keyCode = ev.keyCode;
    	    var ctrlPressed = ev.ctrlKey;
    	    //keys from 0 to 9 pressed
    	    if (keyCode >= 48 && keyCode <= 57) {
    	        var keyNumber = (keyCode-48)
    	        if (ctrlPressed){
    	            if (game.selectedItems.length > 0){
    	                game.controlGroups[keyNumber] = game.selectedItems.slice();
    	                //console.log(keyNumber + ' now has ' +game.controlGroups[keyNumber].length +' items');
    	            }
    	            //console.log ("Pressed Ctrl"+ (keyNumber-48));   
    	        } else {
    	            if (game.controlGroups[keyNumber]){
    	                game.clearSelection();
    	                //console.log ("Pressed"+ (keyNumber));
    	                //console.log(game.controlGroups[keyNumber].length)
    	                for (var i = game.controlGroups[keyNumber].length - 1; i >= 0; i--){
    	                    if (game.controlGroups[keyNumber][i].status=='destroy'){
    	                        game.controlGroups[keyNumber].splice(i,1);
    	                    } else {
    	                        game.selectItem(game.controlGroups[keyNumber][i]);
    	                    }
    	                    
    	                    //console.log ('selecting '+game.controlGroups[keyNumber][i].name)
    	                };
    	            }
    	            
    	        }
    	        
    	    }
    	},
    	highlightGrid: function(i,j,width,height,optionalImage){
            //alert('('+i+','+j+')');
            var gridSize = game.gridSize;
            
            if (optionalImage && optionalImage instanceof HTMLImageElement){
                context.drawImage(optionalImage,i*gridSize+game.viewportAdjustX,j*gridSize + game.viewportAdjustY,width*gridSize,height*gridSize);
            } else {
                if (optionalImage){
                    context.fillStyle = optionalImage;
                } else {
                    context.fillStyle = 'rgba(225,225,225,0.5)';
                }
                context.fillRect(i*gridSize+game.viewportAdjustX,j*gridSize + game.viewportAdjustY,width*gridSize,height*gridSize);
            }
        },
    	drawGrid: function(){
    	    var gridSize = game.gridSize;
    	    var mapWidth = game.currentLevel.mapImage.width;
    	    var mapHeight = game.currentLevel.mapImage.height;
    	    var viewportX = game.viewportX;
    	    var viewportY = game.viewportY;
    	    
    	    var gridWidth = mapWidth/gridSize;
    	    var gridHeight = mapHeight/gridSize;
    	    context.beginPath();
    	    context.strokeStyle = 'rgba(30,0,0,.6)';
    	    for (var i=0; i < gridWidth ; i++) {
    	        context.moveTo(i*gridSize-viewportX+game.viewportLeft,0-viewportY+game.viewportTop);
    	        context.lineTo(i*gridSize-viewportX+game.viewportLeft,mapHeight-viewportY+game.viewportTop);
    	    }
    	    for (var i=0; i < gridHeight; i++) {
    	        context.moveTo(0-viewportX+game.viewportLeft,i*gridSize-viewportY+game.viewportTop);
    	        context.lineTo(mapWidth-viewportX+game.viewportLeft,i*gridSize-viewportY+game.viewportTop);
    	    }
    	    context.stroke();
    	    
    	    
    	    
    	    for (var i = game.obstructionGrid.length - 1; i >= 0; i--){
    	       for (var j = game.obstructionGrid[i].length - 1; j >= 0; j--){
    	           if(game.heroObstructionGrid[i][j] == 1){
    	               game.highlightGrid(j,i,1,1,'rgba(100,0,0,0.5)');
    	           }
    	       };
    	    };
    	    
    	},
    	units:[],
    	buildings:[],
    	turrets:[],
    	overlay:[],
    	bullets:[],
    	fireBullet:function(bullet){
    	    bullet.x = bullet.x - 0.5*Math.sin(bullet.angle);
            bullet.y = bullet.y - 0.5*Math.cos(bullet.angle);
            bullet.range = bullet.range - 0.5;
            //alert(bullet.x +' '+bullet.y)
            this.bullets.push(bullet);
            setTimeout(function() {bullet.source.bulletFiring = false;},bullet.source.reloadTime);
    	},
    	drawBullets:function(){
    	    
    	    for (var j = this.bullets.length - 1; j >= 0; j--){
    	        var bullet = this.bullets[j];
    	           
    	        bullet.speed=5;
                bullet.range = bullet.range - 0.1*bullet.speed;
                bullet.x = bullet.x - 0.1*bullet.speed*Math.sin(bullet.angle);
                bullet.y = bullet.y - 0.1*bullet.speed*Math.cos(bullet.angle);
                
                
                var x = (bullet.x*game.gridSize);
    	        var y = (bullet.y*game.gridSize);
                //alert(x + ' ' + y)
                
    	        if(!bullet.dead){
    	            var overObject;
        	        for (var i = game.units.length - 1; i >= 0; i--){
            	        if(game.units[i].underPoint && game.units[i].underPoint(x,y) && game.units[i].team != bullet.source.team){
                            overObject = game.units[i];
            	            break;
            	        }
            	    };
            	    for (var i = game.buildings.length - 1; i >= 0; i--){
            	        if(game.buildings[i].underPoint(x,y)){
            	            overObject = game.buildings[i];
            	            break;
            	        }
            	    };
            	    
            	    for (var i = game.turrets.length - 1; i >= 0; i--){
            	        if(game.turrets[i].underPoint(x,y)){
            	            overObject = game.turrets[i];
            	            break;
            	        }
            	    };

                    if (overObject){
                        bullet.dead = true;
                        //alert(overObject.health);
                        overObject.health = overObject.health - Math.floor((bullet.damage?bullet.damage:10)+10*Math.random());
                        if (overObject.health <= 0){
                            overObject.status = 'destroy';
                        }
                    }

    	            context.fillStyle = 'red';
                    context.fillRect(x+game.viewportAdjustX,y+game.viewportAdjustY,2,2);
    	        }
    	        
                //alert(x +' '+y)
                if (bullet.range<=0){
                    //bullet.source.bulletFiring = false;
                    this.bullets.splice(j,1);
                }
                
    	    };
    	},
    	drawObjects:function(){
    	    var objects = [];
    	    for (var i = this.buildings.length - 1; i >= 0; i--){
    	        if(this.buildings[i].status == 'destroy'){
    	            this.buildings.splice(i,1);
    	        }
    	    };
    	    
    	    for (var i = this.units.length - 1; i >= 0; i--){
    	        if(this.units[i].status == 'destroy'){
    	            this.units.splice(i,1);
    	        }
    	    };
    	    
    	    for (var i = this.turrets.length - 1; i >= 0; i--){
    	        if(this.turrets[i].status == 'destroy'){
    	            this.turrets.splice(i,1);
    	        }
    	    };
    	    
    	    for (var i = this.selectedItems.length - 1; i >= 0; i--){
    	        if(this.selectedItems[i].status == 'destroy'){
    	            this.selectedItems.splice(i,1);
    	        }
    	    };
    	    
            for (var i = this.selectedAttackers.length - 1; i >= 0; i--){
    	        if(this.selectedAttackers[i].status == 'destroy'){
    	            this.selectedAttackers.splice(i,1);
    	        }
    	    };
    	    
    	    for (var i = this.selectedUnits.length - 1; i >= 0; i--){
    	        if(this.selectedUnits[i].status == 'destroy'){
    	            this.selectedUnits.splice(i,1);
    	        }
    	    };
    	    
    	    objects.push.apply(objects,this.units);
    	    objects.push.apply(objects,this.buildings);
    	    objects.push.apply(objects,this.overlay);
    	    objects.push.apply(objects,this.turrets);
    	    
    	    var cgY=function(obj){
    	        if (obj.type=="building"){
    	            return obj.y+obj.gridShape.length/2;
    	        } 
    	        return obj.y
    	    }
    	    objects.sort(function(a,b){
    	        return cgY(b)-cgY(a);
    	        //return b.y - a.y;
    	    });
    	    
    	    for (var i = this.overlay.length - 1; i >= 0; i--){
    	        var overlay = this.overlay[i];
    	        if(overlay.name=='tiberium'){
    	            overlay.draw();
    	        }
        };
    	    
    	    for (var i = objects.length - 1; i >= 0; i--){
    	        if (objects[i].name != 'tiberium'){
    	            objects[i].draw();
    	        }
    	       
    	    };
    	    
    	    
    	    /*for (var i = this.units.length - 1; i >= 0; i--){
    	       this.units[i].draw();
    	    };
    	    
    	    for (var i = this.buildings.length - 1; i >= 0; i--){
    	       this.buildings[i].draw();
    	    };*/
    	},
    	moveObjects:function(){
    	    for (var i = this.units.length - 1; i >= 0; i--){
    	        if(this.units[i].processOrders){
    	            this.units[i].processOrders();
    	        }
    	        this.units[i].move();
    	    };
    	    for (var i = this.turrets.length - 1; i >= 0; i--){
    	        if(this.turrets[i].processOrders){
    	            this.turrets[i].processOrders();
    	        }
    	        this.turrets[i].move();
    	    };
    	},
    	showDebugger:function(){
    	    var getKeys = function(item) {
    	        var html = '<ul>';
    	        for (var key in item){
    	            if (item.hasOwnProperty(key)) {
    	                var o = item[key];
    	                if (typeof o != "function" || o === null){
    	                    
    	                    if(typeof o == "object"){
    	                        html += "<li>"+key+" : ";
    	                        if(o instanceof HTMLImageElement){
    	                            html += (o.src).replace(/^.+images\//,'');
    	                        } else if (o instanceof Array) {
        	                        html += 'Array['+o.length+']';
        	                    } else {
    	                            html += 'Object';//getKeys(o);
    	                        }    
    	                    } else {
    	                        html += "<li>"+key+" : "+o+"</li>";
    	                    }
    	                     
    	                }
    	                
                }
    	        }
    	        html += "</ul>";
    	        return html;
    	    };
    	    var html = "";
    	    
    	    html += "Level";
    	    html += getKeys(levels);
    	    html += "Mouse";
    	    html += getKeys(mouse);
    	    if(game.selectedItems.length==1){
    	        html += "Selected Item";
    	        html += getKeys(game.selectedItems[0]);
            }
    	    html += "Game";
    	    html += getKeys(game);
    	    html += "Sidebar";
            html += getKeys(sidebar);
            html += "Vehicles";
            html += getKeys(vehicles);
            html += "Buildings";
            html += getKeys(buildings);
            
            html += "Infantry";
            html += getKeys(infantry);

    	    debuggerPanel.innerHTML = html;
    	},
    	animate: function(){
    	    // main animation loop once game has started
    	    if (game.debugMode){
    	        game.showDebugger();
    	    }
    	    
    	    if(!levels.loaded || !sidebar.loaded 
    	        || !vehicles.loaded|| !infantry.loaded || !buildings.loaded){
    	        context.clearRect(0,0,canvas.width,canvas.height);
    	        return;
    	        
    	    }
    	    
    	    context.save();
    	    // Draw the top panels
    	    // Draw sidebar if appropriate
    	    // set viewport
    	    
    	    sidebar.draw();
    	    game.setViewport();
    	    
    	    game.drawMap();
            if (game.debugMode){
                game.drawGrid();
                
            }
    	    
    	    // Draw the map
    	    //////////////
    	    // Test scripted events and handle
    	    // Draw the overlay
    	    // Draw the buildings
    	    // Any animation if necessary
    	    game.moveObjects();
    	    // Draw the units
    	    game.drawObjects();
    	    
    	    //
    	    
    	    game.drawBullets();
    	    if(!game.debugMode){
    	        fog.draw();
    	    }
    	    
    	    context.restore();
    	    
    	    
    	    game.drawMessage();
    	    // show appropriate mouse cursor
    	    mouse.draw();
    	    
    	    ///game.missionStatus();
    	    //
    	    
    	},
    	messageVisible:true,
    	messageHeadingVisible : true,
    	messageText:'\nCreate a base by deploying your MCV. Build a power plant and weapons factory.\n\nUse your tanks to get rid of all enemy presence in the area.',
    	drawMessage:function(){
    	    if(!this.messageVisible){
    	        return;
    	    }    	        
    	    context.drawImage(sidebar.messageBox,game.viewportLeft+22,game.viewportTop+150);
    	    if (!this.messageHeadingVisible){
    	        context.fillStyle = 'black';
    	        context.fillRect(265,198,120,20)
    	    }
    	    
    	    
    	    context.fillStyle = 'green';
    	    context.font = '16px "Command and Conquer"';
    	    var msgs = this.messageText.split('\n');
    	    for (var i=0; i < msgs.length; i++) {
    	        context.fillText(msgs[i],game.viewportLeft+80,game.viewportTop+200+i*18)
    	    };
    	    
    	},
    	displayMessage:function(text,displayHeader){
            this.messageText = text;
            this.messageVisible = true;
            this.messageHeadingVisible = !!displayHeader;
    	},
    	missionStatus:function(){
    	    var heroUnits=[],heroBuildings=[],heroTurrets=[],villainBuildings=[],villainUnits=[],villainTurrets=[];
    	    var item;
    	    for (var i = game.units.length - 1; i >= 0; i--){
    	       item = game.units[i];
    	       if (item.team == game.currentLevel.team){
    	           heroUnits.push(item);
    	       } else {
    	           villainUnits.push(item);
    	       }
    	    };
    	    for (var i = game.buildings.length - 1; i >= 0; i--){
    	       item = game.buildings[i];
    	       if (item.team == game.currentLevel.team){
    	           heroBuildings.push(item);
    	       } else {
    	           villainBuildings.push(item);
    	       }
    	    };
    	    for (var i = game.turrets.length - 1; i >= 0; i--){
    	       item = game.turrets[i];
    	       if (item.team == game.currentLevel.team){
    	           heroTurrets.push(item);
    	       } else {
    	           villainTurrets.push(item);
    	       }
    	    };
    	    
    	    //alert(heroBuildings.length)
    	    if(heroUnits.length ==0  && heroBuildings.length==0){
    	       //mission failed;
    	       sounds.play('mission_failure');
    	       game.end();
    	       //alert('Game over \n If you liked this, please share with your friends using the Like button and leave me a comment');
    	    }
    	    if (villainTurrets.length == 0 && villainBuildings.length==0 && villainUnits.length==0){
    	        //mission accomplished
    	        sounds.play('mission_accomplished');
    	        game.end();
    	        //alert('Game over \n If you liked this, please share with your friends using the Like button and leave me a comment');
    	    }
    	},
    	selectedItems:[],
    	selectedAttackers:[],
    	selectedUnits:[],
    	clearSelection:function(){
    	    for (var i = this.selectedItems.length - 1; i >= 0; i--){
    	       this.selectedItems[i].selected = 0;
    	       this.selectedItems.splice(i,1);
    	    };
    	    this.selectedAttackers = [];
    	    this.selectedUnits = []
    	},
    	selectItem:function(item,shiftPressed){
    	    if (shiftPressed && item.selected){
    	        // deselect item
    	        item.selected = false;
    	        removeFrom(this.selectedItems, item);
    	        removeFrom(this.selectedUnits, item);
    	        removeFrom(this.selectedAttackers, item);
    	        return;    	    
    	    }
    	    
    	    item.selected = true;
            this.selectedItems.push(item);
            //alert(1)
            if(item.type != 'building' && item.team == game.currentLevel.team){
                this.selectedUnits.push(item);
                sounds.play(item.type+'_select');
                if (item.primaryWeapon){
                    this.selectedAttackers.push(item);
                }
            }
    	},
    	click: function(ev,rightClick){
    	    
    	    if (game.messageVisible){
    	        if (mouse.x>= 290 && mouse.x<= 350 && mouse.y>=310 && mouse.y <= 325){
    	            game.messageVisible = false;
    	            return;
    	        }
    	    }
        var selectedObject = mouse.checkOverObject();
        if (rightClick){
            this.clearSelection();
            sidebar.repairMode = false;
            sidebar.deployMode = false;
            sidebar.sellMode = false;
            return;
        }	        
        if (sidebar.repairMode){
            if(selectedObject && selectedObject.team == game.currentLevel.team 
                && (selectedObject.type=='building'||selectedObject.type=='turret') && (selectedObject.health < selectedObject.hitPoints)){
                    // do repair
                    //alert('repairing')
                    selectedObject.repairing = true;
                }
        } else if (sidebar.deployMode){
                //if (buildings.canConstruct(sidebar.deployBuilding,mouse.gridX,mouse.gridY)){
                    var buildingType = buildings.types[sidebar.deployBuilding]||turrets.types[sidebar.deployBuilding];
            	    var grid = buildingType.gridShape.slice();
            	    grid.push(grid[grid.length-1]);
            	    //grid.push(grid[1]);
            	    for (var y=0; y < grid.length; y++) {
            	       for (var x=0; x < grid[y].length; x++) {
            	          
            	           if(grid[y][x] == 1){
            	               //console.log("mouse.gridX+x"+(mouse.gridX+x)+"mouse.gridY+y:"+(mouse.gridY+y))
            	               if (mouse.gridY+y<0||mouse.gridY+y>=game.buildingObstructionGrid.length||mouse.gridX+x<0||mouse.gridX+x>= game.buildingObstructionGrid[mouse.gridY+y].length|| game.buildingObstructionGrid[mouse.gridY+y][mouse.gridX+x] == 1){
            	                   sounds.play('cannot_deploy_here');
            	                   return;
            	                }
                            }
            	       }
        	        }
                    sidebar.finishDeployingBuilding();                        
                //} else {
                //    sounds.play('cannot_deploy_here');
                //}
            } else if (sidebar.sellMode){
            if(selectedObject && selectedObject.team == game.currentLevel.team 
                && (selectedObject.type=='building'||selectedObject.type=='turret')){
                    if (selectedObject.name=='refinery' && selectedObject.status=='unload'){
                        game.units.push(vehicles.add({name:'harvester',team:selectedObject.team,x:selectedObject.x+0.5,
            	                y:selectedObject.y + 2,health:selectedObject.harvester.health,moveDirection:14,orders:{type:'guard'}}));
            	                selectedObject.harvester = null;       
                    }
                    selectedObject.status = 'sell';
                    sounds.play('sell');
                    sidebar.cash += selectedObject.cost/2;
                }
        } else if (!rightClick && !mouse.dragSelect){
    	        if (selectedObject){
    	            if(game.selectedUnits.length==1 && selectedObject.selected && selectedObject.team == game.currentLevel.team){
    	                if (selectedObject.name=='mcv'){
    	                    // check building deployment
    	                    this.clearSelection();                    
    	                    selectedObject.orders = {type:'build'};
    	                    //alert('put a building here')
    	                }
    	            } else if (game.selectedUnits.length == 1 && game.selectedUnits[0].name== 'harvester' 
        	                    && game.selectedUnits[0].team == game.currentLevel.team
        	                    && (selectedObject.name == 'tiberium'||selectedObject.name=='refinery') && !mouse.isOverFog) {
        	            //My team's harvester is selected alone
        	                if (selectedObject.name == 'tiberium') {
        	                    game.selectedUnits[0].orders = {type:'harvest',to:{x:selectedObject.x,y:selectedObject.y}};
        	                    sounds.play('vehicle_move');
        	                }
        	                if (selectedObject.name == 'refinery' && selectedObject.team == game.currentLevel.team){
        	                    game.selectedUnits[0].orders = {type:'harvest-return',to:selectedObject};
        	                    sounds.play('vehicle_move');
        	                }
        	        } else if(selectedObject.team == game.currentLevel.team){
    	                if(!ev.shiftKey){
    	                    this.clearSelection();
    	                }
                        this.selectItem(selectedObject,ev.shiftKey);
                    } else if(game.selectedAttackers.length>0 && selectedObject.name != 'tiberium' && !mouse.isOverFog){
                        for (var i = game.selectedAttackers.length - 1; i >= 0; i--){
                            if (game.selectedAttackers[i].primaryWeapon){
                                game.selectedAttackers[i].orders = {type:'attack',target:selectedObject}; 
                    	        sounds.play(game.selectedAttackers[i].type+'_move');
                            }
            	           
            	        };  
                    } else if (selectedObject.name == 'tiberium') {
                        if(game.selectedUnits.length>0){
            	            if(game.obstructionGrid[mouse.gridY] && game.obstructionGrid[mouse.gridY][mouse.gridX] == 1 && !mouse.isOverFog){
                                // Don't do anything
            	            } else {
            	                for (var i = game.selectedUnits.length - 1; i >= 0; i--){
                    	           game.selectedUnits[i].orders = {type:'move',to:{x:mouse.gridX,y:mouse.gridY}}; 
                    	           sounds.play(game.selectedUnits[i].type+'_move');
                    	        };
            	            }
                	    }
                    } else {
                        if(!ev.shiftKey){
    	                    this.clearSelection();
    	                }
                        this.selectItem(selectedObject,ev.shiftKey);   
                    }
    	        } else { // no object under mouse
        	        if(game.selectedUnits.length>0){
        	            if(game.obstructionGrid[mouse.gridY] && game.obstructionGrid[mouse.gridY][mouse.gridX] == 1 && !mouse.isOverFog){
                            // Don't do anything
        	            } else {
        	                for (var i = game.selectedUnits.length - 1; i >= 0; i--){
                	           game.selectedUnits[i].orders = {type:'move',to:{x:mouse.gridX,y:mouse.gridY}}; 
                	           sounds.play(game.selectedUnits[i].type+'_move');
                	        };
        	            }
            	    }
    	        }
    	    }
    },
    	start: function(){
    	    // Show main menu screen
    	    // Wait for level click
    	    //canvas.style.cursor = 'url(cursors/blank.png), none';
    	    // load all sounds
    	    // load level
    	    mouse.loadAllCursors();
    	    sounds.loadAll();
    	    overlay.loadAll();
    	    
    	    this.currentLevel = levels.load('gdi1');
    	    this.overlay = this.currentLevel.overlay;
    	    //this.team = this.currentLevel.team;
    	    sidebar.load();
    	    
    	    mouse.listenEvents();
            fog.init();
            
            game.viewportX = 96;
            game.viewportY = 264;
            sidebar.visible = false;
            // Enemy Stuff
            this.turrets.push(turrets.add({name:'gun-turret',x:8,y:6,turretDirection:16,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:9,y:3,turretDirection:16,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:7,y:5,turretDirection:16,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:8,y:2,turretDirection:16,team:'nod'}));
            
            this.turrets.push(turrets.add({name:'gun-turret',x:16,y:25,turretDirection:24,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:13,y:26,turretDirection:24,team:'nod'}));
            
            this.turrets.push(turrets.add({name:'gun-turret',x:11,y:23,turretDirection:18,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:10,y:24,turretDirection:20,team:'nod'}));
            this.turrets.push(turrets.add({name:'gun-turret',x:9,y:25,turretDirection:24,team:'nod'}));
            //this.turrets.push(turrets.add({name:'gun-turret',x:9,y:26,turretDirection:26,team:'nod'}));
            
            this.buildings.push(buildings.add({name:'refinery',team:'nod',x:26,y:8,status:'build',health:200}));
            //this.units.push(vehicles.add({name:'harvester',team:'nod',x:24,y:18,moveDirection:0}));
            
            
            //this.units.push(vehicles.add({name:'harvester',x:25,y:18,moveDirection:0}));
            
            this.buildings.push(buildings.add({name:'construction-yard',x:1,y:14,team:'nod'}));
            this.buildings.push(buildings.add({name:'power-plant',x:5,y:14,team:'nod'}));
            
            this.buildings.push(buildings.add({name:'hand-of-nod',x:5,y:19,team:'nod'}));
            
            //this.buildings.push(buildings.add({name:'barracks',x:4,y:14,team:'nod'}));             
            //this.buildings.push(buildings.add({name:'power-plant',x:18,y:10,health:200,team:'nod'})); 
    	    this.units.push(vehicles.add({name:'light-tank',x:7,y:6,team:'nod',orders:{type:'patrol',from:{x:9,y:24},to:{x:12,y:8}}}));      	    
    	    this.units.push(vehicles.add({name:'light-tank',x:2,y:20,team:'nod',orders:{type:'patrol',from:{x:2,y:5},to:{x:6,y:20}}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:5,y:10,team:'nod',orders:{type:'patrol',from:{x:17,y:12},to:{x:22,y:2}}}));
    	    
    	    //this.units.push(vehicles.add({name:'light-tank',x:2,y:2,team:'nod',orders:{type:'patrol',from:{x:25,y:5},to:{x:17,y:25}}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:4,y:23,team:'nod',orders:{type:'patrol',from:{x:4,y:23},to:{x:22,y:25}}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:2,y:10,team:'nod',orders:{type:'protect',target:game.units[0]}}));

    	    this.units.push(vehicles.add({name:'mcv',x:23.5,y:23.5,moveDirection:0,orders:{type:'move',to:{x:23,y:21}}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:23,y:27,moveDirection:0,orders:{type:'move',to:{x:22,y:23}}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:24,y:27,moveDirection:0,orders:{type:'move',to:{x:24,y:23}}}));
    	    
    	    
    	    //this.buildings.push(buildings.add({name:'weapons-factory',x:18,y:6}));
    	    
    	    
    	    //this.buildings.push(buildings.add({name:'weapons-factory',x:24,y:18}));

    	    
    	    //this.units.push(vehicles.add({name:'mcv',x:7,y:4,moveDirection:8}));
    	    //this.units.push(infantry.add({name:'minigunner',x:27,y:12,team:'nod'}));
    	    //this.units.push(infantry.add({name:'minigunner',x:6,y:22,team:'nod'}));
    	    //this.units.push(infantry.add({name:'minigunner',x:5,y:22,team:'nod'}));
    	    //this.units.push(infantry.add({name:'minigunner',x:28,y:12,team:'nod'}));
    	    
    	    
    	    
    	    //this.units.push(vehicles.add({name:'light-tank',x:23,y:25,moveDirection:0}));
    	    
    	    //sounds.play('reinforcements_have_arrived');
    	    //this.units.push(infantry.add({name:'minigunner',x:8,y:13}));
    	    //this.units.push(vehicles.add({name:'light-tank',x:5,y:13,orders:{type:'patrol',from:{x:5,y:13},to:{x:4,y:4}},team:'nod'})); 
        	//this.units.push(vehicles.add({name:'light-tank',x:16,y:8,orders:{type:'protect',target:game.units[3]}}));
    	    
    	    /*
    	    this.units.push(infantry.add({name:'minigunner',x:7,y:13,team:'nod'}));
    	    this.units.push(vehicles.add({name:'light-tank',x:5,y:13,orders:{type:'patrol',from:{x:5,y:13},to:{x:4,y:4}},team:'nod'})); 
    	    this.units.push(vehicles.add({name:'light-tank',x:16,y:8,orders:{type:'protect',target:game.units[3]}}));
    	    this.units.push(vehicles.add({name:'light-tank',x:10,y:10,orders:{type:'protect',target:game.units[0]},team:'nod'}));
    	    
    	    this.units.push(turrets.add({name:'gun-turret',x:12,y:13,moveDirection:9,team:'nod'}));
    	    
    	    */
    	    //this.buildings.push(buildings.add({name:'power-plant',x:12,y:8,health:100,primaryBuilding:true})); 
    	    //this.buildings.push(buildings.add({name:'construction-yard',x:9,y:4,primaryBuilding:true})); 
    	    //this.buildings.push(buildings.add({name:'barracks',x:12,y:4,status:'build'}));
    	    //this.buildings.push(buildings.add({name:'weapons-factory',x:15,y:12})); 
    	    /*this.buildings.push(buildings.add({name:'construction-yard',x:3,y:9,status:'build',team:'nod'}));  
    	    
    	    
    	    this.buildings.push(buildings.add({name:'barracks',x:12,y:4}));
    	    this.buildings.push(buildings.add({name:'barracks',x:14,y:4,team:'nod'})); 
    	    
    	    this.buildings.push(buildings.add({name:'power-plant',x:12,y:8,status:'build',health:100,primaryBuilding:true})); 
    	    
    	    this.buildings.push(buildings.add({name:'power-plant',x:18,y:10,status:'build',health:200,team:'nod'})); 
    	    
    	    this.buildings.push(buildings.add({name:'weapons-factory',x:15,y:12,status:'construct',health:200})); 
    	    
    	    
    	    this.buildings.push(buildings.add({name:'weapons-factory',x:13,y:16,status:'build',health:200,team:'nod'}));
    	    
            */
    	    this.animationLoop = setInterval(function(){ game.animate(); },this.animationTimeout);
    	    
    	    this.tiberiumLoop = setInterval(function(){
    	        for (var i=0; i < game.overlay.length; i++) {
                    var overlay = game.overlay[i];
                    if (overlay.name == 'tiberium' & overlay.stage<11){
                        overlay.stage++;             
                    }
                };
    	        
    	        
    	    },game.animationTimeout*40*600);
    	    
    	    this.statusLoop = setInterval(function(){ game.missionStatus(); },3000);
 	    
    	},
    	end:function(){
    	    //clearInterval(this.animationLoop);
    	    clearInterval(this.statusLoop);
    	    clearInterval(this.tiberiumLoop);
    	    sidebar.visible = false;
    	    game.displayMessage('Thank you for trying this demo.'
        	    +'This is still a work in progress. \nAny comments, feedback (including bugs), and advice is appreciated.\n\nIf you liked this demo, please share this page with all your friends. ');
       	    
    	}
    
};

