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

    // The Graphics Gems original added `denom / 2` to the numerator here so
    // that an INTEGER division would round rather than truncate. JavaScript
    // division does neither, so that term was not a rounding correction at all:
    // `(num + denom / 2) / denom` is `num / denom + 0.5`, a constant half-unit
    // displacement of every intersection, on both axes.
    //
    // Half a pixel is invisible by itself, but `intersectPolygon` is how every
    // non-rectangular shape finds its edge attachment, so it moved the point off
    // the axis the query ray travelled along — enough to give an otherwise
    // orthogonal edge a tiny diagonal opening segment, and to push an
    // attachment just inside the node it was meant to touch. `question.ts` used
    // to subtract the 0.5 back off for diamonds; that compensation went away
    // with this.
    const x = (b1 * c2 - b2 * c1) / denom;
    const y = (a2 * c1 - a1 * c2) / denom;

    return { x: x, y: y };
  }
}

function sameSign(r1, r2) {
  return r1 * r2 > 0;
}

export default intersectLine;
