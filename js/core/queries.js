import AStar from '../core/astar.js';
import { context } from './dom.js';
import { shortenPath } from './geometry.js';
import { fog } from '../game/fog.js';
import { game } from '../game/game.js';
import { overlay } from '../game/overlay.js';

export function findRefineryInRange(hero){
        if(!hero){
            hero = this;
        }
        var currentDistance;
        var currentRefinery;
        for (var i=0; i < game.buildings.length; i++) {
            var building = game.buildings[i];
            if (building.name == 'refinery' && building.team == hero.team){
                var distance = Math.pow(building.x-hero.x,2)+Math.pow(building.y-hero.y,2);
                if (!currentDistance || (currentDistance > distance)){
                    currentRefinery = building;
                    currentDistance = distance;
                }                
            }
        };
        return currentRefinery;
    }

export function findTiberiumInRange(hero){
        if(!hero){
            hero = this;
        }
        var currentDistance;
        var currentOverlay;
        for (var i=0; i < game.overlay.length; i++) {
            var overlay = game.overlay[i];
            if (overlay.name == 'tiberium' & overlay.stage>0 && !fog.isOver(overlay.x*game.gridSize,overlay.y*game.gridSize)){
                var distance = Math.pow(overlay.x-hero.x,2)+Math.pow(overlay.y-hero.y,2);
                if (!currentDistance || (currentDistance > distance)){
                    currentOverlay = overlay;
                    currentDistance = distance;
                }                
            }
        };
        return currentOverlay;
    }

export function findEnemiesInRange(hero,increment){
       if (!increment)
            increment = 0;
       var enemies = [];
       if(!hero){
           hero = this;
       }
       
       for (var i = game.units.length - 1; i >= 0; i--){
           var test = game.units[i];
        if(test.team != hero.team && Math.pow(test.x-hero.x,2) + Math.pow(test.y-hero.y,2) <= Math.pow(hero.sight+increment,2)){
               enemies.push(test);
               //alert(hero.name + ':' +hero.x + ',' + hero.y+ ' too close to ' + test.name + ':' +test.x + ',' + test.y)      
        }
    };
        for (var i = game.buildings.length - 1; i >= 0; i--){
            var test = game.buildings[i];
 	        if(test.team != hero.team && Math.pow(test.x+test.gridWidth/2-hero.x,2) + Math.pow(test.y+test.gridHeight/2-hero.y,2) <= Math.pow(hero.sight+increment,2)){
                enemies.push(test);      
 	        }
 	    };
        for (var i = game.turrets.length - 1; i >= 0; i--){
            var test = game.turrets[i];
            
 	        if(test.team != hero.team && Math.pow(test.x+test.gridWidth/2-hero.x,2) + Math.pow(test.y+test.gridHeight/2-hero.y,2) <= Math.pow(hero.sight+increment,2)){
                enemies.push(test);    
 	        }
 	    };	 
 	    return enemies;   
    }

export function findPath(start,end,isHeroTeam) {
        var g = isHeroTeam? game.heroObstructionGrid:game.obstructionGrid;
        // hack to find path to buildings
        try {
            g[end[1]][end[0]] = 0;
            g[start[1]][start[0]];
       //alert(end.y)
        } catch (err){
            return [{x:start[0],y:start[1]},{x:end[0],y:end[1]}];
        }
        
        var path = AStar(g,start,end,'Euclidean'); 
        shortenPath(path,g);
        if (path.length>1 && game.debugMode){
            for(var k=0;k<path.length;k++){
                //game.highlightGrid(path[k].x,path[k].y,1,1,'rgba(100,100,100,0.3)');
                context.beginPath();
                context.fillStyle='rgba(150,50,100,0.5)';
                context.arc((path[k].x+0.5)*game.gridSize+game.viewportAdjustX,(path[k].y+0.5)*game.gridSize+game.viewportAdjustY,5,0,2*Math.PI);
                context.fill();
            }                        
        }
        return path;
    }

