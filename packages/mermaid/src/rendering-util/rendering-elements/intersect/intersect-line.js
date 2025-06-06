/**
 * Returns the point at which two lines, p and q, intersect or returns undefined if they do not intersect.
 */
function intersectLine(p1, p2, q1, q2) {
  {
    // Algorithm from J. Avro, (ed.) Graphics Gems, No 2, Morgan Kaufmann, 1994,
    // p7 and p473.

    // Compute a1, b1, c1, where line joining points 1 and 2 is F(x,y) = a1 x +
    // b1 y + c1 = 0.
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = p2.x * p1.y - p1.x * p2.y;

    // Compute r3 and r4.
    const r3 = a1 * q1.x + b1 * q1.y + c1;
    const r4 = a1 * q2.x + b1 * q2.y + c1;

    const epsilon = 1e-6;

    // Check signs of r3 and r4. If both point 3 and point 4 lie on
    // same side of line 1, the line segments do not intersect.
    if (r3 !== 0 && r4 !== 0 && sameSign(r3, r4)) {
      return /*DON'T_INTERSECT*/;
    }

    // Compute a2, b2, c2 where line joining points 3 and 4 is G(x,y) = a2 x + b2 y + c2 = 0
    const a2 = q2.y - q1.y;
    const b2 = q1.x - q2.x;
    const c2 = q2.x * q1.y - q1.x * q2.y;

    // Compute r1 and r2
    const r1 = a2 * p1.x + b2 * p1.y + c2;
    const r2 = a2 * p2.x + b2 * p2.y + c2;

    // Check signs of r1 and r2. If both point 1 and point 2 lie
    // on same side of second line segment, the line segments do
    // not intersect.
    if (Math.abs(r1) < epsilon && Math.abs(r2) < epsilon && sameSign(r1, r2)) {
      return /*DON'T_INTERSECT*/;
    }

    // Line segments intersect: compute intersection point.
    const denom = a1 * b2 - a2 * b1;
    if (denom === 0) {
      return /*COLLINEAR*/;
    }

    const offset = Math.abs(denom / 2);

    // The denom/2 is to get rounding instead of truncating. It
    // is added or subtracted to the numerator, depending upon the
    // sign of the numerator.
    let num = b1 * c2 - b2 * c1;
    const x = num < 0 ? (num - offset) / denom : (num + offset) / denom;

    num = a2 * c1 - a1 * c2;
    const y = num < 0 ? (num - offset) / denom : (num + offset) / denom;
    // console.log(
    //   'APA30 intersectLine intersection',
    //   '\np1: (',
    //   p1.x,
    //   p1.y,
    //   ')',
    //   '\np2: (',
    //   p2.x,
    //   p2.y,
    //   ')',
    //   '\nq1: (',
    //   q1.x,
    //   q1.y,
    //   ')',
    //   '\np1: (',
    //   q2.x,
    //   q2.y,
    //   ')',
    //   'offset:',
    //   offset,
    //   '\nintersection: (',
    //   x,
    //   y,
    //   ')'
    // );
    return { x: x, y: y };
  }
}

function sameSign(r1, r2) {
  return r1 * r2 > 0;
}

export default intersectLine;
