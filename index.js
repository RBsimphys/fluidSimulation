// ===================================================================================
// SIMULATION CANVAS 
const simulationCanvas = document.getElementById("simulationCanvas");
const ctx = simulationCanvas.getContext("2d");
simulationCanvas.width = 600;
simulationCanvas.height = 240;
let N = 6;
let NX = simulationCanvas.width / N;
let NY = simulationCanvas.height / N;
let animating = true;

// ======================================================================================
// GRID SETUP STUFF  

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

// obstacle measurements 
const obsRadius = NY / 9;
const obsXpos = NX * 0.1;
const obsYpos = NY * 0.5;
const startAngle = 0;
const endAngle = Math.PI * 2;


const Re = document.getElementById("reynoldsInput");
const reynoldsDisplay = document.getElementById("reynoldsDisplay");
const deltaT = 5;                             //time step
let ux0 = 0.2;                                //initial x velocity 
let uy0 = 0;                                  //initial y velocity 
let rho = 1;                                  //initial density 
let mu = ux0 * obsRadius / Re.value;	                          //viscosity
let omega = 1 / (3 * mu + 0.5);             //relaxation parameter


const Cell = (rho, ux, uy, isObstacle) => {
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


let grid = new Array(NX * NY);

for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NY; j++) {
        grid[IX(i, j)] = Cell(1, 0, 0, false);
    }
}



// ======================================================================================
// PHYSICS STUFF

function setEquilibrium(ux, uy, rho) {
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

function initialize() {
    for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
            grid[IX(i, j)].fi = setEquilibrium(ux0, uy0, rho);
        }
    }
}


// collision step 
function collide() {
    for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
            let index = IX(i, j);
            grid[index].rho = sumMatrix(grid[index].fi);
            grid[index].ux = 0;
            grid[index].uy = 0;

            for (let n = 0; n < 9; n++) {
                grid[index].ux += (e[n][0] * grid[index].fi[n]) / grid[index].rho;
                grid[index].uy += (e[n][1] * grid[index].fi[n]) / grid[index].rho;
            }

            let feq = setEquilibrium(grid[index].ux, grid[index].uy, grid[index].rho);
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
    for (let x = NX - 2; x > 0; x--) {
        for (let y = NY - 2; y > 0; y--) {
            grid[IX(x, y)].fi[1] = grid[IX(x, y - 1)].fi[1];
            grid[IX(x, y)].fi[2] = grid[IX(x - 1, y - 1)].fi[2];
            grid[IX(x, y)].fi[3] = grid[IX(x - 1, y)].fi[3];
            grid[IX(x, y)].fi[4] = grid[IX(x - 1, y + 1)].fi[4];
        }
        for (let y = 1; y < NY - 1; y++) {
            grid[IX(x, y)].fi[5] = grid[IX(x, y + 1)].fi[5];
        }
    }

    for (let x = 1; x < NX - 2; x++) {
        for (let y = NY - 2; y > 1; y--) {
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
// DRAW STUFF  

// plot options 
const plotOptionButtons = document.querySelectorAll('input[name="plotOption"]');
let plotSelection = "Vorticity";

// chroma js color maps
let colorUx = chroma.scale('OrRd').padding([0.2, 0]);
let colorUy = chroma.cubehelix().hue([1, 0]);
let colorVorticity = chroma.cubehelix().start(300).rotations(-0.5).gamma(0.8).lightness([0.1, 1]);
let colorRho = chroma.cubehelix().rotations(0.5);

// psychedelic mode button 
const psychedelicMode = document.getElementById("psychedelicMode");

let psychedelicLerp = chroma.cubehelix()
    .start(0)
    .rotations(5)
    .hue(2)
    .gamma(0.68)
    .lightness([0.58, 0.77])

// draw fluid simulation 
function draw(posx) {
    let ext = getExtremum();
    let c;
    // color grid 
    for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
            let index = i + j * NX;
            let normalizedValue = 0;
            switch (plotSelection) {
                case "Density":
                    normalizedValue = (grid[index].rho - ext.rho.min) / (ext.rho.max - ext.rho.min);
                    c = colorRho(normalizedValue);
                    break;
                case "Ux":
                    normalizedValue = (grid[index].ux - ext.Ux.min) / (ext.Ux.max - ext.Ux.min);
                    c = colorUx(normalizedValue);
                    break;
                case "Uy":
                    normalizedValue = (grid[index].uy - ext.Uy.min) / (ext.Uy.max - ext.Uy.min);
                    c = colorUy(normalizedValue);
                    break;
                default:
                    normalizedValue = (curl(i, j) - ext.vorticity.min) / (ext.vorticity.max - ext.vorticity.min);
                    c = colorVorticity(normalizedValue);
                    break;
            }
            if (psychedelicMode.checked) {
                c = psychedelicLerp(normalizedValue);
            }
            ctx.fillStyle = c;
            // color obstacles 
            if (grid[index].isObstacle) {
                ctx.fillStyle = 'rgba(0, 0, 0, 100%)';
            }
            ctx.fillRect(i * N, j * N, N, N);
            // color graph position slider 
            if (i == posx) {
                ctx.fillStyle = 'rgba(255, 205, 0, 50%)';
                ctx.fillRect(i * N, j * N, N, N);
            }
        }

    }
}

// color legend for fluid simulation 
const colorLegend = document.getElementById("colorMapLegend");
const clctx = colorLegend.getContext("2d");
colorLegend.width = 50;
colorLegend.height = 120;
let legendWidth = 20;

function setColorLegend() {
    clctx.fillStyle = "black";
    clctx.font = "10px Arial";
    clctx.fillText("0", 23, 10);
    clctx.fillText("1", 23, colorLegend.height - 5);


    switch (plotSelection) {
        case "Density":
            for (let n = 0; n < 1; n += 0.1) {
                clctx.fillStyle = colorRho(n);
                clctx.fillRect(0, colorLegend.height * n, legendWidth, colorLegend.height);
            }
            break;
        case "Ux":
            for (let n = 0; n < 1; n += 0.1) {
                clctx.fillStyle = colorUx(n);
                clctx.fillRect(0, colorLegend.height * n, legendWidth, colorLegend.height);
            }
            break;
        case "Uy":
            for (let n = 0; n < 1; n += 0.1) {
                clctx.fillStyle = colorUy(n);
                clctx.fillRect(0, colorLegend.height * n, legendWidth, colorLegend.height);
            }
            break;
        default:
            for (let n = 0; n < 1; n += 0.1) {
                clctx.fillStyle = colorVorticity(n);
                clctx.fillRect(0, colorLegend.height * n, legendWidth, colorLegend.height);
            }
            break;
    }
    if (psychedelicMode.checked) {
        for (let n = 0; n < 1; n += 0.1) {
            clctx.fillStyle = psychedelicLerp(n);
            clctx.fillRect(0, colorLegend.height * n, legendWidth, colorLegend.height);
        }
    }
    // // draw graph borders 
    // clctx.beginPath();
    // clctx.moveTo(0, 0);
    // clctx.lineTo(0, colorLegend.height);
    // clctx.lineTo(legendWidth, colorLegend.height);
    // clctx.lineTo(legendWidth, 0);
    // clctx.lineTo(0, 0);
    // clctx.stroke();
}

setColorLegend();

// plot graphs ------------------------------------------------------------------------

// graph profiles 
const profilePlot = document.getElementById("profilePlot");
const gctx = profilePlot.getContext("2d");

const graphCaption = document.getElementById("profilePlotCaption");
const xPos = document.getElementById("xPos");
const graphXaxis = document.getElementById("xLabel");
const plotSelectionLegend = document.getElementById("plotSelectionLegend");

let trackHistory = document.getElementById("trackHistory");

let plotWidth = 400;
let plotHeight = 200;
let buffer = 30;
let chartWidth = plotWidth + buffer;
let chartHeight = plotHeight + buffer;
profilePlot.width = chartWidth;
profilePlot.height = chartHeight;


function plotProfile(posx) {
    let ext = getExtremum(); //get absolute mins and maxes to normalize values 
    let data = [0];
    switch (plotSelection) {
        case "Density":
            for (let i = 1; i < NY - 1; i++) {
                data.push((grid[IX(posx, i)].rho - ext.rho.min) / (ext.rho.max - ext.rho.min));
            }
            graphCaption.textContent = `Density profile @ x = ${posx}`;
            graphXaxis.innerHTML = "Normalized Density (ρ<sub>i</sub> / ρ<sub>max</sub>)";
            plotSelectionLegend.textContent = "Plot: Density"
            break;
        case "Ux":
            for (let i = 1; i < NY - 1; i++) {
                data.push((grid[IX(posx, i)].ux - ext.Ux.min) / (ext.Ux.max - ext.Ux.min));

            }
            graphCaption.textContent = `X velocity profile @ x = ${posx}`;
            graphXaxis.innerHTML = "Normalized X-Velocity (U<sub>i</sub> / U<sub>max</sub>)";
            plotSelectionLegend.textContent = "Plot: X-Velocity"
            break;
        case "Uy":
            for (let i = 1; i < NY - 1; i++) {
                data.push(((grid[IX(posx, i)].uy - ext.Uy.min) / (ext.Uy.max - ext.Uy.min)));
            }

            graphCaption.textContent = `Y-velocity profile @ x = ${posx}`;
            graphXaxis.innerHTML = "Normalized Y-Velocity (U<sub>i</sub> / U<sub>max</sub>)";
            plotSelectionLegend.textContent = "Plot: Y-Velocity"

            break;
        default:
            for (let i = 2; i < NY - 2; i++) {
                let norm_speed = (curl(posx, i) - ext.vorticity.min) / (ext.vorticity.max - ext.vorticity.min);
                data.push(norm_speed);
            }
            graphCaption.textContent = `Vorticity profile @ x = ${posx}`;
            graphXaxis.innerHTML = "Normalized Vorticity (ω<sub>i</sub> / ω<sub>max</sub>)";
            plotSelectionLegend.textContent = "Plot: Vorticity"
            break;
    }

    data.push(0);
    // graph data 
    gctx.beginPath();
    gctx.moveTo(0, 0);
    for (let i = 0; i < data.length; i++) {
        gctx.lineTo(plotWidth * data[i], plotHeight * i / data.length);
    }
    gctx.stroke();

    gctx.strokeStyle = "rgba(75,75,75,100%)";
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

    gctx.font = 'normal 20px Times New Roman';
    gctx.fillText("1", plotWidth - 10, chartHeight);
    gctx.fillText("0", 0, chartHeight);

}


// plot the histogram 

const histogramPlot = document.getElementById("histogramPlot");
const hctx = histogramPlot.getContext("2d");

let histogramWidth = 400;
let histogramHeight = 100;
histogramPlot.width = histogramWidth;
histogramPlot.height = histogramHeight;

const histogramCaption = document.getElementById("histogramCaption");
const xHistogramLabel = document.getElementById("xHistogramLabel");

function plotHistogram() {
    let data = [];
    switch (plotSelection) {
        case "Density":
            for (let i = 0; i < NX; i++) {
                for (let j = 0; j < NY; j++) {
                    data.push((grid[IX(i, j)].rho));
                }
            }
            histogramCaption.textContent = `Density histogram`;
            xHistogramLabel.textContent = "Density";
            break;

        case "Ux":
            for (let i = 0; i < NX; i++) {
                for (let j = 0; j < NY; j++) {
                    data.push((grid[IX(i, j)].ux));
                }
            }
            histogramCaption.textContent = `X velocity histogram`;
            xHistogramLabel.textContent = "X-Velocity";
            break;
        case "Uy":
            for (let i = 0; i < NX; i++) {
                for (let j = 0; j < NY; j++) {
                    data.push((grid[IX(i, j)].uy));
                }
            }
            histogramCaption.textContent = `Y-velocity profile histogram`;
            xHistogramLabel.textContent = "Y-Velocity";


            break;
        default:
            for (let i = 2; i < NX - 2; i++) {
                for (let j = 2; j < NY - 2; j++) {
                    data.push((curl(i, j)));
                }
            }
            histogramCaption.textContent = `Vorticity profile histogram`;
            xHistogramLabel.textContent = "Vorticity";
            break;
    }



    let max = Math.max(...data);
    let min = Math.min(...data);

    let norm_data = data.map(x => ((x - min) / (max - min))).sort((a, b) => a - b);
    // let norm_data = [0, 0.1, 0.1, 0.2, 0.3, 0.4, 0.6];
    let numBins = 100;
    let bins = [];
    let range = [];

    for (let i = 1; i <= numBins; i++) {
        range.push([(i - 1) / numBins, i / numBins]);
        bins.push(countInRange(norm_data, i / numBins, (i - 1) / numBins));
    }
    // graph data 
    // console.log(range, bins);
    for (let i = 0; i < numBins; i++) {
        hctx.fillRect(histogramWidth * i / numBins, histogramHeight,
            histogramWidth / numBins, -histogramHeight * 0.9 * (bins[i] - Math.min(...bins)) / (Math.max(...bins) - Math.min(...bins)));
    }
    hctx.beginPath();
    hctx.moveTo(0, 0);
    hctx.lineTo(0, histogramHeight);
    hctx.lineTo(histogramWidth, histogramHeight);
    hctx.lineTo(histogramWidth, 0);
    hctx.lineTo(0, 0);
    hctx.stroke();


}

let countInRange = function (array, h, l) {
    let count = 0;
    for (let i = 0; i < array.length; i++) {
        if (array[i] > h) return count;
        if (array[i] <= h && array[i] >= l) count++;
    }

    return count;
}

// ======================================================================================
// ANIMATION LOOP 


initialize();

function simulate() {
    hctx.clearRect(0, 0, histogramPlot.width, histogramPlot.height);

    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);

    switch (plotSelection) {
        case "Density":
            gctx.strokeStyle = `rgba(${160 * xPos.value / NX}, 121, 75, 20%)`;
            break;
        case "Ux":
            gctx.strokeStyle = `rgba(${241 * xPos.value / NX}, 109, 75, 20%)`;
            break;
        case "Uy":
            gctx.strokeStyle = `rgba(${141 * xPos.value / NX}, 124, 100, 20%)`;
            break;
        default:
            gctx.strokeStyle = `rgba(${160 * xPos.value / NX}, 164, 209, 20%)`;
            break;
    }
    if (!trackHistory.checked) {
        gctx.strokeStyle = "rgb(0,0,0)";
        gctx.clearRect(0, 0, profilePlot.width, profilePlot.height);
    }

    if (animating) {
        mu = ux0 * obsRadius / Re.value;            //update viscosity
        omega = 1 / (3 * mu + 0.5);                 //update relaxation parameter
        reynoldsDisplay.textContent = `Re: ${Re.value}`

        for (let i = 1; i < deltaT; i++) {
            collide();
            stream();
        }
    }
    draw(Number(xPos.value));
    plotProfile(Number(xPos.value));
    plotHistogram();
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
    return i + NX * j;
}

function curl(i, j) {
    return (grid[IX(i, j + 1)].ux - grid[IX(i, j - 1)].ux) - (grid[IX(i - 1, j)].uy - grid[IX(i - 1, j)].uy);
}


function getExtremum() {
    let vorticity = [];

    for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NY - 1; j++) {
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

    return {
        rho: { max: maxRho, min: minRho },
        Uy: { max: maxUy, min: minUy },
        Ux: { max: maxUx, min: minUx },
        vorticity: { max: maxVort, min: minVort },
    }
}

// =====================================================================================
// EVENT LISTENRES 

simulationCanvas.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let mouse = {
        i: Math.floor(e.offsetX / N),
        j: Math.floor(e.offsetY / N),
    };

    grid[IX(mouse.i, mouse.j)].isObstacle = true;
    // console.log(mouse.i, mouse.j);
    // console.log(grid[IX(mouse.i, mouse.j)].fi[plot]);

});


for (let i = 0; i < plotOptionButtons.length; i++) {
    plotOptionButtons[i].addEventListener('change', function (event) {
        if (event.target.checked) {
            plotSelection = event.target.value;
            gctx.clearRect(0, 0, profilePlot.width, profilePlot.height);
            setColorLegend();
        }
    });
}

const playpausebtn = document.getElementById("playpausebtn");
const pauseIcon = document.getElementById("pauseIcon");
const playIcon = document.getElementById("playIcon");

playpausebtn.addEventListener('click', updatePausePlayButtons);

function updatePausePlayButtons() {
    if (animating === false) {
        pauseIcon.style.display = "block";
        playIcon.style.display = "none"
        animating = true;
    } else {
        pauseIcon.style.display = "none";
        playIcon.style.display = "block"
        animating = false;
    }
}

const replay = document.getElementById("replay");

replay.addEventListener('click', resetSimulation);

function resetSimulation() {


    for (let i = 0; i < NX; i++) {
        for (let j = 0; j < NY; j++) {
            grid[IX(i, j)].fi = setEquilibrium(ux0, uy0, rho);
            grid[IX(i, j)].isObstacle = false;
        }
    }
    setObstacle(obsRadius, obsXpos, obsYpos, startAngle, endAngle);

    hctx.clearRect(0, 0, histogramPlot.width, histogramPlot.height);

    gctx.clearRect(0, 0, profilePlot.width, profilePlot.height);
}
