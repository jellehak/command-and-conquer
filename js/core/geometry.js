export function angleDiff(angle1,angle2,base){
    angle1 = Math.floor(angle1);
    angle2 = Math.floor(angle2)
        if (angle1>=base/2){
            angle1 = angle1-base;
        }
        if (angle2>=base/2){
            angle2 = angle2-base
        }
        var diff = angle2-angle1; 
        if (diff<-base/2){
            diff += base;
        }
        if (diff>base/2){
            diff -= base;
        }
    return diff;
}	

export function addAngle(angle,increment,base){
    angle = Math.round(angle)+increment;
    if (angle>base-1){
        angle -= base;
    }
    if (angle<0){
        angle+=base;
    }
    return angle;
}

export function findAngle(object,unit,base){
    if(!base){
        base = 32;
    }
    
    if(!unit){
        unit = this;
    }
    
    var dy = object.y - unit.y;
        var dx = object.x - unit.x;
        if (unit.type == 'turret'){
            dy = dy - 0.5;
            dx = dx - 0.5;
        }
        var angle = base/2+Math.round(Math.atan2(dx,dy)*base/(2*Math.PI));
        
        if (angle<0){
            angle += base;
        }
        if (angle>=base){
            angle -= base;
        }
        return angle;
}

export function shortenPath (path,grid) {
    //alert(1);
    //return;
    var nextCellVisible = true;
    var start = path[0];
    //alert(0)
    while(nextCellVisible && path.length>2){
        //alert(0.5)
        var next = path[2];
        if(Math.abs(next.y-start.y) > Math.abs(next.x-start.x)){
            //along y

            var slope = (next.x-start.x)/(next.y-start.y);
            var deltaY = 0.4 * (next.y-start.y)/Math.abs((next.y-start.y));
            var y = deltaY;
            var test = {x:start.x+y*slope,y:start.y+y}
            while (nextCellVisible && Math.abs(test.y - next.y) >0.3){
                //alert(test.y)

                    if(grid[Math.floor(test.y)][Math.floor(test.x)]>0){
                        nextCellVisible = false;
                    }
                    y += deltaY;
                    test = {x:start.x+y*slope,y:start.y+y};
            }
            //nextCellVisible = false;
        } else {
            //alert(2);
            var slope =(next.y-start.y)/(next.x-start.x);
            var deltaX = 0.4 * (next.x-start.x)/Math.abs(next.x-start.x) ;
            var x = deltaX;
            var test = {x:start.x+x,y:start.y+slope*x}
            while (nextCellVisible && Math.abs(test.x - next.x) >= 0.3){
                    if(grid[Math.floor(test.y)][Math.floor(test.x)]>0){
                        nextCellVisible = false;
                    }
                    x += deltaX;
                    test = {x:start.x+x,y:start.y+slope*x};
            }
            //along x
            //nextCellVisible = false;
        }
        if (nextCellVisible){
            path.splice(1,1);

            //alert(path.length)
        }
    }
    
    

        
        
        
        
}

