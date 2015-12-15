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

define(['env','calls/codedcall','calls/half','callerror'],
       function(Env,CodedCall,Half,CallError) {
  var OneAndaHalf = Env.extend(CodedCall);
  OneAndaHalf.prototype.name = "Once and a Half";

  OneAndaHalf.prototype.preProcess = function(ctx) {
    if (ctx.callstack.length < 2)
      throw new CallError('One and a half of what?');
  };

  OneAndaHalf.prototype.performCall = function(ctx,i) {
    var ctx2 = ctx.clone();
    ctx2.callstack.push(new Half());
    ctx2.callstack = ctx2.callstack.concat(ctx.callstack.slice(0,i));
    ctx2.performCall();
    ctx2.appendToSource();
  };

  return OneAndaHalf;
});

//# sourceURL=one_and_a_half.js
