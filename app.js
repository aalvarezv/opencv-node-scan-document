const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync } = require('fs');


(async () => {
    //crea el DOM
    installDOM();
    //carga openCV
    await loadOpenCV();
    //carga la imagen
    const image = await loadImage('./imagen.jpg');
    let src  = cv.imread(image);
    let dst  = new cv.Mat();
    //convierte la imagen a grises 
    cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
    
    let ksize = new cv.Size(5, 5);
    //Difumina la imagen, elimina el ruido y ayuda a encontrar bordes.
    cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    cv.Canny(dst, dst, 75, 200, 3, true);
  
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat(); 
    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
    let foundContour = null;
    let sortableContours = [];
    for(let i = 0; i < contours.size(); i++){
      let cnt = contours.get(i);
      let peri = cv.arcLength(cnt, true); // suma todos los lados.
      let area = cv.contourArea(cnt, false); //base x altura
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows == 4) {
          sortableContours.push({approx, area});
      }
    }
    //console.log('DESORDENADOS',sortableContours);
    //Los ordena en forma descendente.
    sortableContours.sort( (a, b) => (a.area < b.area) ? 1 : (a.area > b.area) ? -1 : 0 );
    //console.log('ORDENADOS',sortableContours);
    foundContour = sortableContours[0].approx;
  

    ////////////////
      
      //obtego las esquinas.
      let corner1 = new cv.Point(foundContour.data32S[0], foundContour.data32S[1]);
      let corner2 = new cv.Point(foundContour.data32S[2], foundContour.data32S[3]);
      let corner3 = new cv.Point(foundContour.data32S[4], foundContour.data32S[5]);
      let corner4 = new cv.Point(foundContour.data32S[6], foundContour.data32S[7]);
      
      console.log(corner1, corner2, corner3, corner4);

      //Order the corners
      let cornerArray = [{ corner: corner1 }, { corner: corner2 }, { corner: corner3 }, { corner: corner4 }];
      //Sort by Y position (to get top-down)
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
    
    ///////////////

    // we create an object compatible HTMLCanvasElement
    const canvas = createCanvas(300, 300);
    cv.imshow(canvas, dst);
    writeFileSync('output.jpg', canvas.toBuffer('image/jpeg'));

    src.delete(); 
    dst.delete();
    contours.delete(); 
    hierarchy.delete();











    /*
    console.log(contours.size());
    for (let i = 0; i < contours.size(); ++i) {
      let color = new cv.Scalar(0, 255,0);
      cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    */

/*
    let foundContour = null;
    for(let i = 0; i < contours.size(); i++){
      let cnt = contours.get(i);
      let peri = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.1 * peri, true);

      if (approx.rows == 4) {
        console.log('found it');
        foundContour = approx
        break;
      }
      else {
        approx.delete();
      }
    }
*/

    //cv.drawContours(dst, foundContour, 0, color, 1, cv.LINE_8, hierarchy, 100);
 

    //Get area for all contours so we can find the biggest
    /*let sortableContours = [];
    
    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt, false);
      let perim = cv.arcLength(cnt, false);

      sortableContours.push({ areaSize: area, perimiterSize: perim, contour: cnt });
    }
    //console.log('desordenados',sortableContours);
    
    Ordena los contornos de acuerdo al tamaño de area.
    sortableContours = sortableContours.sort((a, b) => (a.areaSize > b.areaSize) ? -1 : (a.areaSize < b.areaSize) ? 1 : 0);
    //sortableContours = sortableContours.slice(0,5);
    //console.log('ordenados',sortableContours);

    for (let i = 0; i < sortableContours.length; i++){
        let cnt = sortableContours[i].contour;
    }
    */


    //Ensure the top area contour has 4 corners (NOTE: This is not a perfect science and likely needs more attention)
// let approx = new cv.Mat();
// cv.approxPolyDP(sortableContours[0].contour, approx, .02 * sortableContours[0].perimiterSize, true);

// if (approx.rows == 4) {
//   console.log('Found a 4-corner approx');
//   foundContour = approx;
// }
// else{
//   console.log('No 4-corner large contour!');
//   return;
// }
   
    //  let color = new cv.Scalar(255,0,0,255);
    //  for (let i = 0; i < contours.size(); ++i) {

    //       console.log(color);
     
    //       cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    //     //
    //     // console.log(contours.get(i));
    //     // cv.drawContours(dst, contours, i, color, 2, cv.LINE_AA, hierarchy, 100);
    // }

    
    

    // let src = cv.imread(image);
    
    // let dst = new cv.Mat();

    // let ksize = new cv.Size(5, 5);

    //convierte la imagen a escala de grises
    //let gray = await cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY, 0)
    //console.log(gray)
    //gray = cv.GaussianBlur(src, gray, ksize, 0, 0, cv.BORDER_DEFAULT);
    //let edged = cv.Canny(src, dst, 50, 100, 3, false);

    /*
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    // You can try more different parameters
    cv.Canny(src, dst, 50, 100, 3, false);
    */
    
    // we create an object compatible HTMLCanvasElement
    // const canvas = createCanvas(300, 300);
    // cv.imshow(canvas, dst);
    // writeFileSync('output.jpg', canvas.toBuffer('image/jpeg'));

    // src.delete(); 
    // dst.delete();
   

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