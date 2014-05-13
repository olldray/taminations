/*

    Copyright 2014 Brad Christie

    This file is part of Taminations.

    Taminations is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Taminations is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with Taminations.  If not, see <http://www.gnu.org/licenses/>.

 */
WheelAround = Call.extend('wheelaround');
WheelAround.prototype.performOne = function(ctx,d)
{
  var d2 = ctx.partner[d];
  if (d2 == undefined || !ctx.active[d2])
    throw new CallError('Dancer '+dancerNum(d)+' must Wheel Around with partner.');
  var m = {};
  if (ctx.belle[d]) {
    if (!ctx.beau[d2])
      throw new CallError('Dancer '+dancerNum(d)+' is not part of a Facing Couple.');
    m = { select: 'Belle Wheel' };
  }
  else {
    if (!ctx.belle[d2])
      throw new CallError('Dancer '+dancerNum(d)+' is not part of a Facing Couple.');
    m = { select: 'Beau Wheel' };
  }
  return new Path(m);
};

//# sourceURL=wheel_around.js
