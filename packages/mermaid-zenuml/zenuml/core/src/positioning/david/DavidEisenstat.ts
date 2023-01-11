interface IDual {
  position: number;
  velocity: number;
}

// Dual numbers represent linear functions of time.
function Dual(p: number, v: number) {
  return { position: p, velocity: v };
}

// Adds dual numbers x and y.
function dualPlus(x: IDual, y: IDual) {
  return Dual(x.position + y.position, x.velocity + y.velocity);
}

const epsilon = Math.sqrt(Number.EPSILON);

// Compares dual numbers x and y by their position at a time infinitesimally
// after now.
function dualLessThan(x: IDual, y: IDual) {
  let d = x.position - y.position;
  return d < -epsilon || (Math.abs(d) <= epsilon && x.velocity < y.velocity);
}

// Tracks delta, the length of time for which every pair of arguments to
// .dualLessThan() maintains the present relation.
function DeltaTracker() {
  return {
    delta: Infinity,
    dualLessThan: function (x: IDual, y: IDual) {
      let lessThan = dualLessThan(x, y);
      if (lessThan) {
        [x, y] = [y, x];
      }
      if (x.velocity < y.velocity) {
        this.delta = Math.min(this.delta, (x.position - y.position) / (y.velocity - x.velocity));
      }
      return lessThan;
    },
  };
}

// Converts the adjacency matrix to an adjacency list representation.
function graphFromMatrix(n: number, matrix: Array<Array<number>>) {
  let graph = Array<any>();
  for (let j = 0; j < n; j++) {
    graph.push([]);
    for (let i = 0; i < j; i++) {
      if (matrix[i][j] > 0) {
        graph[j].push({ i: i, length: Dual(matrix[i][j], 0) });
      }
    }
  }
  return graph;
}

// Essentially the usual algorithm for longest path, but tracks delta.
function longestPathTable(graph: any, gaps: Array<any>): any {
  let tracker = DeltaTracker();
  let maximum = Dual(0, 0);
  let table = [];
  for (let j = 0; j < graph.length; j++) {
    let argument = null;
    if (j > 0) {
      maximum = dualPlus(maximum, gaps[j - 1]);
    }
    for (let edge of graph[j]) {
      let x = dualPlus(table[edge.i].maximum, edge.length);
      if (tracker.dualLessThan(maximum, x)) {
        argument = edge.i;
        maximum = x;
      }
    }
    table.push({ argument: argument, maximum: maximum });
  }
  return [tracker.delta, table];
}

// Essentially the usual algorithm for decoding the longest path from the
// dynamic program table.
function freezeCriticalGaps(table: any, graph: any, gaps: Array<any>) {
  let j = table.length - 1;
  while (j > 0) {
    let argument = table[j].argument;
    if (argument !== null) {
      j = argument;
    } else {
      j--;
      gaps[j].velocity = 0;
    }
  }
}

// Changes the time from now to now + delta.
function advanceGaps(gaps: Array<IDual>, delta: number) {
  for (let i = 0; i < gaps.length; i++) {
    gaps[i].position += gaps[i].velocity * delta;
  }
}

// Extracts the final result from the dynamic program table.
function positionsFromTable(table: any) {
  let positions = [];
  for (let entry of table) {
    positions.push(entry.maximum.position);
  }
  return positions;
}

// Entry point for the layout algorithm.
function find_optimal(matrix: Array<Array<number>>) {
  const n = matrix.length;
  let graph = graphFromMatrix(n, matrix);
  let gaps = [];
  for (let j = 1; j < n; j++) {
    gaps.push(Dual(0, 1));
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let [delta, table] = longestPathTable(graph, gaps);
    if (delta == Infinity) {
      return positionsFromTable(table);
    }
    if (table[n - 1].maximum.velocity > 0) {
      freezeCriticalGaps(table, graph, gaps);
    } else {
      advanceGaps(gaps, delta);
    }
  }
}

export { find_optimal };
