// canvas setup -------------------
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

const canvasWidth = 500;
const canvasHeight = 500;


canvas.width = canvasWidth;
canvas.height = canvasHeight;


// grid setup -----------------------
const N = 2; //number of cells
const r = N;
const c = N;

const w = canvasWidth / N;
const h = canvasHeight / N;


class Cell{
    #DiffCoef;
    constructor(index, d0, vX0, vXf, vY0, vYf) {
        this.index = index;

        this.d0 = d0;
        this.df;
        this.#DiffCoef = 1;

        this.vX0 = vX0;
        this.vY0 = vY0;
        this.vXf = vXf;
        this.vYf = vYf;
    }

    addForce(){

    }

    diffuse(){

    }

    move(){

    }

}
 
let meshGrid = new Array(N*N); 

for(let i = 0; i < N*N; i++){
    meshGrid[i] = new Cell(i,0, 0, 0, 0, 0); 
}



function IX(i, j) {
    return i + (r + 2) * j;
}


