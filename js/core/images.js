export function preloadImage(imgUrl,callbackFunction){
    var loadee = this;
    this.loaded = false;
    var image = new Image();
    image.src = 'images/'+imgUrl;
    this.preloadCount++;
    image.addEventListener('load',function() {
        loadee.loadedCount++;
        if (loadee.loadedCount == loadee.preloadCount){
            loadee.loaded=true;
        }
        if (callbackFunction){
            callbackFunction();
        }
    });
    return image;
}

export function loadImageArray(imgName, count, extn){
    if(!extn){
        extn = '.png';
    }
    var imageArray = [];
    for (var i=0; i < count; i++) {
        imageArray.push(this.preloadImage(imgName+'-'+(i<10?'0':'')+i+extn));
    };
        return imageArray;
}	

