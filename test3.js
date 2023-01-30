// canvas set up ===================================================================================
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 160;

var N = 8;

var xn = canvas.width / N;
var yn = canvas.height / N;

// grid set up =====================================================================================

// velocity directions,
const e = [
    [0, 0],                                   // 0
    [0, 1], [1, 1], [1, 0], [1, -1],          // N1, NE2, E3, SE4
    [0, -1], [-1, -1], [-1, 0], [-1, 1]       // S5, SW6, W7, NW8     
];

// weights 
const w = [
    4 / 9,                                    // N0
    1 / 9, 1 / 36, 1 / 9, 1 / 36,             // N1, NE2, E3, SE4
    1 / 9, 1 / 36, 1 / 9, 1 / 36              // S5, SW6, W7, NW8
];


const deltaT = 10;                             // time step
let ux0 = 0.2;                                // initial x velocity 
let uy0 = 0;                                  // initial y velocity 
let rho = 1;                                  // initial density 
const mu = 0.01;	                          // viscosity
const omega = 1 / (3 * mu + 0.5);


const obsRadius = 4;
const obsXpos = xn * 0.1;
const obsYpos = yn * 0.5;
const startAngle = 0;
const endAngle = Math.PI * 2;

const Cell = (i, j, rho, ux, uy, isObstacle) => {
    let fi = new Array(9);
    let feq = new Array(9);
    let state = {
        i,
        j,
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


grid = new Array(xn * yn);


for (let i = 0; i < xn; i++) {
    for (let j = 0; j < yn; j++) {
        grid[IX(i, j)] = Cell(i, j, 1, 0, 0, false);
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


function setObstacle(radius, xpos, ypos, startAngle, endAngle) {
    for (let angle = startAngle; angle < endAngle; angle += 0.01) {
        for (let i = 0; i < radius; i++) {
            let x = xpos + i * Math.cos(angle);
            let y = ypos + i * Math.sin(angle);
            grid[IX(Math.round(x), Math.round(y))].isObstacle = true;
        }
    }
}

setObstacle(obsRadius, obsXpos, obsYpos, startAngle, endAngle);

for (let i = 0; i < xn; i++) {
    for (let j = 0; j < yn; j++) {
        grid[IX(i, j)].fi = relax(ux0, uy0, rho);
    }
}


function collide() {
    for (let i = 0; i < xn; i++) {
        for (let j = 0; j < yn; j++) {
            let index = IX(i, j);		// array index for this lattice site
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
            // fout[index] = [...grid[index].fi];
        }
    }
}



let find = [0, 5, 6, 7, 8, 1, 2, 3, 4];
function stream() {
    for (let x = 2; x < xn - 2; x++) {
        for (let y = 2; y < yn - 2; y++) {
            for (let n = 1; n < 9; n++) {
                let posx = x - e[n][0];
                let posy = y - e[n][1];
                grid[IX(x, y)].fi[n] = tempGrid[IX(posx, posy)].fi[n];

                if (grid[IX(x, y)].isObstacle) {
                    grid[IX(posx, posy)].fi[n] = tempGrid[IX(x, y)].fi[find[n]];
                }
            }

        }
    }


}

//     for (var y = 1; y < yn - 1; y++) {
//         for (var x = 1; x < xn - 1; x++) {
//             grid[IX(x, y)].fi[7] = grid[IX(x + 1, y)].fi[7];			// move the west-moving particles
//             grid[IX(x, y)].fi[6] = grid[IX(x + 1, y + 1)].fi[6];		// and the southwest-moving particles
//         }
//     }
//     for (var y = yn - 2; y > 0; y--) {
//         for (var x = 1; x < xn - 1; x++) {
//             grid[IX(x, y)].fi[1] = grid[IX(x, y - 1)].fi[1];
//             grid[IX(x, y)].fi[8] = grid[IX(x + 1, y - 1)].fi[8];
//         }
//     }
//     for (var y = yn - 2; y > 0; y--) {
//         for (var x = xn - 2; x > 0; x--) {
//             grid[IX(x, y)].fi[3] = grid[IX(x - 1, y)].fi[3];
//             grid[IX(x, y)].fi[2] = grid[IX(x - 1, y - 1)].fi[2];
//         }
//     }
//     for (var y = 1; y < yn - 1; y++) {
//         for (var x = xn - 2; x > 0; x--) {
//             grid[IX(x, y)].fi[5] = grid[IX(x, y + 1)].fi[5];
//             grid[IX(x, y)].fi[4] = grid[IX(x - 1, y + 1)].fi[4];
//         }
//     }
// }

function computeboundries() {
    for (var y = 1; y < yn - 1; y++) {				// Now handle bounce-back from barriers
        for (var x = 1; x < xn - 1; x++) {

            // grid[IX(x, y + 1)].fi[1] = grid[index].fi[5];
            // grid[IX(x + 1, y + 1)].fi[2] = grid[index].fi[6];
            // grid[IX(x + 1, y)].fi[2] = grid[index].fi[8];
            // grid[IX(x - 1, y)].fi[8] = grid[index].fi[2];
            // grid[IX(x + 1, y - 1)].fi[4] = grid[index].fi[8];
            // grid[IX(x - 1, y + 1)].fi[8] = grid[index].fi[4];

            // grid[IX(x, y - 1)].fi[5] = grid[index].fi[1];
            // grid[IX(x - 1, y - 1)].fi[6] = grid[index].fi[2];
        }
    }
}





let colors = [];

for (let i = 0; i <= 100; i += 0.1) {
    let density = Math.log(i + 1) / Math.log(90);
    let hue = Math.round(density * 380);
    let sat = Math.round(density * 200);
    let light = Math.round(density + 35);
    colors.push(`hsl(${hue} ${sat}% ${light}%)`);
}

let color = function (val) {
    let density = Math.log(val + 1) / Math.log(100);
    let colorIndex = Math.round(density * (colors.length - 1));
    return colors[colorIndex];

}

function draw() {
    let vorticity = [];
    for (let i = 1; i < xn - 1; i++) {
        for (let j = 1; j < yn - 1; j++) {
            vorticity.push(curl(i, j));
        }
    }

    let maxVort = Math.max(...vorticity);
    let minVort = Math.min(...vorticity);

    for (var y = 1; y < yn - 1; y++) {
        for (var x = 1; x < xn - 1; x++) {
            let index = x + y * xn;

            let norm_speed = (curl(x, y) - minVort) / (maxVort - minVort);
            let c = color(norm_speed);

            ctx.fillStyle = c;
            if (grid[index].isObstacle) {
                ctx.fillStyle = 'rgba(0, 0, 55, 60%)';
            }

            ctx.fillRect(x * N, y * N, xn, yn);
        }

    }
}

let tempGrid = _.cloneDeep(grid);
function simulate() {
    for (let i = 1; i < deltaT; i++) {
        collide();
        tempGrid = _.cloneDeep(grid);
        stream();
        computeboundries();
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
    return i + xn * j;
}

function curl(i, j) {
    return (grid[IX(i, j + 1)].ux - grid[IX(i, j - 1)].ux) - (grid[IX(i - 1, j)].uy - grid[IX(i - 1, j)].uy);
}

canvas.addEventListener('click', (e) => {
    e.preventDefault();
    let mouse = {
        i: Math.floor(e.offsetX / N),
        j: Math.floor(e.offsetY / N),
    };

    grid[IX(mouse.i, mouse.j)].isObstacle = true;
    // console.log(grid[IX(mouse.i, mouse.j)].fi[plot]);

});
