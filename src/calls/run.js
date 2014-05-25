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
define(function(){
  var Run = Env.extend(Call);
  Call.classes.run = Run;
  Run.prototype.perform = function(ctx)
  {
    //  We need to look at all the dancers, not just actives
    //  because partners of the runners need to dodge
    ctx.dancers.forEach(function(d) {
      if (d.active) {
        //  Partner must be inactive
        var d2 = d.partner;
        if (!d2 || d2.active)
          throw new CallError('Dancer '+d+' has nobody to Run around.');
        var m = d.beau ? 'Run Right' : 'Run Left';
        d.path = new Path({ select: m });
      }
      else if (d.partner && d.partner.active) {
        var m = d.beau ? 'Dodge Right' : 'Dodge Left';
        d.path = new Path({ select: m });
      }
    });

  };
  return Run;
});

//# sourceURL=run.js
