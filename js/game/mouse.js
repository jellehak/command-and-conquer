import { canvas, context } from '../core/dom.js';
import { preloadImage } from '../core/images.js';
import { buildings } from './buildings.js';
import { fog } from './fog.js';
import { game } from './game.js';
import { infantry } from './infantry.js';
import { overlay } from './overlay.js';
import { sidebar } from './sidebar.js';
import { turrets } from './turrets.js';
import { vehicles } from './vehicles.js';

export const mouse = {
    x:0,
    y:0,
    gridX:0,
    gridY:0,
    gameX:0,
    gameY:0,
    insideCanvas:false,
    panDirection:"",
    panningThreshold:48,
        panningVelocity:24,
    handlePanning: function(){
            var panDirection = "";
            if(mouse.insideCanvas){
                if(mouse.y <= game.viewportTop+mouse.panningThreshold &&  mouse.y >= game.viewportTop) {
        			game.viewportDeltaY = -mouse.panningVelocity;
        			panDirection += "_top";
        		} else if (mouse.y >= game.viewportTop+game.viewportHeight-mouse.panningThreshold && mouse.y <= game.viewportTop+game.viewportHeight){
        			game.viewportDeltaY = mouse.panningVelocity;
        			panDirection += "_bottom";
        		} else {
        			game.viewportDeltaY = 0;
        			panDirection += "";
        		}   

                if(mouse.x < mouse.panningThreshold && mouse.y >= game.viewportTop && mouse.y <= game.viewportTop+game.viewportHeight) {
        			game.viewportDeltaX = -mouse.panningVelocity;
        			panDirection += "_left";
        		} else if (mouse.x > game.screenWidth-mouse.panningThreshold && mouse.y >= game.viewportTop && mouse.y <= game.viewportTop+game.viewportHeight){
        			game.viewportDeltaX = mouse.panningVelocity;
        			panDirection += "_right";
        		} else {
        			game.viewportDeltaX = 0;
        			panDirection += "";
    		    }
	    }

    		if ((game.viewportX+game.viewportDeltaX < 0)
    		    || (game.viewportX+game.viewportDeltaX +game.screenWidth+(sidebar.visible?-sidebar.width:0)> game.currentLevel.mapImage.width)){
    			game.viewportDeltaX = 0;
    			//console.log (game.viewportX+game.viewportDeltaX +game.screenWidth+(sidebar.visible?-sidebar.width:0));
    			//console.log (game.currentLevel.mapImage.width);
    		} 
    		
    		if (!sidebar.visible && (game.viewportX+game.screenWidth>game.currentLevel.mapImage.width)){
    		    game.viewportX=game.currentLevel.mapImage.width-game.screenWidth;
    		    game.viewportDeltaX = 0;
    		}

    		if ((game.viewportY + game.viewportDeltaY< 0)
    		    || (game.viewportY+game.viewportDeltaY +game.viewportHeight> game.currentLevel.mapImage.height)){
    			game.viewportDeltaY = 0;
    		} 		 	

    		if (panDirection != ""){
    		    if(game.viewportDeltaX == 0 && game.viewportDeltaY == 0){
    		        panDirection = "no_pan"+panDirection; 
    		    } else {
    		        panDirection = "pan"+panDirection;
    		    }
    		}	
    		mouse.panDirection = panDirection;    
    		game.viewportX += game.viewportDeltaX;
    	    game.viewportY += game.viewportDeltaY;
		mouse.gameX = mouse.x + game.viewportX-game.viewportLeft;
		mouse.gameY = mouse.y + game.viewportY-game.viewportTop;
		
		game.viewportAdjustX = game.viewportLeft - game.viewportX;
		game.viewportAdjustY = game.viewportTop - game.viewportY;
		
        },
    cursorLoop:0,
    drawCursor:function(){
        if (!this.insideCanvas){
            return;
        }
        this.cursorLoop ++;
        if(this.cursorLoop >= this.cursor.cursorSpeed * this.cursor.count){
                this.cursorLoop = 0;
            }
            //alert(mouse.spriteImage)
            // If drag selecting, draw a white selection rectangle
    	    if(this.dragSelect){    
    	        var x = Math.min(this.gameX,this.dragX);
    	        var y = Math.min(this.gameY,this.dragY);
    	        var width = Math.abs(this.gameX-this.dragX)
    	        var height = Math.abs(this.gameY-this.dragY)
    	        context.strokeStyle = 'white';
		    context.strokeRect(x+game.viewportAdjustX,y+game.viewportAdjustY, width, height);
    	    }
    	    
            //var image = this.cursor.images[Math.floor(this.cursorLoop/this.cursor.cursorSpeed)];
            var imageNumber = this.cursor.spriteOffset+Math.floor(this.cursorLoop/this.cursor.cursorSpeed);
            context.drawImage(this.spriteImage,30*(imageNumber),0,30,24,this.x-this.cursor.x,this.y-this.cursor.y,30,24);
    },
    checkOverObject:function(){
        this.overObject = null;
            for (var i = game.overlay.length - 1; i >= 0; i--){
    	        var overlay = game.overlay[i];
    	        
    	        if (overlay.name == 'tiberium' && this.gridX==overlay.x && this.gridY == overlay.y){
    	            //
    	            //console.log(overlay.name + ' ' +overlay.x + ' ' +overlay.y + ' '+this.gridX + ' '+this.gridY )
    	            this.overObject = overlay;
    	            //alert('overlay')
    	        }
    	    };
    	    for (var i = game.buildings.length - 1; i >= 0; i--){
    	        if(game.buildings[i].underPoint(this.gameX,this.gameY)){
    	            this.overObject = game.buildings[i];
    	            break;
    	        }
    	    };
    	    
    	    for (var i = game.turrets.length - 1; i >= 0; i--){
    	        if(game.turrets[i].underPoint(this.gameX,this.gameY)){
    	            this.overObject = game.turrets[i];
    	            break;
    	        }
    	    };
    	    
    	    for (var i = game.units.length - 1; i >= 0; i--){
    	        if(game.units[i].underPoint && game.units[i].underPoint(this.gameX,this.gameY)){
    	            this.overObject = game.units[i];
    	            break;
    	        }
    	    };
    	    
    	    
    	    return this.overObject;
    },
    draw:function(){
        this.cursor = this.cursors['default'];
        var selectedObject = this.checkOverObject();
        
        if(this.y < game.viewportTop || this.y>game.viewportTop + game.viewportHeight){
            // default cursor if too much to the top
        } else if (sidebar.deployMode){
        	    var buildingType = buildings.types[sidebar.deployBuilding]||turrets.types[sidebar.deployBuilding];
        	    var grid = buildingType.gridShape.slice();
        	    grid.push(grid[grid.length-1]);
        	    //grid.push(grid[1]);
        	    for (var y=0; y < grid.length; y++) {
        	       for (var x=0; x < grid[y].length; x++) {
        	           if(grid[y][x] == 1){
        	               if (mouse.gridY+y<0||mouse.gridY+y>=game.buildingObstructionGrid.length||mouse.gridX+x<0||mouse.gridX+x>= game.buildingObstructionGrid[mouse.gridY+y].length|| game.buildingObstructionGrid[mouse.gridY+y][mouse.gridX+x] == 1){
        	               //if (game.buildingObstructionGrid[mouse.gridY+y][mouse.gridX+x] == 1){
        	                   game.highlightGrid(mouse.gridX+x,mouse.gridY+y,1,1,sidebar.placementRedImage);
        	                } else {
        	                    game.highlightGrid(mouse.gridX+x,mouse.gridY+y,1,1,sidebar.placementWhiteImage);
        	                }
                        }
        	       }
        	    }
        	} else if (sidebar.repairMode){
            if(selectedObject && selectedObject.team == game.currentLevel.team 
                && (selectedObject.type=='building'||selectedObject.type=='turret') && (selectedObject.health < selectedObject.hitPoints)){
                    this.cursor = this.cursors['repair'];
                } else {
                    this.cursor = this.cursors['no_repair'];
                }
        } else if (sidebar.sellMode){
            if(selectedObject && selectedObject.team == game.currentLevel.team 
                && (selectedObject.type=='building'||selectedObject.type=='turret')){
                    this.cursor = this.cursors['sell'];
                } else {
                    this.cursor = this.cursors['no_sell'];
                }
        } else if (sidebar.visible && mouse.x>sidebar.left){
            //over a button
            var hovButton = sidebar.hoveredButton();
                if (hovButton){
                    var tooltipName = hovButton.type;
                    switch(hovButton.type){
                        case 'infantry': tooltipName = infantry.types[hovButton.name].label;break;
                        case 'building': tooltipName = buildings.types[hovButton.name].label;break;
                        case 'turret': tooltipName = turrets.types[hovButton.name].label;break;
                        case 'vehicle': tooltipName = vehicles.types[hovButton.name].label;break;
                        
                    }
                    var tooltipCost = "$"+hovButton.cost;
                    //context.fillRect()
                    
                    context.fillStyle = 'black';
                    context.fillRect(Math.round(this.x),Math.round(this.y+16),tooltipName.length*5.5+8,32);
                    context.strokeStyle = 'darkgreen';
                    context.strokeRect(Math.round(this.x),Math.round(this.y+16),tooltipName.length*5.5+8,32);
                    context.fillStyle = 'darkgreen';
                    
            	    context.font = '12px "Command and Conquer"';
                    context.fillText(tooltipName,Math.round(this.x+4),Math.round(this.y+30));
                    context.fillText(tooltipCost,Math.round(this.x+4),Math.round(this.y+44));
                }	            
        } else if(this.dragSelect){
            this.cursor = this.cursors['default'];
        } else if(selectedObject && !this.isOverFog){
            if(selectedObject.team && selectedObject.team != game.currentLevel.team  && game.selectedAttackers.length>0){
                this.cursor = this.cursors['attack'];
            } else if (game.selectedUnits.length == 1 && game.selectedUnits[0].name== 'harvester' 
                    && game.selectedUnits[0].team == game.currentLevel.team
                    && (selectedObject.name == 'tiberium'||selectedObject.name=='refinery')) {
            //My team's harvester is selected alone
                if (selectedObject.name == 'tiberium') {
                    this.cursor = this.cursors['attack']; // Harvester attacks tiberium 
                }
                if (selectedObject.name == 'refinery' && selectedObject.team == game.currentLevel.team){
                    this.cursor = this.cursors['load_vehicle']; // Harvester enters my refinery
                }
            } else if(game.selectedUnits.length==1 && selectedObject.selected && selectedObject.team == game.currentLevel.team){
                if(selectedObject.name=='mcv'){
                    this.cursor = this.cursors['build_command'];
                } 
            } else if(!selectedObject.selected && selectedObject.name != 'tiberium'){
                this.cursor = this.cursors['select'];
            } else if(selectedObject.name == 'tiberium'){
                if(game.obstructionGrid[mouse.gridY] && game.obstructionGrid[mouse.gridY][mouse.gridX] == 1){
    	                this.cursor = this.cursors['no_move'];
    	            } else {
    	               this.cursor = this.cursors['move'];
    	            }
                
            }
        } else if (this.panDirection && this.panDirection != ""){
        	    this.cursor = this.cursors[this.panDirection];
        	}
            else if(game.selectedUnits.length>0){           
            if(game.obstructionGrid[mouse.gridY] && game.obstructionGrid[mouse.gridY][mouse.gridX] == 1 && !this.isOverFog) {
                this.cursor = this.cursors['no_move'];
            } else {
               this.cursor = this.cursors['move'];
            }
            
        } 

    	    

    	    if(this.insideCanvas){
    	        this.drawCursor();
    	    }
    	    
        
    },
    click: function(ev,rightClick){
        if(mouse.y <= game.viewportTop && mouse.y > game.viewportTop - 15){
                // Tab Area Clicked    
                if (mouse.x>=0 && mouse.x< 160){
                    // Options button clicked
                    //alert ('No Options yet.');
                } else if (mouse.x>=320 && mouse.x< 480){
                // Score button clicked
                //alert ('Score button clicked');
                } else    if (mouse.x>=480 && mouse.x< 640){
                    // Sidebar button clicked
                    //alert ('Sidebar button clicked');
                    sidebar.visible = !sidebar.visible;
                } 
            } else if(mouse.y >= game.viewportTop && mouse.y <= game.viewportTop+game.viewportHeight){
                //Game Area Clicked
                if (sidebar.visible && mouse.x>sidebar.left){
                    //alert ('sidebar clicked');
                    sidebar.click(ev,rightClick);
                } else {
                    game.click(ev,rightClick);
                    //alert('game area clicked');
                }
                
        }    
    },
    listenEvents: function(){
        canvas.addEventListener('mousemove',function(ev) {
            var rect = canvas.getBoundingClientRect();
    			mouse.x = ev.clientX - rect.left;
    			mouse.y = ev.clientY - rect.top;


    			mouse.gridX = Math.floor((mouse.gameX) / game.gridSize);
    			mouse.gridY = Math.floor((mouse.gameY) / game.gridSize);
                mouse.isOverFog = fog.isOver(mouse.gameX,mouse.gameY);
    			//mouse.panDirection = mouse.handlePanning();
    			//mouse.showAppropriateCursor();
    			if (mouse.buttonPressed){
		    if (Math.abs(mouse.dragX -mouse.gameX) > 5 ||
    			        Math.abs(mouse.dragY - mouse.gameY) > 5){
    			            mouse.dragSelect = true
    			        }
    			} else {
    			    mouse.dragSelect = false;
    			}         
        });
        
        canvas.addEventListener('click',function(ev) {
            //Handle click hotspots
            mouse.click(ev,false);
            mouse.dragSelect = false;
            ev.preventDefault();
        });
        
        canvas.addEventListener('mousedown',function(ev) {
            if(ev.button === 0){
                mouse.buttonPressed = true;
                mouse.dragX = mouse.gameX;
                mouse.dragY = mouse.gameY;
    	            ev.preventDefault();
            }
            ev.preventDefault();
        });
        
        canvas.addEventListener('contextmenu',function(ev){
            ev.preventDefault();
            mouse.click(ev,true);
        });
        
        canvas.addEventListener('mouseup',function(ev) {
            if(ev.button === 0){
                if (mouse.dragSelect){
                    if (!ev.shiftKey){
    			            game.clearSelection();
    			        }
    			        var x1 = Math.min(mouse.gameX,mouse.dragX);
                	    var y1 = Math.min(mouse.gameY,mouse.dragY);
                	    var x2 = Math.max(mouse.gameX,mouse.dragX);
                	    var y2 = Math.max(mouse.gameY,mouse.dragY);
                        for (var i = game.units.length - 1; i >= 0; i--){
                            var unit = game.units[i];
                            if(!unit.selected && unit.team==game.currentLevel.team && x1<= unit.x*game.gridSize && x2 >= unit.x*game.gridSize
                                && y1<= unit.y*game.gridSize && y2 >= unit.y*game.gridSize){
                                    game.selectItem(unit,ev.shiftKey);
                                }
                        };
    			        //mouse.dragSelect = false;
                }
                mouse.buttonPressed = false;
            }
            ev.preventDefault();
        });
        
        canvas.addEventListener('mouseleave',function(ev) {
            mouse.insideCanvas = false;
        });
        
        canvas.addEventListener('mouseenter',function(ev) {
            mouse.buttonPressed = false;
            mouse.insideCanvas = true;
        });        
        
        
        document.addEventListener('keydown',function(ev) {
            game.keyPressed(ev);
        });
        
    },
    loaded:false,
    preloadCount:0,
    loadedCount:0,
    preloadImage:preloadImage,
    spriteImage:null,
    cursors:[],
    	cursorCount:0,
    loadCursor:function(name,x,y,imageCount,cursorSpeed){
        if(!x && !y){
            x = 0;
            y = 0;
        }
        if(!cursorSpeed){
            cursorSpeed = 1;
        }
        if(!imageCount){
            imageCount = 1;
        }
        this.cursors[name] = {x:x,y:y,name:name,count:imageCount,spriteOffset:this.cursorCount,cursorSpeed:cursorSpeed};
        this.cursorCount += imageCount;
        
    },
    loadAllCursors:function(){
        mouse.spriteImage = this.preloadImage('cursors.png');
        mouse.loadCursor('attack',15,12,8);
        mouse.loadCursor('big_detonate',15,12,3);
            mouse.loadCursor('build_command',15,12,9);
            mouse.loadCursor('default');
            mouse.loadCursor('detonate',15,12,3);
            mouse.loadCursor('load_vehicle',15,12,3,2);
            
            mouse.loadCursor('unknown');
            mouse.loadCursor('unknown');
            mouse.loadCursor('move',15,12);
            mouse.loadCursor('no_default');
            mouse.loadCursor('no_move',15,12);
            
            mouse.loadCursor('no_pan_bottom', 15,24); 
            mouse.loadCursor('no_pan_bottom_left',0,24);
            mouse.loadCursor('no_pan_bottom_right',30,24); 
            mouse.loadCursor('no_pan_left',0,12); 
            mouse.loadCursor('no_pan_right', 30,12);
            mouse.loadCursor('no_pan_top', 15,0);
            mouse.loadCursor('no_pan_top_left',0,0);
            mouse.loadCursor('no_pan_top_right', 30,0);
            
            mouse.loadCursor('no_repair',15,0);
            mouse.loadCursor('no_sell',15,12);
            
            mouse.loadCursor('pan_bottom', 15,24); 
            mouse.loadCursor('pan_bottom_left',0,24);
            mouse.loadCursor('pan_bottom_right',30,24); 
            mouse.loadCursor('pan_left',0,12); 
            mouse.loadCursor('pan_right', 30,12);
            mouse.loadCursor('pan_top', 15,0);
            mouse.loadCursor('pan_top_left',0,0);
            mouse.loadCursor('pan_top_right', 30,0);
            mouse.loadCursor('repair',15,0,24);
            mouse.loadCursor('select',15,12,6,2); 
            mouse.loadCursor('sell',15,12,24);
    }
}; 

