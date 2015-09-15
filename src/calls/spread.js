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
    along with TAMinations.  If not, see <http://www.gnu.org/licenses/>.

 */
"use strict";

define(['env','calls/codedcall','movement','path','vector'],
    function(Env,CodedCall,Movement,Path,Vector) {
  var AndSpread = Env.extend(CodedCall);
  AndSpread.prototype.name = " and Spread";
  AndSpread.prototype.performOne = function(d,ctx)
  {
    var p = d.path;
    //  This is for waves only TODO tandem couples, single dancers (C-1)
    var v = new Vector();
    if (d.belle)
      v = new Vector(0,1);
    else if (d.beau)
      v = new Vector(0,-1);
    var m = p.movelist.pop();
    var tx = m.rotate();
    v = v.concatenate(tx);
    p.movelist.push(m.skew(v.x,v.y).hands(Movement.NOHANDS));
    return new Path();
  };
  return AndSpread;
});

//# sourceURL=spread.js
