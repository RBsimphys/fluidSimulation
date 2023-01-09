const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
// canvas setup 
const dim = 500;
canvas.width = dim;
canvas.height = dim;

// flow grid setup
const N = 50;
const size = N * N;
const gridSpacing = dim / N;
const viscosity = 1 / 4; 	// kinematic viscosity coefficient in natural units
const omega = 1 / (3 * viscosity + 0.5);

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

class Cell {
    constructor(index, rho, ux, uy, isbound, isinlet) {
        this.i = index;
        this.isbound = isbound;
        this.isinlet = isinlet;

        //macroscopic density and velocity
        this.rho = rho;
        this.ux = ux;
        this.uy = uy;

        // distributions
        this.Ni = [
            this.rho / 9, this.rho / 9, this.rho / 9, this.rho / 9,
            this.rho / 9, this.rho / 9, this.rho / 9, this.rho / 9,
            this.rho / 9];
        this.Neq;


    }

    get equilibrium() {

        let m = new Array(9);
        for (let i = 0; i < 9; i++) {
            m[i] = 1 + (3 * dotMatrix(e[i], [this.ux, this.uy])) +
                (9 / 2) * Math.pow(dotMatrix(e[i], [this.ux, this.uy]), 2) -
                (3 / 2) * ((this.ux * this.ux) + (this.uy * this.uy));
        }
        let weightedRho = [];

        for (let i = 0; i < 9; i++) {
            weightedRho[i] = this.rho * w[i];
        }

        let n = [];
        for (let i = 0; i < 9; i++) {
            n[i] = m[i] * weightedRho[i];
        }
        return [...n]

    }

    stream() {
        if (this.isbound) return;
        let Nth = this.i - N, Est = this.i + 1, Sth = this.i + N, Wst = this.i - 1;
        let NE = Nth + 1, SE = Sth + 1, SW = Sth - 1, NW = Nth - 1;
        // N E S W
        meshGrid[this.i].Ni[1] = tempGrid[Sth].isbound ? tempGrid[this.i].Ni[1] : tempGrid[Sth].Ni[1];
        meshGrid[this.i].Ni[2] = tempGrid[Wst].isbound ? tempGrid[this.i].Ni[2] : tempGrid[Wst].Ni[2];
        meshGrid[this.i].Ni[3] = tempGrid[Nth].isbound ? tempGrid[this.i].Ni[3] : tempGrid[Nth].Ni[3];
        meshGrid[this.i].Ni[4] = tempGrid[Est].isbound ? tempGrid[this.i].Ni[4] : tempGrid[Est].Ni[4];

        // NE SE SW NW 
        meshGrid[this.i].Ni[5] = tempGrid[SW].isbound ? tempGrid[this.i].Ni[5] : tempGrid[SW].Ni[5];
        meshGrid[this.i].Ni[6] = tempGrid[NW].isbound ? tempGrid[this.i].Ni[6] : tempGrid[NW].Ni[6];
        meshGrid[this.i].Ni[7] = tempGrid[NE].isbound ? tempGrid[this.i].Ni[7] : tempGrid[NE].Ni[7];
        meshGrid[this.i].Ni[8] = tempGrid[SE].isbound ? tempGrid[this.i].Ni[8] : tempGrid[SE].Ni[8];

    }

    collide() {
        this.Neq = this.equilibrium;

        for (let i = 0; i < 9; i++) {
            this.Ni[i] += omega * (this.Neq[i] - this.Ni[i]);
        }

        // get new macroscopic variables based on relaxation 
        this.rho = sumMatrix(this.Ni);
        this.ux = 0;
        this.uy = 0;

        this.Ni.forEach((n, i) => {
            this.ux += e[i][0] * n;
            this.uy += e[i][1] * n;
        });
        if (this.rho !== 0) {
            this.ux /= this.rho;
            this.uy /= this.rho;
        }
    }

}

for (let i = 0; i < size; i++) {
    meshGrid[i] = new Cell(i, 1, 0, 0, false, false);
}


function setBoundary() {
    for (let i = 0; i < N; i++) {
        meshGrid[IX(0, i)].isbound = true;
        meshGrid[IX(N - 1, i)].isbound = true;
        meshGrid[IX(i, N - 1)].isbound = true;
        meshGrid[IX(i, 0)].isbound = true;
    }

    for (let i = Math.floor(N / 4); i < Math.floor(N / 2); i++) {
        meshGrid[IX(i, N/5)].isbound = true;
    }
}


function initialState() {
    for (let i = 3; i < N - 3; i++) {
        for (let j = 1; j < 2; j++) {
            meshGrid[IX(i, j)].uy = 0.3;
        }
    }
}

setBoundary();

let tempGrid = [...meshGrid];

function updateGrid() {
    for (let i = 0; i < size; i++) {
        meshGrid[i].collide();
    }

    for (let i = 0; i < size; i++) {
        meshGrid[i].stream();
    }

    tempGrid = [...meshGrid];
}

function draw() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let color;
            let speed;
            if (meshGrid[IX(i, j)].isbound) {
                ctx.fillStyle = `rgb(50, 50, 55)`;
            } else {
                color = Math.floor(255 - 700 * Math.sqrt((meshGrid[IX(i, j)].ux * meshGrid[IX(i, j)].ux) + (meshGrid[IX(i, j)].uy * meshGrid[IX(i, j)].uy)));
                ctx.fillStyle = `rgb(255, 255, ${color})`;
            }
            ctx.fillRect(i * gridSpacing, j * gridSpacing, gridSpacing, gridSpacing);
        }
    }
}

function mainloop() {
    initialState();
    updateGrid();
    draw();
    requestAnimationFrame(mainloop);
}
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



canvas.addEventListener('mousemove', (e) => {
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

    meshGrid[IX(mouse.i, mouse.j)].ux = 1;
    // meshGrid[IX(mouse.i, mouse.j)].uy = 10;
    // console.log(meshGrid[IX(mouse.i, mouse.j)].Ni[1], meshGrid[IX(mouse.i+1, mouse.j)].Ni[1]); 

});




