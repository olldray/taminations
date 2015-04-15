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
define(['calls/line_call'],function(LineCall) {
  fetchCall('extend');
  fetchCall('quarter in');
  var ExplodeAnd = Env.extend(LineCall);
  ExplodeAnd.prototype.name = 'Explode and';
  Call.classes.explodeand = ExplodeAnd;
  //  For now this just does Explode from waves
  //  And it would be better if the dancer's paths would be smoothed out
  ExplodeAnd.prototype.perform = function(ctx) {
    ctx.applyCalls('extend','quarter in');
  };
  return ExplodeAnd;
});

//# sourceURL=explode_and.js
