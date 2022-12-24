const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
// canvas setup 
const dim = 500;
canvas.width = dim;
canvas.height = dim;

// grid setup
const N = 100;
const size = N * N;
const gridSpacing = dim / N;

const rho0 = 100; //average density
let tau = 0.6; 
let Nt = 4000; 
let meshGrid = new Array(size);
let barrier = new Array(size);

class Cell {
    constructor(d0, dn, de, dw, ds, dnw, dne, dse, dsw, rho, ux, uy, curl) {
        this.d0 = d0;
    }
}

for (let i = 0; i < size; i++) {
    meshGrid[i] = new Cell(Math.random(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    barrier[i] = false;
}




function drawGrid() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let dens = meshGrid[IX(i, j)].d0;
            let sat = 100 * dens;
            // ctx.fillStyle = "black";
            // ctx.font = "15px serif";
            // ctx.fillText(`${Math.round(d * 100) / 100}`, i * w, j * w)

            ctx.fillStyle = `hsl(0,0%,${sat}%)`
            ctx.strokeStyle = "#FF0000";
            ctx.fillRect(i * gridSpacing, j * gridSpacing, gridSpacing, gridSpacing);
        }
    }
}



function mainloop() {
    drawGrid()

    requestAnimationFrame(mainloop); 
}

mainloop(); 

function IX(i, j) {
    return i * (j + N);
}
