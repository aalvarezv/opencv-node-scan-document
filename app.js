const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync } = require('fs');


(async () => {
    //crea el DOM
    console.log('INICIO',new Date().toLocaleTimeString());
    installDOM();
    console.log('DOM',new Date().toLocaleTimeString());
    //carga openCV
    await loadOpenCV();
    console.log('OPENCV',new Date().toLocaleTimeString());
  
    //carga la imagen
    let image = null;
    if(false){
       image = await loadImage('./imagen-ok.jpg');
    }else{
       image = await loadImage('./imagen-test.jpg');
    }
    
    let src  = cv.imread(image);
    console.log('IMAGEN',new Date().toLocaleTimeString());
    //let dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let dst  = new cv.Mat();
    //convierte la imagen a grises 
    //cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);

    //dejamos la imagen en blanco y negro.
    let low = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [255, 255, 255, 255]);
    cv.inRange(src, low, high, dst);
    console.log('B/N ENTRADA',new Date().toLocaleTimeString());
    
    //obtiene los contornos, mientras mas contornos podamos recuperar, mas chance de obtener el area que estamos buscando (el mas grande).
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat(); 
    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    console.log('CONTORNOS',new Date().toLocaleTimeString());

    let foundContour = null;
    let sortableContours = [];

    console.log(contours.size());

    for(let i = 0; i < contours.size(); i++){
      let cnt = contours.get(i);
      let peri = cv.arcLength(cnt, true); // suma de todos los lados.
      let area = cv.contourArea(cnt, false); //base x altura
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

    
      // console.log('contorno', cnt.size().width,
      // cnt.size().height, cnt.cols, cnt.rows,
      // 'approx', approx.size().width,
      //    approx.size().height, approx.cols, approx.rows);


      if (approx.rows == 4) {
          //console.log(area, approx.rows);
      //      console.log('contorno', cnt.size().width,
      // cnt.size().height, cnt.cols, cnt.rows,
      // 'approx', approx.size().width,
      //    approx.size().height, approx.cols, approx.rows);
          sortableContours.push({approx, area});
      }
  
    }
    
   
    //console.log('DESORDENADOS',sortableContours);
    //Los ordena en forma descendente.
    sortableContours.sort( (a, b) => (a.area < b.area) ? 1 : (a.area > b.area) ? -1 : 0 );
    //console.log('ORDENADOS',sortableContours);
    foundContour = sortableContours[0].approx;
    console.log('CONTORNO ENCONTRADO',new Date().toLocaleTimeString());
   
    ////////////////
      
    //obtego las esquinas.
    let corner1 = new cv.Point(foundContour.data32S[0], foundContour.data32S[1]);
    let corner2 = new cv.Point(foundContour.data32S[2], foundContour.data32S[3]);
    let corner3 = new cv.Point(foundContour.data32S[4], foundContour.data32S[5]);
    let corner4 = new cv.Point(foundContour.data32S[6], foundContour.data32S[7]);
    
    //Order the corners
    let cornerArray = [{ corner: corner1 }, { corner: corner2 }, { corner: corner3 }, { corner: corner4 }];
    //Sort by Y position (to get top-down)
    //Ordena de acuerdo al eje Y para obtener arriba y abajo.
    cornerArray.sort((a, b) => { return (a.corner.y < b.corner.y) ? -1 : (a.corner.y > b.corner.y) ? 1 : 0; }).slice(0, 5);
    
    //Determine left/right based on x position of top and bottom 2
    let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
    let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
    let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
    let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
    
    //Calculate the max width/height
    let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
    let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
    let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
    let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
    let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
    let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;
    
    //Transform!
    let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]); //
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x, tl.corner.y, tr.corner.x, tr.corner.y, br.corner.x, br.corner.y, bl.corner.x, bl.corner.y]);
    let dsize = new cv.Size(theWidth, theHeight);
    let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords)
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    console.log('TRANSFORMACIÓN',new Date().toLocaleTimeString());
    ///////////////
  

    //blanco y negro usando inRange.
    console.log('B/N SALIDA',new Date().toLocaleTimeString());
    low = new cv.Mat(dst.rows, dst.cols, dst.type(), [150, 150, 150, 255]);
    high = new cv.Mat(dst.rows, dst.cols, dst.type(), [255, 255, 255, 255]);
    cv.inRange(dst, low, high, dst);
    
    const canvas = createCanvas(300, 300);
    cv.imshow(canvas, dst);
    writeFileSync('output.jpg', canvas.toBuffer('image/jpeg'));
    

    src.delete(); 
    dst.delete();
    contours.delete(); 
    hierarchy.delete();
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