let NX = simulationCanvas.width / N;
let NY = simulationCanvas.height / N;

let N = 5;


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

export {stream, collide, initialize, setEquilibrium}