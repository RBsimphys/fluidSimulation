const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
// canvas setup 
const dim = 500;
canvas.width = dim;
canvas.height = dim;
// grid setup
const N = 100;
const r = N;
const c = N;

let w = dim / N;


// setup grid 
let grid = [];
let iter = 0;
const iterF = 0.01;


//           ____uY___ 
//          | CELL:   |
//      vX  | d0,pos  |   uX
//          |         |
//          |_________|
//               vY
class Cell {
    #DiffCoef;
    constructor(posx, posy, d0, vX, uX, vY, uY) {
        this.posx = posx;
        this.posy = posy;

        this.d0 = d0;
        this.df;
        this.#DiffCoef = 1;

        this.vX = vX;
        this.vY = vY;
        this.uX = uX;
        this.uY = uY;
    }

    get s() {
        return (grid[this.posx + 1][this.posy].d0 +
            grid[this.posx - 1][this.posy].d0 +
            grid[this.posx][this.posy + 1].d0 +
            grid[this.posx][this.posy - 1].d0) / 4;

    }

    get k() {
        return this.#DiffCoef * iter;
    }
    diffuse() {
        if (this.posx > 0 && this.posx < c - 1 && this.posy > 0 && this.posy < r - 1) {
            this.df = (this.d0 + this.k * this.s) / (1 + this.k);
        } else {
            this.df = (this.d0 + this.k) / (1 + this.k);
        }
        this.d0 = this.df;

    }

    advect() {
        if (this.posx > 0 && this.posx < c - 1 && this.posy > 0 && this.posy < r - 1) {
            try {
                grid[this.posx - this.vX][this.posy].d0 -= this.d0;
                grid[this.posx][this.posy - this.vY].d0 -= this.d0;
            } catch {
                console.log(this.posy);
            }
        }
    }
}

for (let i = 0; i < r; i++) {
    grid[i] = [];
    for (let j = 0; j < c; j++) {
        grid[i][j] = new Cell(i, j, 1, 0, -10);
    }
}

let tempgrid = grid;

// update grid -----------

// function initialState() {
//     for (let i = 0; i < 2; i++) {
//         for (let j = (r / 4); j < (r / 2); j++) {
//             grid[0][j].vX = 100;
//             grid[0][j].vy = 10;

//         }
//     }
// }

function updateGrid() {


    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            tempgrid[i][j].diffuse();
        }
    }
    for (let i = 1; i < r - 1; i++) {
        for (let j = 1; j < c - 1; j++) {
            tempgrid[1][0].advect();
        }
    }



    grid = tempgrid;
    iter += iterF;
    // initialState();

}


// draw grid onto canvas 
function drawGrid() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let d = grid[i][j].df;
            let sat = 100 * d;

            // ctx.fillStyle = "black";
            // ctx.font = "15px serif";
            // ctx.fillText(`${Math.round(d * 100) / 100}`, i * w, j * w)

            ctx.fillStyle = `hsl(0,0%,${sat}%)`
            ctx.strokeStyle = "#FF0000";
            ctx.fillRect(i * w, j * w, w, w);
        }
    }
}


function mainloop() {

    updateGrid();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    requestAnimationFrame(mainloop);
}

mainloop();


canvas.addEventListener('mousemove', (e) => {
    e.preventDefault();

    let idx = {
        x: Math.floor(e.offsetX / w),
        y: Math.floor(e.offsetY / w),
    };
    // check for boundaries
    if (idx.x < 0) {
        idx.x = 1;
    }
    if (idx.x > N - 1) {
        idx.x = N - 2;
    }
    if (idx.y < 0) {
        idx.y = 1;
    }
    if (idx.y > N - 1) {
        idx.y = N - 2;
    }
    // 
    for (let i = 0; i < N; i++) {
        for (let i = 0; i < N*0.1; i++) {
            mousex = idx.x + i;
            mousey = idx.y + i;
            grid[mousex][mousey].d0 = 0;

        }
    }

});
