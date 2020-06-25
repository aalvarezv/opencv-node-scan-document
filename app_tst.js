const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync } = require('fs');


(async () => {
    //crea el DOM
    installDOM();
    //carga openCV
    await loadOpenCV();

    const archivo = await loadImage('./imagen.jpeg');
    let image = cv.imread(archivo);
    
    //BAD IDEA END
    let edges = new cv.Mat();
    cv.Canny(image,edges,100,200);
    // cv.imshow($("canvas")[0],edges);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(edges,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    
    let cnts = []
    for(let i=0;i<contours.size();i++){
        const tmp = contours.get(i);
        const peri = cv.arcLength(tmp,true);
        let approx = new cv.Mat();
        
        let result = {
            area:cv.contourArea(tmp),
            points:[]
        };

        cv.approxPolyDP(tmp,approx,0.02*peri,true);
        const pointsData = approx.data32S;
        for(let j=0;j<pointsData.length/2;j++)
            result.points.push({x:pointsData[2*j],y:pointsData[2*j+1]});
        
        if(result.points.length===4) cnts.push(result);
        
    }
    cnts.sort((a,b)=>b.area-a.area);

    console.log(cnts[0]);

  
 
})();


function loadOpenCV() {
    return new Promise(resolve => {
      global.Module = {
        onRuntimeInitialized: resolve
      };
      global.cv = require('./opencv.js');
    });
}

// Using jsdom and node-canvas we define some global variables to emulate HTML DOM.
// Although a complete emulation can be archived, here we only define those globals used
// by cv.imread() and cv.imshow().
function installDOM() {
    const dom = new JSDOM();
    global.document = dom.window.document;
    // The rest enables DOM image and canvas and is provided by node-canvas
    global.Image = Image;
    global.HTMLCanvasElement = Canvas;
    global.ImageData = ImageData;
    global.HTMLImageElement = Image;
}

const getMaxContour = (image) => {
    const contours = image.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    let maxAreaFound = 0;
    let maxContour = [];
    let contourObj = null;
    console.log(`Found ${contours.length} contours.`);
    contours.forEach((contour,i)=>{
      // const perimeter = cv.arcLength(contour, true);
      const perimeter = contour.arcLength(true);
      const approx = contour.approxPolyDP(0.1*perimeter, true);
      const area = contour.moments()['m00'];
  
      if (approx.length == 4 && maxAreaFound<area){
        maxAreaFound = area;        
        maxContour = approx;
        contourObj=contour;
      }  
    });
  
    console.log(JSON.stringify(contourObj))
    console.log(`Max contour area found ${maxAreaFound}.`);
  
    return {
      contour:maxContour,
      area:maxAreaFound
    };
  }
  