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

define(['calls/quarter_turns'], QuarterTurns =>

  //  This class handles Zig Zag, Zag Zig, Zig Zig, Zag Zag
  class ZigZag extends QuarterTurns {

    constructor(calltext) {
      super()
      this.name = calltext.toCapCase()
    }

    select(ctx,d) {
      if (d.leader)
        return this.name.match("Zig Z[ai]g") ? 'Quarter Right' : "Quarter Left"
      if (d.trailer)
        return this.name.match("Z[ai]g Zig") ? "Quarter Right" : 'Quarter Left'
      return "Stand"
    }

  })
