/*

    Copyright 2017 Brad Christie

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

define(['calls/action','path','callerror'], (Action,Path,CallError) =>

  class PassThru extends Action {

    constructor() {
      super()
      this.name = "Pass Thru"
    }

    performOne(d,ctx) {
      //  Can only pass thru with another dancer
      //  in front of this dancer
      //  who is also facing this dancer
      var d2 = ctx.dancerInFront(d)
      if (d2 != undefined && d2.active && ctx.dancerInFront(d2) == d) {
        var dist = ctx.distance(d,d2);
        return TamUtils.getMove("Extend Left").scale(dist/2,0.5)
          .add(TamUtils.getMove("Extend Right").scale(dist/2,0.5))
      }
      throw new CallError(`Dancer ${d.number} has nobody to Pass Thru with`)
    }

  })
