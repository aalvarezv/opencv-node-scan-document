const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync } = require('fs');


(async () => {
    //crea el DOM
    installDOM();
    //carga openCV
    await loadOpenCV();

    const archivo = await loadImage('./output.jpg');
    let src = cv.imread(archivo);
    
    let dst = new cv.Mat();
    let low = new cv.Mat(src.rows, src.cols, src.type(), [170, 170, 170, 255]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [255, 255, 255, 255]);
    // You can try more different parameters
    cv.inRange(src, low, high, dst);

    //cv.threshold(dst, dst, 128, 255, cv.THRESH_BINARY);

    const canvas = createCanvas(300, 300);
    cv.imshow(canvas, dst);
    writeFileSync('output1.jpg', canvas.toBuffer('image/jpeg'));


    src.delete(); 
    dst.delete(); 
    low.delete(); 
    high.delete();


  
 
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
  