const array = [5,1,3,2,4,0,6,11,22]
const arraySort = array.sort((a, b) => {
    if(a > b) return 1; //a,b
    if(a < b) return -1; //b,a
    return 0;//iguales no se cambian
});

console.log(arraySort);