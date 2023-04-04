// const simulationCanvas = document.getElementById("simulationCanvas");
// const ctx = simulationCanvas.getContext("2d");
// simulationCanvas.width = 600;
// simulationCanvas.height = 240;
// let N = 5;
// let NX = simulationCanvas.width / N;
// let NY = simulationCanvas.height / N;
// let animating = true;

// // ======================================================================================
// // GRID SETUP STUFF  
// // velocity directions,
// const e = [
//     [0, 0],                                   // 0
//     [0, 1], [1, 1], [1, 0], [1, -1],          // N1, NE2, E3, SE4
//     [0, -1], [-1, -1], [-1, 0], [-1, 1]       // S5, SW6, W7, NW8     
// ];
// // weights 
// const w = [
//     4 / 9,                                    // N0
//     1 / 9, 1 / 36, 1 / 9, 1 / 36,             // N1, NE2, E3, SE4
//     1 / 9, 1 / 36, 1 / 9, 1 / 36              // S5, SW6, W7, NW8
// ];

// // obstacle measurements 
// let obsRadius = NY * 0.1;
// let obsXpos = NX * 0.1;
// let obsYpos = NY * 0.5;
// const startAngle = 0;
// const endAngle = Math.PI * 2;


// const Re = document.getElementById("reynoldsInput");
// const reynoldsDisplay = document.getElementById("reynoldsDisplay");
// let deltaT = 6;                             //time step
// let timeStep = 0;
// let ux0 = 0.2;                                //initial x velocity 
// let uy0 = 0;                                  //initial y velocity 
// let rho = 1;                                  //initial density 
// let mu = ux0 * obsRadius / Re.value;	                          //viscosity
// let omega = 1 / (3 * mu + 0.5);             //relaxation parameter

// const Cell = (rho, ux, uy, isObstacle) => {
//     let fi = new Array(9);
//     let feq = new Array(9);
//     return {
//         rho,
//         ux,
//         uy,
//         fi,
//         feq,
//         isObstacle,
//     }
// }

// let grid = new Array(NX * NY);

// function createGrid() {
//     for (let i = 0; i < NX; i++) {
//         for (let j = 0; j < NY; j++) {
//             grid[IX(i, j)] = Cell(1, 0, 0, false);
//         }
//     }
// }

// createGrid()


// function setEquilibrium(ux, uy, rho) {
//     let f = [];
//     for (let n = 0; n < 9; n++) {
//         let a = 3 * (e[n][0] * ux + e[n][1] * uy);
//         let b = 4.5 * Math.pow((e[n][0] * ux + e[n][1] * uy), 2);
//         let c = 1.5 * (Math.pow(ux, 2) + Math.pow(uy, 2));
//         f[n] = w[n] * rho * (1 + a + b - c);
//     }
//     return f;
// }


// function initialize() {
//     for (let i = 0; i < NX; i++) {
//         for (let j = 0; j < NY; j++) {
//             grid[IX(i, j)].fi = setEquilibrium(ux0, uy0, rho);
//         }
//     }
// }
// // collision step 
// function collide() {
//     for (let i = 0; i < NX; i++) {
//         for (let j = 0; j < NY; j++) {
//             let index = IX(i, j);
//             grid[index].rho = sumMatrix(grid[index].fi);
//             grid[index].ux = 0;
//             grid[index].uy = 0;

//             for (let n = 0; n < 9; n++) {
//                 grid[index].ux += (e[n][0] * grid[index].fi[n]) / grid[index].rho;
//                 grid[index].uy += (e[n][1] * grid[index].fi[n]) / grid[index].rho;
//             }

//             let feq = setEquilibrium(grid[index].ux, grid[index].uy, grid[index].rho);
//             for (let n = 0; n < 9; n++) {
//                 grid[index].fi[n] += omega * (feq[n] - grid[index].fi[n]);
//             }
//         }
//     }
// }
// //  in-place stream function, with bounce back boundary condition  
// let fbounce = [0, 5, 6, 7, 8, 1, 2, 3, 4];
// function stream() {
//     // N NE E SE S        
//     for (let x = NX - 2; x > 0; x--) {
//         for (let y = NY - 2; y > 0; y--) {
//             grid[IX(x, y)].fi[1] = grid[IX(x, y - 1)].fi[1];
//             grid[IX(x, y)].fi[2] = grid[IX(x - 1, y - 1)].fi[2];
//             grid[IX(x, y)].fi[3] = grid[IX(x - 1, y)].fi[3];
//             grid[IX(x, y)].fi[4] = grid[IX(x - 1, y + 1)].fi[4];
//         }
//         for (let y = 1; y < NY - 1; y++) {
//             grid[IX(x, y)].fi[5] = grid[IX(x, y + 1)].fi[5];
//         }
//     }

//     for (let x = 1; x < NX - 2; x++) {
//         for (let y = NY - 2; y > 1; y--) {
//             // SW W NW
//             grid[IX(x, y)].fi[6] = grid[IX(x + 1, y + 1)].fi[6];
//             grid[IX(x, y)].fi[7] = grid[IX(x + 1, y)].fi[7];
//             grid[IX(x, y)].fi[8] = grid[IX(x + 1, y - 1)].fi[8];
//             // handle obstacles 
//             if (grid[IX(x, y)].isObstacle) {
//                 for (let n = 1; n < 9; n++) {
//                     grid[IX(x, y)].fi[n] = grid[IX(x, y)].fi[fbounce[n]];
//                 }
//             }
//         }
//     }
// }


// function dotMatrix(a, b) {
//     return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
// }

// function sumMatrix(a) {
//     return a.reduce((a, b) => a + b)
// }

// function IX(i, j) {
//     return i + NX * j;
// }

// export {stream, collide, initialize, setEquilibrium}
