/*

    Copyright 2012 Brad Christie

    This file is part of TAMinations.

    TAMinations is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    TAMinations is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with TAMinations.  If not, see <http://www.gnu.org/licenses/>.

 */

Call.classes['turnthru'] = defineClass({
  name: "Turn Thru",
  extend: Call,
  methods: {
    performOne: function(ctx,d) {
      //  Can only turn thru with another dancer
      //  in front of this dancer
      //  who is also facing this dancer
      var d2 = ctx.dancerInFront(d);
      if (d2 != undefined && ctx.dancerInFront(d2) == d) {
        var dist = ctx.distance(d,d2);
        var moves = tam.translatePath([{ select: 'Extend Left', scaleX: dist/2, scaleY: 0.5 },
                                       { select: 'Swing Right', scaleX: 0.5, scaleY: 0.5 },
                                       { select: 'Extend Right', scaleX: dist/2, scaleY: 0.5 }]);
        return new Path(moves);
      }
      throw new Error('Cannot find dancer to Turn Thru with '+dancerNum(d));
    }

  },
});
