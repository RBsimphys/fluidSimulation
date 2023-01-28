// canvas set up
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 100;

var pxPerSquare = 4;

var xdim = canvas.width / pxPerSquare;
var ydim = canvas.height / pxPerSquare;

// grid set up =====================================================================================

// velocity directions,
const e = [
    [0, 0],                                   // N0
    [0, 1], [1, 1], [1, 0], [1, -1],          // N1, NE2, E3, SE4
    [0, -1], [-1, -1], [-1, 0], [-1, 1]       // S5, SW6, W7, NW8     
];
// weights 
const w = [
    4 / 9,                                    // N0
    1 / 9, 1 / 36, 1 / 9, 1 / 36,             // N1, NE2, E3, SE4
    1 / 9, 1 / 36, 1 / 9, 1 / 36              // S5, SW6, W7, NW8
];

const findex = [5, 6, 7, 8, 1, 2, 3, 4];
const Re = 250;

let obsRadius = 9;                          // obstacale properties 
let obsXpos = Math.round(xdim * 0.9);
let obsYpos = Math.round(ydim * 0.4);

// let obsRadius2 = 10;                          // obstacale properties 
// let obsXpos2 = Math.round(xdim*0.2);
// let obsYpos2 = Math.round(ydim*0.5);


const deltaT = 5;                             // time step
let ux0 = 0.2;                                // initial x velocity 
let uy0 = 0;                                  // initial y velocity 
let rho = 1;                                  // initial density 
const mu = ux0 * obsRadius / Re;	                          // viscosity
const omega = 1 / (3 * mu + 0.5);

const Cell = (rho, ux, uy, isObstacle) => {
    let fi = new Array(9);
    let feq = new Array(9);
    let state = {
        rho,
        ux,
        uy,
        fi,
        feq,
        isObstacle,
    }
    return Object.assign(
        {},
        state,
    )
}


grid = new Array(xdim * ydim);


for (let i = 0; i < xdim; i++) {
    for (let j = 0; j < ydim; j++) {
        grid[i + j * xdim] = Cell(1, 0, 0, false);
    }
}



function relax(ux, uy, rho) {
    let f = [];
    for (let n = 0; n < 9; n++) {
        let a = 3 * (e[n][0] * ux + e[n][1] * uy);
        let b = 4.5 * Math.pow((e[n][0] * ux + e[n][1] * uy), 2);
        let c = 1.5 * (Math.pow(ux, 2) + Math.pow(uy, 2));
        f[n] = w[n] * rho * (1 + a + b - c);
    }
    return f;
}
function setObstacle(radius, xpos, ypos) {
    for (let i = xpos; i < xpos + 1; i++) {
        for (let j = ypos; j < ypos + radius; j++) {
            grid[IX(i, j)].isObstacle = true;
        }
    }
}

setObstacle(obsRadius, obsXpos, obsYpos);
// setObstacle(obsRadius2, obsXpos2, obsYpos2);



for (let i = 0; i < xdim; i++) {
    for (let j = 0; j < ydim; j++) {
        grid[IX(i, j)].fi = relax(ux0, uy0, rho);
    }
}

function collide() {
    for (let i = 0; i < xdim; i++) {
        for (let j = 0; j < ydim; j++) {
            let index = IX(i, j);
            grid[index].rho = sumMatrix(grid[index].fi);
            grid[index].ux = 0;
            grid[index].uy = 0;
            for (let n = 0; n < 9; n++) {
                grid[index].ux += (e[n][0] * grid[index].fi[n]) / grid[index].rho;
                grid[index].uy += (e[n][1] * grid[index].fi[n]) / grid[index].rho;
            }
            let feq = relax(grid[index].ux, grid[index].uy, grid[index].rho);
            for (let n = 0; n < 9; n++) {
                grid[index].fi[n] += omega * (feq[n] - grid[index].fi[n]);
            }
        }
    }
}

function stream() {
    let temp_grid = _.cloneDeep(grid);
    for (let y = 1; y < ydim-1; y++) {
        for (let x = 1; x < xdim-1; x++) {
            for (let i = 0; i < 9; i++) {
                let posx = (x + e[i][0] ) ;
                let posy = (y + e[i][1]);
                grid[IX(x, y)].fi[i] = temp_grid[IX(posx, posy)].fi[i];
            }
        }
    }
}

function applyBoundaryConditions() {
    for (let y = 1; y < ydim-1; y++) {
        for (let x = 1; x < xdim-1; x++) {
            if (grid[IX(x,y)].isObstacle) {
                grid[x + y * xdim].fi[2] = grid[x + y * xdim].fi[8];
                grid[x + y * xdim].fi[4] = grid[x + y * xdim].fi[6];
                grid[x + y * xdim].fi[5] = grid[x + y * xdim].fi[1];
                grid[x + y * xdim].fi[8] = grid[x + y * xdim].fi[2];
                grid[x + y * xdim].fi[6] = grid[x + y * xdim].fi[4];
                grid[x + y * xdim].fi[1] = grid[x + y * xdim].fi[5];
            }
        }
    }
}



let colors = [];

for (let i = 0; i <= 150; i += 0.01) {
    let density = Math.log(i + 2) / Math.log(100);
    let hue = Math.round(density * 360);
    let sat = Math.round(density * 80);
    let light = Math.round(density * 30 + 35);
    colors.push(`hsl(${hue} ${sat}% ${light}%)`);
}

let color = function (val, Re_t) {
    let density = Math.log(val + 1) / Math.log(100);
    let colorIndex = Math.round(density * (colors.length - 1));

    return colors[colorIndex];

}

function draw() {
    let Umag = grid.map(function (e) {
        return e.ux;
        // return Math.sqrt(Math.pow(e.ux, 2) + Math.pow(e.uy, 2));
    });
    let maxUmag = Math.max(...Umag);

    for (var y = 0; y < ydim; y++) {
        for (var x = 0; x < xdim; x++) {
            let index = x + y * xdim;

            let speed = Math.sqrt(Math.pow(grid[index].ux, 2) + Math.pow(grid[index].uy, 2));

            let Re_t = grid[index].ux * obsXpos / mu;

            let norm_speed = grid[index].ux / maxUmag;

            let c = color(norm_speed, Re_t);

            ctx.fillStyle = c;
            if (grid[index].isObstacle) {
                ctx.fillStyle = 'black';
            }

            ctx.fillRect(x * pxPerSquare, y * pxPerSquare, xdim, ydim);
        }

    }
}


let tempGrid = _.cloneDeep(grid);
function simulate() {
    for (let i = 0; i < deltaT; i++) {
        collide();
        stream();
        applyBoundaryConditions();
    }

    draw();
    requestAnimationFrame(simulate);
}

simulate();



function dotMatrix(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function sumMatrix(a) {
    return a.reduce((a, b) => a + b)
}

function IX(i, j) {
    return i + xdim * j;
}


canvas.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let mouse = {
        i: Math.floor(e.offsetX / pxPerSquare),
        j: Math.floor(e.offsetY / pxPerSquare),
    };

    grid[IX(mouse.i, mouse.j)].isObstacle = true;
    // console.log(meshGrid[IX(mouse.i, mouse.j)].ux, meshGrid[IX(mouse.i, mouse.j)].uy);

});
