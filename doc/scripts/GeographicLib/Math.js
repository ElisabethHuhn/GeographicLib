/**
 * Math.js
 * Transcription of Math.hpp, Constants.hpp, and Accumulator.hpp into
 * JavaScript.
 *
 * Copyright (c) Charles Karney (2011-2015) <charles@karney.com> and licensed
 * under the MIT/X11 License.  For more information, see
 * http://geographiclib.sourceforge.net/
 **********************************************************************/

var GeographicLib; if (!GeographicLib) GeographicLib = {};

GeographicLib.Math = {};

GeographicLib.Math.sq = function(x) { return x * x; };

GeographicLib.Math.hypot = function(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  var a = Math.max(x, y), b = Math.min(x, y) / (a ? a : 1);
  return a * Math.sqrt(1 + b * b);
};

GeographicLib.Math.cbrt = function(x) {
  var y = Math.pow(Math.abs(x), 1/3);
  return x < 0 ? -y : y;
};

GeographicLib.Math.log1p = function(x) {
  var
  y = 1 + x,
  z = y - 1;
  // Here's the explanation for this magic: y = 1 + z, exactly, and z
  // approx x, thus log(y)/z (which is nearly constant near z = 0) returns
  // a good approximation to the true log(1 + x)/x.  The multiplication x *
  // (log(y)/z) introduces little additional error.
  return z === 0 ? x : x * Math.log(y) / z;
};

GeographicLib.Math.atanh = function(x) {
  var y = Math.abs(x);          // Enforce odd parity
  y = GeographicLib.Math.log1p(2 * y/(1 - y))/2;
  return x < 0 ? -y : y;
};

GeographicLib.Math.sum = function(u, v) {
  var
  s = u + v,
  up = s - v,
  vpp = s - up;
  up -= u;
  vpp -= v;
  t = -(up + vpp);
  // u + v =       s      + t
  //       = round(u + v) + t
  return {s: s, t: t};
};

GeographicLib.Math.polyval = function(N, p, s, x) {
  var y = N < 0 ? 0 : p[s++];
  while (--N >= 0) y = y * x + p[s++];
  return y;
}

GeographicLib.Math.AngRound = function(x) {
  // The makes the smallest gap in x = 1/16 - nextafter(1/16, 0) = 1/2^57 for
  // reals = 0.7 pm on the earth if x is an angle in degrees.  (This is about
  // 1000 times more resolution than we get with angles around 90 degrees.)  We
  // use this to avoid having to deal with near singular cases when x is
  // non-zero but tiny (e.g., 1.0e-200).  This also converts -0 to +0.
  var z = 1/16;
  var y = Math.abs(x);
  // The compiler mustn't "simplify" z - (z - y) to y
  y = y < z ? z - (z - y) : y;
  return x < 0 ? 0 - y : y;
};

GeographicLib.Math.AngNormalize = function(x) {
  // Place angle in [-180, 180).
  x = x % 360.0;
  return x < -180 ? x + 360 : (x < 180 ? x : x - 360);
};

GeographicLib.Math.LatFix = function(x) {
  // Place angle with NaN if outside [-90, 90].
  return Math.abs(x) > 90 ? Number.NaN : x;
};

GeographicLib.Math.AngDiff = function(x, y) {
  // Compute y - x and reduce to [-180,180] accurately.
  var
  r = GeographicLib.Math.sum(GeographicLib.Math.AngNormalize(x),
                             GeographicLib.Math.AngNormalize(-y)),
  d = - GeographicLib.Math.AngNormalize(r.s);
  t = r.t;
  return (d == 180 && t < 0 ? -180 : d) - t;
};

GeographicLib.Math.sincosd = function(x) {
  // In order to minimize round-off errors, this function exactly reduces
  // the argument to the range [-45, 45] before converting it to radians.
  var r, q;
  r = x % 360.0;
  q = Math.floor(r / 90 + 0.5);
  r -= 90 * q;
  // now abs(r) <= 45
  r *= this.degree;
  // Possibly could call the gnu extension sincos
  var s = Math.sin(r), c = Math.cos(r);
  var sinx, cosx;
  switch (q & 3) {
  case  0: sinx =     s; cosx =     c; break;
  case  1: sinx =     c; cosx = 0 - s; break;
  case  2: sinx = 0 - s; cosx = 0 - c; break;
  default: sinx = 0 - c; cosx =     s; break; // case 3
  }
  return {s: sinx, c: cosx};
};

GeographicLib.Math.atan2d = function(y, x) {
  // In order to minimize round-off errors, this function rearranges the
  // arguments so that result of atan2 is in the range [-pi/4, pi/4] before
  // converting it to degrees and mapping the result to the correct
  // quadrant.
  var q = 0;
  if (Math.abs(y) > Math.abs(x)) { var t; t = x; x = y; y = t; q = 2; }
  if (x < 0) { x = -x; ++q; }
  // here x >= 0 and x >= abs(y), so angle is in [-pi/4, pi/4]
  var ang = Math.atan2(y, x) / this.degree;
  switch (q) {
    // Note that atan2d(-0.0, 1.0) will return -0.  However, we expect that
    // atan2d will not be called with y = -0.  If need be, include
    //
    //   case 0: ang = 0 + ang; break;
    //
    // and handle mpfr as in AngRound.
  case 1: ang = (y > 0 ? 180 : -180) - ang; break;
  case 2: ang =  90 - ang; break;
  case 3: ang = -90 + ang; break;
  }
  return ang;
};

GeographicLib.Math.epsilon = Math.pow(0.5, 52);
GeographicLib.Math.degree = Math.PI/180;
GeographicLib.Math.digits = 53;

GeographicLib.Constants = {};
GeographicLib.Constants.WGS84 = { a: 6378137, f: 1/298.257223563 };
GeographicLib.Constants.version = { major: 1, minor: 44, patch: 0 };
GeographicLib.Constants.version_string = "1.44";

GeographicLib.Accumulator = {};
(function() {
  a = GeographicLib.Accumulator;
  var m = GeographicLib.Math;

  a.Accumulator = function(y) {
    this.Set(y);
  };

  a.Accumulator.prototype.Set = function(y) {
    if (!y) y = 0;
    if (y.constructor === a.Accumulator) {
      this._s = y._s;
      this._t = y._t;
    } else {
      this._s = y;
      this._t = 0;
    }
  };

  a.Accumulator.prototype.Add = function(y) {
    // Here's Shewchuk's solution...
    // Accumulate starting at least significant end
    var u = m.sum(y, this._t);
    var v = m.sum(u.s, this._s);
    u = u.t;
    this._s = v.s;
    this._t = v.t;
    // Start is _s, _t decreasing and non-adjacent.  Sum is now (s + t + u)
    // exactly with s, t, u non-adjacent and in decreasing order (except
    // for possible zeros).  The following code tries to normalize the
    // result.  Ideally, we want _s = round(s+t+u) and _u = round(s+t+u -
    // _s).  The follow does an approximate job (and maintains the
    // decreasing non-adjacent property).  Here are two "failures" using
    // 3-bit floats:
    //
    // Case 1: _s is not equal to round(s+t+u) -- off by 1 ulp
    // [12, -1] - 8 -> [4, 0, -1] -> [4, -1] = 3 should be [3, 0] = 3
    //
    // Case 2: _s+_t is not as close to s+t+u as it shold be
    // [64, 5] + 4 -> [64, 8, 1] -> [64,  8] = 72 (off by 1)
    //                    should be [80, -7] = 73 (exact)
    //
    // "Fixing" these problems is probably not worth the expense.  The
    // representation inevitably leads to small errors in the accumulated
    // values.  The additional errors illustrated here amount to 1 ulp of
    // the less significant word during each addition to the Accumulator
    // and an additional possible error of 1 ulp in the reported sum.
    //
    // Incidentally, the "ideal" representation described above is not
    // canonical, because _s = round(_s + _t) may not be true.  For
    // example, with 3-bit floats:
    //
    // [128, 16] + 1 -> [160, -16] -- 160 = round(145).
    // But [160, 0] - 16 -> [128, 16] -- 128 = round(144).
    //
    if (this._s === 0)           // This implies t == 0,
      this._s = u;              // so result is u
    else
      this._t += u;             // otherwise just accumulate u to t.
  };

  a.Accumulator.prototype.Sum = function(y) {
    if (!y)
      return this._s;
    else {
      var b = new a.Accumulator(this);
      b.Add(y);
      return b._s;
    }
  };

  a.Accumulator.prototype.Negate = function() {
    this._s *= -1;
    this._t *= -1;
  };

})();
