/*

    Copyright 2015 Brad Christie

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
"use strict";

define(['env','calls/call','path'],function(Env,Call,Path) {
  var MakeTightWave = Env.extend(Call);
  MakeTightWave.prototype.name = "Make Tight Wave";

  MakeTightWave.prototype.performOne = function(d,ctx) {
    //  Ok if already in a wave
    if (ctx.isInWave(d))
      return new Path();
    //  Can only make a wave with another dancer
    //  in front of this dancer
    //  who is also facing this dancer
    var d2 = ctx.dancerFacing(d);
    if (d2 != undefined) {
      var dist = ctx.distance(d,d2);
      return new Path({ select: 'Extend Left', scaleX: dist/2, scaleY:0.5 });
    }
    throw new Error();
  };

  return MakeTightWave;
});

//# sourceURL=make_tight_wave.js