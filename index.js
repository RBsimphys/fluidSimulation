const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
// canvas setup 
const dim = 400;
canvas.width = dim;
canvas.height = dim;

// flow grid setup
const N = 100;
const size = N * N;
const gridSpacing = dim / N;


const Re = 300; //reynolds #
const u = [0, 0.04];
const viscocisty = u * gridSpacing / Re; //viscocisty 
const omega = 1 / (3 * viscocisty + 0.5);// relaxation paremeter 
const soundSpeed = 1 / Math.sqrt(3);
// velocity distribution and their weights, D2Q9  
const e =
    [[0, 0],
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]];
const w =
    [4 / 9,
    1 / 9, 1 / 9, 1 / 9, 1 / 9,
    1 / 36, 1 / 36, 1 / 36, 1 / 36]; // wights in order, zeroth, Nth, Sth, Est, Wst, NE, NW, SE, SW

let meshGrid = new Array(size);

class Cell {
    constructor(i, d0, u) {
        this.d0 = d0;
        this.df;
        this.i = i;
        this.u = u;
        this.fin = new Array(9);

        for (let i = 0; i < 9; i++) {
            this.fin[i] = dotProduct(e[i], this.u);
        }    // zeroth, Nth, Sth, Est, Wst, NE, NW, SE, SW
        this.fout = new Array(9); 

    }
    stream() {
        this.d0 = this.fin.reduce((a, b) => a + b, 0); 

    }
    collide(){}

}

for (let i = 0; i < size; i++) {
    meshGrid[i] = new Cell(i, 0, u, false);
}

let tempGrid = meshGrid; 

function updateGrid() {
    for (let i = 0; i < size; i++) {
        tempGrid[i].stream();
    }
    meshGrid = tempGrid; 
}

console.table(meshGrid[10].fin)


function drawGrid() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let dens = meshGrid[IX(i, j)].d0;
            let sat = 100 * (1 - dens);

            ctx.fillStyle = `hsl(0,0%,${sat}%)`
            ctx.strokeStyle = "#FF0000";
            ctx.fillRect(i * gridSpacing, j * gridSpacing, gridSpacing, gridSpacing);
            // ctx.fillStyle = "black";
            // ctx.font = "15px serif";
            // ctx.fillText(`${Math.round(d * 100) / 100}`, i * w, j * w)
        }
    }
}




function mainloop() {
    updateGrid();
    drawGrid();
    // requestAnimationFrame(mainloop);
}
setInterval(mainloop, 1000);
// mainloop();

canvas.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let x = Math.floor(e.offsetX / gridSpacing);
    let y = Math.floor(e.offsetY / gridSpacing);
    if (x < 0) {
        x = 1;
    }
    if (x > N - 1) {
        x = N - 2;
    }
    if (y < 0) {
        y = 1;
    }
    if (y > N - 1) {
        y = N - 2;
    }
    // 
    meshGrid[IX(x, y)].d0 = 1;

})


function dotProduct(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function IX(i, j) {
    return (i + N * j);
}
