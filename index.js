// ===================================================================================
// canvas set up 
const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 660;
canvas.height = 240;
var N = 6;

var xn = canvas.width / N;
var yn = canvas.height / N;

// ======================================================================================
// Grid set up

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
const mu = 0.02;	                          // viscosity
const omega = 1 / (3 * mu + 0.5);


const obsRadius = 5;
const obsXpos = xn * 0.1;
const obsYpos = yn * 0.5;
const startAngle = 0;
const endAngle = Math.PI * 2;

const Cell = (i, j, rho, ux, uy, isObstacle) => {
    let fi = new Array(9);
    let feq = new Array(9);
    let vorticity;
    let state = {
        rho,
        ux,
        uy,
        fi,
        feq,
        isObstacle,
        vorticity,
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


// ======================================================================================
// Physics stuff 

function getEquilibrium(ux, uy, rho) {
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
        grid[IX(i, j)].fi = getEquilibrium(ux0, uy0, rho);
    }
}



// collision step 
function collide() {
    for (let i = 0; i < xn; i++) {
        for (let j = 0; j < yn; j++) {
            let index = IX(i, j);
            grid[index].rho = sumMatrix(grid[index].fi);
            grid[index].ux = 0;
            grid[index].uy = 0;

            for (let n = 0; n < 9; n++) {
                grid[index].ux += (e[n][0] * grid[index].fi[n]) / grid[index].rho;
                grid[index].uy += (e[n][1] * grid[index].fi[n]) / grid[index].rho;
            }

            let feq = getEquilibrium(grid[index].ux, grid[index].uy, grid[index].rho);
            for (let n = 0; n < 9; n++) {
                grid[index].fi[n] += omega * (feq[n] - grid[index].fi[n]);
            }
        }
    }
}

//  in-place stream function, with bounce back boundary condition  
let fbounce = [0, 5, 6, 7, 8, 1, 2, 3, 4];
function stream() {
    // N NE E SE S        
    for (let x = xn - 2; x > 0; x--) {
        for (let y = yn - 2; y > 0; y--) {
            grid[IX(x, y)].fi[1] = grid[IX(x, y - 1)].fi[1];
            grid[IX(x, y)].fi[2] = grid[IX(x - 1, y - 1)].fi[2];
            grid[IX(x, y)].fi[3] = grid[IX(x - 1, y)].fi[3];
            grid[IX(x, y)].fi[4] = grid[IX(x - 1, y + 1)].fi[4];
        }
        for (let y = 1; y < yn - 1; y++) {
            grid[IX(x, y)].fi[5] = grid[IX(x, y + 1)].fi[5];
        }
    }   

    for (let x = 1; x < xn - 2; x++) {
        for (let y = yn - 2; y > 1; y--) {
            // SW W NW
            grid[IX(x, y)].fi[6] = grid[IX(x + 1, y + 1)].fi[6];
            grid[IX(x, y)].fi[7] = grid[IX(x + 1, y)].fi[7];
            grid[IX(x, y)].fi[8] = grid[IX(x + 1, y - 1)].fi[8];
            // handle obstacles 
            if (grid[IX(x, y)].isObstacle) {
                for (let n = 1; n < 9; n++) {
                    grid[IX(x, y)].fi[n] = grid[IX(x, y)].fi[fbounce[n]];
                }
            }
        }
    }
}

// ======================================================================================
// draw stuff 

// plot options 
const plotOptionButtons = document.querySelectorAll('input[name="plotOption"]');
let plotSelection = 4;

// chroma js color map
let colorUx = chroma.scale('YlGn');
let colorUy = chroma.cubehelix().hue([1, 0]);
let colorVorticity = chroma.scale('OrRd').padding([0.2, 0]);
let colorRho = chroma.cubehelix().rotations(0.5);


// draw fluid simulation 
function draw() {
    let vorticity = [];
    for (let i = 1; i < xn - 1; i++) {
        for (let j = 1; j < yn - 1; j++) {
            vorticity.push(curl(i, j));
        }
    }

    let maxVort = Math.max(...vorticity);
    let minVort = Math.min(...vorticity);

    let UxArray = grid.map(function (e) { return e.ux });
    let maxUx = Math.max(...UxArray);
    let minUx = Math.min(...UxArray);

    let UyArray = grid.map(function (e) { return e.uy });

    let maxUy = Math.max(...UyArray);
    let minUy = Math.min(...UyArray);


    let rhoArray = grid.map(function (e) { return e.rho });

    let maxRho = Math.max(...rhoArray);
    let minRho = Math.min(...rhoArray);

    let c;
    for (var y = 1; y < yn - 1; y++) {
        for (var x = 1; x < xn - 1; x++) {
            let index = x + y * xn;
            switch (plotSelection) {
                case 1:
                    c = colorRho((grid[index].rho - minRho) / (maxRho - minRho))
                    break;
                case 2:
                    c = colorUx((grid[index].ux - minUx) / (maxUx - minUx))
                    break;
                case 3:

                    c = colorUy((grid[index].uy - minUy) / (maxUy - minUy))
                    break;
                default:
                    let norm_speed = (curl(x, y) - minVort) / (maxVort - minVort);
                    c = colorVorticity(norm_speed);
                    break;
            }
            // let c = color(grid[IX(x, y)].fi[1]);
            ctx.fillStyle = c;
            if (grid[index].isObstacle) {
                ctx.fillStyle = 'rgba(0, 0, 0, 100%)';
            }

            ctx.fillRect(x * N, y * N, N, N);
        }

    }
}

// graph profiles 
const chart = document.getElementById("plot");
const gctx = chart.getContext("2d");

const graphCaption = document.getElementById("profilePlotCaption");
const xPos = document.getElementById("xPos");
const graphXaxis = document.getElementById("xLabel"); 

xPos.max = toString(xn);

let plotWidth = 400;
let plotHeight = 200;
let buffer = 30;
let chartWidth = plotWidth + buffer;
let chartHeight = plotHeight + buffer;
chart.width = chartWidth;
chart.height = chartHeight;


function graph(posx) {

    let vorticity = [];
    for (let i = 1; i < xn - 1; i++) {
        for (let j = 1; j < yn - 1; j++) {
            vorticity.push(curl(i, j));
        }
    }

    let maxVort = Math.max(...vorticity);
    let minVort = Math.min(...vorticity);

    let UxArray = grid.map(function (e) { return e.ux });
    let maxUx = Math.max(...UxArray);
    let minUx = Math.min(...UxArray);

    let UyArray = grid.map(function (e) { return e.uy });

    let maxUy = Math.max(...UyArray);
    let minUy = Math.min(...UyArray);


    let rhoArray = grid.map(function (e) { return e.rho });

    let maxRho = Math.max(...rhoArray);
    let minRho = Math.min(...rhoArray);

    let data = [];

    switch (plotSelection) {
        case 1:
            for (let i = 0; i < yn - 1; i++) {
                data.push((grid[IX(posx, i)].rho - minRho) / (maxRho - minRho));
            }
            graphCaption.textContent = `Density profile @ x = ${posx}`;
            graphXaxis.textContent = "Normalized Density (ρ/ρmax)";
            break;
        case 2:
            for (let i = 0; i < yn - 1; i++) {
                data.push((grid[IX(posx, i)].ux - minUx) / (maxUx - minUx));
            }

            graphCaption.textContent = `X velocity profile @ x = ${posx}`;
            graphXaxis.textContent = "Normalized X-Velocity (U/Umax)";
            break;
        case 3:
            for (let i = 0; i < yn - 1; i++) {
                data.push(((grid[IX(posx, i)].uy - minUy) / (maxUy - minUy)));
            }

            graphCaption.textContent = `Y-velocity profile @ x = ${posx}`;
            graphXaxis.textContent = "Normalized Y-Velocity (U/Umax)"; 
            break;
        default:
            for (let i = 2; i < yn - 2; i++) {
                let norm_speed = (curl(posx, i) - minVort) / (maxVort - minVort);
                data.push(norm_speed);
            }
            graphCaption.textContent = `Vorticity profile @ x = ${posx}`;
            graphXaxis.textContent = "Normalized Vorticity (ω/ωmax)";
            break;
    }

    // graph data 
    gctx.beginPath();
    gctx.moveTo(0, 0);
    for (let i = 0; i < data.length; i++) {
        gctx.lineTo(plotWidth * data[i], plotHeight * i / data.length);
    }
    gctx.lineTo(0, plotHeight);
    gctx.stroke();

    // draw graph borders 
    gctx.beginPath();
    gctx.moveTo(0, 0);
    gctx.lineTo(0, plotHeight);
    gctx.lineTo(plotWidth, plotHeight);
    gctx.lineTo(plotWidth, 0);
    gctx.lineTo(0, 0);
    gctx.stroke();


    // draw tick marks 
    for (let i = 0; i <= 1; i += 0.1) {
        gctx.beginPath();
        gctx.moveTo(plotWidth * i, plotHeight);
        gctx.lineTo(plotWidth * i, chartHeight * 0.9);
        gctx.closePath();
        gctx.stroke();
    }

    gctx.font='normal 20px Times New Roman';
    gctx.fillText("1", plotWidth, chartHeight);
    gctx.fillText("1", plotWidth, chartHeight);
    gctx.fillText("0", 0, chartHeight);

}



// ======================================================================================
// Main Loop 
function simulate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gctx.clearRect(0, 0, chart.width, chart.height);

    for (let i = 1; i < deltaT; i++) {
        collide();
        stream();
    }

    draw();
    graph(Number(xPos.value));
    requestAnimationFrame(simulate);
}

simulate();

// =============================================================
//Accessory functions

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
// =====================================================================================
// EVENT LISTENRES 

canvas.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let mouse = {
        i: Math.floor(e.offsetX / N),
        j: Math.floor(e.offsetY / N),
    };

    grid[IX(mouse.i, mouse.j)].isObstacle = true;
    console.log(mouse.i, mouse.j);
    // console.log(grid[IX(mouse.i, mouse.j)].fi[plot]);

});


for (let i = 0; i < plotOptionButtons.length; i++) {
    plotOptionButtons[i].addEventListener('change', function (event) {
        if (event.target.checked) {
            let plotOption = event.target.value;
            switch (plotOption) {
                case "density":
                    plotSelection = 1;
                    break;
                case "Ux":
                    plotSelection = 2;
                    break;
                case "Uy":
                    plotSelection = 3;
                    break;
                default:
                    plotSelection = 4;
                    break;
            }
        }
    });
}
