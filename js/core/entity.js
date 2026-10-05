import { context } from './dom.js';
import { game } from '../game/game.js';
import { sidebar } from '../game/sidebar.js';

export function getLife(){
    var life = this.health/this.hitPoints;
        if(life > 0.7){
            this.life = "healthy";
        } else if (life>0.4){
            this.life = "damaged";        
        } else {
            this.life = "ultra-damaged";
        }
}

export function drawSelection(){
        if (this.selected){
            context.strokeStyle = 'white';
            //context.strokeWidth = 4;
            
            var selectBarSize = 5;

            var x = this.x*game.gridSize+game.viewportAdjustX + this.pixelOffsetX;
        var y = this.y*game.gridSize+game.viewportAdjustY + this.pixelOffsetY;

            var x1 = x+this.pixelLeft;
            var y1 = y+this.pixelTop;
            var x2 = x1+this.pixelWidth;
            var y2 = y1+this.pixelHeight;

            
            // First draw the white bracket
            context.beginPath();
           //alert(x1);
            context.moveTo(x1,y1+selectBarSize);
            context.lineTo(x1,y1);
            context.lineTo(x1+selectBarSize,y1);

            context.moveTo(x2-selectBarSize,y1);
            context.lineTo(x2,y1);
            context.lineTo(x2,y1+selectBarSize);

            context.moveTo(x2,y2-selectBarSize);
        context.lineTo(x2,y2);
        context.lineTo(x2-selectBarSize,y2);

            context.moveTo(x1+selectBarSize,y2);
        context.lineTo(x1,y2);
            context.lineTo(x1,y2-selectBarSize);    	        
            
            context.stroke();

            // Now draw the health bar
            this.getLife();     
   
            context.beginPath();
            context.rect(x1,y1-selectBarSize-2,this.pixelWidth*this.health/this.hitPoints,selectBarSize);
            if (this.life == 'healthy') { 
                context.fillStyle = 'lightgreen';
            } else if (this.life == 'damaged') { 
                context.fillStyle = 'yellow';
            } else {
                context.fillStyle = 'red';
            }
            context.fill();
            context.beginPath();
            context.strokeStyle = 'black';
            context.rect(x1,y1-selectBarSize-2,this.pixelWidth,selectBarSize);
            context.stroke();
            
            if(this.primaryBuilding){
               context.drawImage(sidebar.primaryBuildingImage,(x1+x2 -sidebar.primaryBuildingImage.width)/2 ,y2-sidebar.primaryBuildingImage.height);
            }
        }
        
    }

export function underPoint(x,y){
        var xo = this.x*game.gridSize + this.pixelOffsetX;
        var yo = this.y*game.gridSize + this.pixelOffsetY;

        var x1 = xo+this.pixelLeft;
        var y1 = yo+this.pixelTop;
        var x2 = x1+this.pixelWidth;
        var y2 = y1+this.pixelHeight;
        //

        if (x>= x1 && x<=x2 && y>= y1 && y <= y2){
            return true;
            
        }
        return false;
    }

