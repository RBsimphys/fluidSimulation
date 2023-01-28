'use strict';


const canv = document.getElementById("canvas1");
const ctx = canv.getContext("2d");
// canvas setup 
const dim = 400;
canv.width = dim;
canv.height = dim;
let ux0 = 0.1;
let uy0 = 0;
// flow grid setup
const timeStep = 1;
const N = 80;
const size = N * N;
const gridSpacing = Math.floor(dim / N);
const viscosity = 0.02; 	// kinematic viscosity coefficient in natural units
const omega = 1 / (3 * mu + 0.5);

// velocity directions,
const e = [
    [0, 0],                                  // N0
    [0, 1], [1, 0], [0, -1], [-1, 0],        // N, E, S, W
    [1, 1], [-1, 1], [-1, -1], [1, -1]       // NE, SE, SW, NW     
]

// weights 
const w = [
    4 / 9,                         // N0
    1 / 9, 1 / 9, 1 / 9, 1 / 9,    // N1, E2, S3, W4
    1 / 36, 1 / 36, 1 / 36, 1 / 36 // NE5, SE6, SW7, NW8
];


let meshGrid = new Array(size);
let tempGrid;

class Cell {
    constructor(index, rho, ux, uy, isbound, isinlet, isoutlet, isperiodic) {
        this.i = index;
        this.isbound = isbound;
        this.isinlet = isinlet;
        this.isoutlet = isoutlet;

        //macroscopic density and velocity
        this.rho = rho;
        this.ux = ux;
        this.uy = uy;

        // distributions
        this.Ni = [
            this.rho / 9, this.rho / 9, this.rho / 9, this.rho / 9,
            this.rho / 9, this.rho / 9, this.rho / 9, this.rho / 9,
            this.rho / 9];


        this.Neq = [];
        for (let i = 0; i < 9; i++) {
            this.Neq[i] = (1 + (3 * dotMatrix(e[i], [ux0, uy0])) +
                (9 / 2) * Math.pow(dotMatrix(e[i], [ux0, uy0]), 2) -
                (3 / 2) * ((ux0 * ux0) + (uy0 * uy0))) * (this.rho * w[i]);
        }

    }

    stream() {

        if (this.isbound) return;

        let Nth = this.i - N, Est = this.i + 1, Sth = this.i + N, Wst = this.i - 1;
        let NE = Nth + 1, SE = Sth + 1, SW = Sth - 1, NW = Nth - 1;

        // N E S W
        meshGrid[this.i].Ni[1] = tempGrid[Sth].isbound ? tempGrid[this.i].Ni[3] : tempGrid[Sth].Ni[1];
        meshGrid[this.i].Ni[2] = tempGrid[Wst].isbound ? tempGrid[this.i].Ni[4] : tempGrid[Wst].Ni[2];
        meshGrid[this.i].Ni[3] = tempGrid[Nth].isbound ? tempGrid[this.i].Ni[1] : tempGrid[Nth].Ni[3];
        meshGrid[this.i].Ni[4] = tempGrid[Est].isbound ? tempGrid[this.i].Ni[2] : tempGrid[Est].Ni[4];

        // NE SE SW NW 
        meshGrid[this.i].Ni[5] = tempGrid[SW].isbound ? tempGrid[this.i].Ni[7] : tempGrid[SW].Ni[5];
        meshGrid[this.i].Ni[6] = tempGrid[NW].isbound ? tempGrid[this.i].Ni[8] : tempGrid[NW].Ni[6];
        meshGrid[this.i].Ni[7] = tempGrid[NE].isbound ? tempGrid[this.i].Ni[5] : tempGrid[NE].Ni[7];
        meshGrid[this.i].Ni[8] = tempGrid[SE].isbound ? tempGrid[this.i].Ni[6] : tempGrid[SE].Ni[8];


    }

    collide() {

        if (this.isbound) return;

        // get new macroscopic variables based on relaxation 
        this.rho = sumMatrix(this.Ni);

        this.Ni.forEach((n, i) => {
            this.ux += e[i][0] * n;
            this.uy += e[i][1] * n;
        });

        this.ux /= this.rho;
        this.uy /= this.rho;

        for (let i = 0; i < 9; i++) {
            this.Ni[i] += omega * (this.Neq[i] - this.Ni[i]);
        }

    }

}
for (let i = 0; i < size; i++) {
    meshGrid[i] = new Cell(i, 1, ux0, 0, false);
}


function setBoundary() {
    for (let i = 0; i < N; i++) {
        meshGrid[IX(0, i)].isbound = true;
        meshGrid[IX(N - 1, i)].isbound = true;
        meshGrid[IX(i, N - 1)].isbound = true;
        meshGrid[IX(i, 0)].isbound = true;
    }


    for (let j = Math.floor(N / 2); j < Math.floor(N / 2 + 1); j++) {
        for (let i = Math.floor(N / 3); i < Math.floor(N / 3 + 20); i++) {
            meshGrid[IX(i, j)].isbound = true;
        }
    }


}



setBoundary();


function updateGrid() {
    for (let i = 0; i < size; i++) {
        meshGrid[i].collide();
    }

    tempGrid = _.cloneDeep(meshGrid);

    for (let i = 0; i < size; i++) {
        meshGrid[i].stream();
    }


}

function draw() {
    // get min and max speed of 

    let Umag = meshGrid.map(function (e) {
        return Math.sqrt(Math.pow(e.ux, 2) + Math.pow(e.uy, 2));
    });

    let maxUmag = Math.max(...Umag);

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            // let speed = Math.sqrt(Math.pow(meshGrid[IX(i, j)].ux, 2) + Math.pow(meshGrid[IX(i, j)].uy, 2));
            // let norm_speed = speed / maxUmag;

            // let c = color(norm_speed);

            if (meshGrid[IX(i, j)].isbound || meshGrid[IX(i, j)].isinlet) {
                ctx.fillStyle = `black`;
            }
            else {
                ctx.fillStyle = `rgb(${255*meshGrid[IX(i,j)].ux},55,0)`;
            }
            ctx.fillRect(i * gridSpacing, j * gridSpacing, gridSpacing, gridSpacing);
        }

    }
}

let colors = [];

for (let i = 10; i <= 200; i += 1) {
    colors.push("hsla(" + i + ", 100%, 50%, 100%)");
}

let color = function (val) {
    // if (val <= 0.1) return colors[0];
    var colorIndex = Math.round(val * (colors.length - 1));
    return colors[colorIndex];
}



function mainloop() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGrid();
    draw();
    requestAnimationFrame(mainloop);
}
// mainloop(); 
mainloop();

function multiplyMatrices(a, b) {
    return a.map((x, i) => { x * b[i] });
}

function sumMatrix(a) {
    return a.reduce((a, b) => a + b)

}
function scaleMatrix(scalar, array) {
    return array.map((x) => x * scalar);
}

function dotMatrix(a, b) {
    return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function IX(i, j) {
    return i + N * j;
}



canv.addEventListener('mousemove', (e) => {
    e.preventDefault();

    let mouse = {
        i: Math.floor(e.offsetX / gridSpacing),
        j: Math.floor(e.offsetY / gridSpacing),
    };
    // check for boundaries
    if (mouse.i < 0) {
        mouse.i = 1;
    }
    if (mouse.i > N - 1) {
        mouse.i = N - 2;
    }
    if (mouse.j < 0) {
        mouse.j = 1;
    }
    if (mouse.j > N - 1) {
        mouse.j = N - 2;
    }

    meshGrid[IX(mouse.i, mouse.j)].isbound = true;
    // console.log(meshGrid[IX(mouse.i, mouse.j)].ux, meshGrid[IX(mouse.i, mouse.j)].uy);

});




