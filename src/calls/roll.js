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

define(['calls/quarter_turns'],function(QuarterTurns) {
  var Roll = Env.extend(QuarterTurns);
  Roll.prototype.name = "and Roll";
  Call.classes.androll = Roll;
  Call.classes.androll = Roll;
  Roll.prototype.select = function(ctx,d) {
    //  Look at the last curve of the past
    var roll = d.path.movelist.last().brotate.rolling();
    if (roll < -0.1)
      return 'Quarter Right';
    if (roll > 0.1)
      return 'Quarter Left';
    return 'Stand';
  };
  return Roll;
});

//# sourceURL=roll.js
