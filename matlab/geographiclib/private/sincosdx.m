function [sinx, cosx] = sincosdx(x)
%SINCOSDX  Compute sine and cosine with argument in degrees
%
%   [sinx, cosx] = SINCOSDX(x) compute sine and cosine of x in degrees with
%   exact argument reduction and quadrant symmetries enforced.

  persistent octavep
  if isempty(octavep)
    octavep = exist('OCTAVE_VERSION', 'builtin') ~= 0;
  end
  if ~octavep
    % MATLAB implements argument reduction and symmetries already
    sinx = sind(x); cosx = cosd(x);
  else
    r = rem(x, 360);
    % workaround rem's bad handling of -0 in octave; fixed 2015-07-22
    % http://savannah.gnu.org/bugs/?45587
    r(x == 0 & signbit(x)) = -0;
    q = floor(r / 90 + 0.5);
    r = r - 90 * q;
    q = mod(q, 4);
    sinx = sind(r); cosx = cosd(r);
    t = q == 1; z = 0 - sinx(t); sinx(t) = cosx(t); cosx(t) = z;
    t = q == 2; sinx(t) = 0 - sinx(t); cosx(t) = 0 - cosx(t);
    t = q == 3; z = sinx(t); sinx(t) = 0 - cosx(t); cosx(t) = z;
  end
end
