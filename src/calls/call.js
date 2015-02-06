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

var Call = Env.extend();
Call.classes = {};
Call.prototype.name = '';

var CallError = Env.extend(Error,function(msg)
{
  this.message = msg;
});
CallError.prototype.name="CallError";

var NoDancerError = Env.extend(CallError);

//  Wrapper method for performing one call
Call.prototype.performCall = function(ctx)
{
  ctx.analyze();
  this.perform(ctx);
  ctx.dancers.forEach(function(d) {
    d.recalculate();
    d.animateToEnd();
  },this);
  ctx.levelBeats();
};

//  Default method to perform one call
//  Pass the call on to each active dancer
//  Then append the returned paths to each dancer
Call.prototype.perform = function(ctx) {
  //  Get all the paths with performOne calls
  ctx.actives.forEach(function(d) {
    d.path.add(this.performOne(d,ctx));
  },this);
};

//  Default method for one dancer to perform one call
//  Returns an empty path (the dancer just stands there)
Call.prototype.performOne = function()
{
  return new Path();
};

//  If a call can modify another call by reading its output
//  and performing its modification it should override this method
Call.prototype.canModifyCall = function()
{
  return false;
};

///////   CallContext class    //////////////
//  An instance of the CallContext class is passed around calls
//  to hold the working data - dancers, paths, and
//  progress performing a call
//
//  A CallContext can be created by any of
//  * cloning another CallContext
//  * copying an array of dancers
//  * current state of TamSVG animation
//  * XML formation (?)
var CallContext = function(source)
{
  this.callname = '';
  if (source instanceof CallContext) {
    this.dancers = source.dancers.map(function(d) {
      return new Dancer({dancer:d,computeOnly:true,active:d.active});
    });
  }

  else if (source instanceof TamSVG) {
    this.dancers = source.dancers.map(function(d) {
      return new Dancer({dancer:d,computeOnly:true,active:true});
    });
  }

  else if (source instanceof Array) {
    this.dancers = source.map(function(d) {
      return new Dancer({dancer:d,computeOnly:true,active:true});
    });
  }

};
Object.defineProperty(CallContext.prototype,'actives',{
  get: function() {
    return this.dancers.filter(function(d) { return d.active; });
  }
});

/**
 * This is the main loop for interpreting a call
 * @param calltext  One complete call, lower case, words separated by single spaces
 */
CallContext.prototype.interpretCall = function(calltext)
{
  var err = new CallNotFoundError();
  //  Try every combination of synonyms for each word
  if (!calltext.syns().some(function(callwords) {
    //  Clear out any previous paths from incomplete parsing
    this.dancers.forEach(function(d) {
      d.path = new Path();
    });
    //  If a partial interpretation is found (like 'boys' of 'boys run')
    //  it gets popped off the front and this loop interprets the rest
    while (callwords.length > 0) {
      //  Try chopping off each word from the end of the call until
      //  we find something we know
      if (!callwords.chopped().some(function(callchopped) {
        var callname = callchopped.collapse().replace(/\W/g,'');
        var success = false;
        //  First try to find an exact match in Taminations
        //  Then look for a code match
        try {
          success = this.matchXMLcall(callname);
        } catch (err2) {
          err = err2;
        }
        try {
          success = success || this.matchJScall(callname);
        } catch (err2) {
          err = err2;
        }
        if (success) {
          //  Remove the words we matched, break out of and
          //  the chopped loop, and continue if any words left
          callwords = callwords.replace(callchopped,'').trim();
          return true;
        }
      },this))
        //  Every combination from callwords.chopped failed
        //  Continue with any other synonyms
        return false;
    }
    //  We were able to find a call for all the words
    return true;
  },this))
    // All synonyms tried and nothing worked
    throw err;
};

//  Given a context and string, try to find an XML animation
//  If found, the call is added to the context
CallContext.prototype.matchXMLcall = function(calltext)
{
  var found = false;
  var match = false;
  var call = calltext.collapse();
  var ctx = this;
  // Check that actives == dancers
  if (ctx.dancers.length == ctx.actives.length) {
    //  Try to find a match in the xml animations
    $('call[text="'+call+'"]',callindex).each(function () {
      var tamxml = xmldata[$(this).attr('link')];
      if (typeof tamxml == 'object') {
        for (var x=0; x<$('tam',tamxml).length; x++) {
          var xelem = $('tam',tamxml)[x];
          if (call == $(xelem).attr('title').toLowerCase().collapse().replace(/\W/g,'')) {
            found = true;
            var f = $(xelem).find('formation');
            if (f.size() <= 0) {
              var fs = $(xelem).attr('formation');
              f = getNamedFormation(fs);
            }
            var d = getDancers(f);
            var sexy = $(xelem).attr('gender-specific');
            var mm = matchFormations(ctx.dancers,d,sexy);
            if (!mm) {
              rotateFormation(d);
              mm = matchFormations(ctx.dancers,d,sexy);
            }
            if (mm) {
              var allp = tam.getPath(xelem);
              for (var i3 in allp) {
                var p = new Path(allp[i3]);
                ctx.dancers[mm[i3*2]].path.add(p);
                ctx.dancers[mm[i3*2+1]].path.add(p);
              }
              ctx.levelBeats();
              ctx.callname = $(xelem).attr('title');
              match = true;
              return false;  // break out of callindex loop
            }
          }
        }
      }
    });
  }
  if (found && !match)
    //  Found the call but formations did not match
    throw new FormationNotFoundError();
  return match;
};

//  Given a context and string, try to find an animation generated by code
//  If found, the call is added to the context
CallContext.prototype.matchJScall = function(calltext)
{
  var c = calltext.collapse().replace(/\W/g,'');
  if (c in Call.classes) {
    var call = new Call.classes[c];
    call.performCall(this);
    this.callname += call.name + ' ';
    return true;
  }
  return false;
};

//  Level off the number of beats for each dancer
CallContext.prototype.levelBeats = function()
{
  //  get the longest number of beats
  var maxbeats = this.dancers.reduce(function(v,d) {
    return Math.max(v,d.path.beats());
  },0);
  //  add that number as needed by using the "Stand" move
  this.dancers.forEach(function(d) {
    var b = maxbeats - d.path.beats();
    if (b > 0) {
      var m = tam.translate($('path[name="Stand"]',movedata));
      m[0].beats = b;
      d.path.add(new Path(m));
    }
  });
};

//  Moves the start position of a group of dancers
//  so they are centered around the origin
CallContext.prototype.center = function()
{
  var xave = this.dancers.reduce(function(a,b) { return a+b.startx; },0) / this.dancers.length;
  var yave = this.dancers.reduce(function(a,b) { return a+b.starty; },0) / this.dancers.length;
  this.dancers.forEach(function(d) {
    d.startx -= xave;
    d.starty -= yave;
    d.computeStart();
  });
};

////    Routines to analyze dancers
CallContext.prototype.dancer = function(d)
{
  return d instanceof Dancer ? d : this.dancers[d];
};
//  Distance between two dancers
//  If d2 not given, returns distance from origin
CallContext.prototype.distance = function(d1,d2)
{
  var v = this.dancer(d1).location;
  if (d2 != undefined)
    v = v.subtract(this.dancer(d2).location);
  return v.distance;
};
//  Angle of d2 as viewed from d1
//  If angle is 0 then d2 is in front of d1
//  If d2 is not given, returns angle to origin
//  Angle returned is in the range -pi to pi
CallContext.prototype.angle = function(d1,d2)
{
  var v = new Vector(0,0);
  if (d2 != undefined)
    v = this.dancer(d2).location;
  var v2 = v.preConcatenate(this.dancer(d1).tx.getInverse());
  return v2.angle;
};
CallContext.prototype.isFacingIn = function(d)
{
  var a = Math.abs(this.angle(d));
  return !Math.isApprox(a,Math.PI/2) && a < Math.PI/2;
};
CallContext.prototype.isFacingOut = function(d)
{
  var a = Math.abs(this.angle(d));
  return !Math.isApprox(a,Math.PI/2) && a > Math.PI/2;
};
//  Test if dancer d2 is directly in front, back. left, right of dancer d1
CallContext.prototype.isInFront = function(d1,d2)
{
  return d1 != d2 && Math.anglesEqual(this.angle(d1,d2),0);
};
CallContext.prototype.isInBack = function(d1,d2)
{
  return d1 != d2 && Math.anglesEqual(this.angle(d1,d2),Math.PI);
};
CallContext.prototype.isLeft = function(d1,d2)
{
  return d1 != d2 && Math.anglesEqual(this.angle(d1,d2),Math.PI/2);
};
CallContext.prototype.isRight = function(d1,d2)
{
  return d1 != d2 && Math.anglesEqual(this.angle(d1,d2),Math.PI*3/2);
};

//  Return closest dancer that satisfies a given conditional
CallContext.prototype.dancerClosest = function(d,f)
{
  var ctx = this;
  return this.dancers.filter(f,ctx).reduce(function(best,d2) {
    return best == undefined || ctx.distance(d2,d) < ctx.distance(best,d)
      ? d2 : best;
  },undefined);
};

//  Return all dancers, ordered by distance, that satisfies a conditional
CallContext.prototype.dancersInOrder = function(d,f)
{
  var ctx = this;
  return this.dancers.filter(f,ctx).sort(function(a,b) {
    return ctx.distance(d,a) - ctx.distance(d,b);
  });
};

//  Return dancer directly in front of given dancer
CallContext.prototype.dancerInFront = function(d)
{
  return this.dancerClosest(d,function(d2) {
    return this.isInFront(d,d2);
  },this);
};

//  Return dancer directly in back of given dancer
CallContext.prototype.dancerInBack = function(d)
{
  return this.dancerClosest(d,function(d2) {
    return this.isInBack(d,d2);
  });
};

//  Return dancer directly to the right of given dancer
CallContext.prototype.dancerToRight = function(d)
{
  return this.dancerClosest(d,function(d2) {
    return this.isRight(d,d2);
  });
};

//  Return dancer directly to the left of given dancer
CallContext.prototype.dancerToLeft = function(d)
{
  return this.dancerClosest(d,function(d2) {
    return this.isLeft(d,d2);
  });
};

//  Return dancers that are in between two other dancers
CallContext.prototype.inBetween = function(d1,d2)
{
  return this.dancers.filter(function(d) {
    return d !== d1 && d !== d2 &&
        Math.isApprox(this.distance(d,d1)+this.distance(d,d2),
                      this.distance(d1,d2));
  },this);
};

//  Return all the dancers to the right, in order
CallContext.prototype.dancersToRight = function(d)
{
  return this.dancersInOrder(d,function(d2) {
    return this.isRight(d,d2);
  });
};

//  Return all the dancers to the left, in order
CallContext.prototype.dancersToLeft = function(d)
{
  return this.dancersInOrder(d,function(d2) {
    return this.isLeft(d,d2);
  });
};

//  Return true if this is 4 dancers in a box
CallContext.prototype.isBox = function()
{
  //  Must have 4 dancers
  return this.dancers.length == 4 &&
         this.dancers.every(function(d) {
    //  Each dancer must have a partner
    //  and must be either a leader or a trailer
    return d.partner && (d.leader || d.trailer);
  });
};

//  Return true if this is 4 dancers in any kind of line, including waves
CallContext.prototype.isLine = function()
{
  //  Must have 4 dancers
  return this.dancers.length == 4 &&
    //  Each dancer must have right or left shoulder to origin
    this.dancers.every(function(d) {
      return Math.isApprox(Math.abs(this.angle(d)),Math.PI/2);
  },this) &&
       //  All dancers must either be on the y axis
       (this.dancers.every(function(d) {
          return Math.isApprox(d.location.x,0);
       }) ||
         //  or on the x axis
        this.dancers.every(function(d) {
          return Math.isApprox(d.location.y,0);
  }));
};

CallContext.prototype.analyze = function()
{
  this.dancers.forEach(function(d) {
    d.animateToEnd();
    d.beau = false;
    d.belle = false;
    d.leader = false;
    d.trailer = false;
    d.partner = false;
    d.center = false;
    d.end = false;
    d.verycenter = false;
  });
  var istidal = false;
  this.dancers.forEach(function(d1) {
    var bestleft = false;
    var bestright = false;
    var leftcount = 0;
    var rightcount = 0;
    var frontcount = 0;
    var backcount = 0;
    this.dancers.filter(function(d2) {
      return d1 !== d2;
    },this).forEach(function(d2) {
      //  Count dancers to the left and right, and find the closest on each side
      if (this.isRight(d1,d2)) {
        rightcount++;
        if (!bestright || this.distance(d1,d2) < this.distance(d1,bestright))
          bestright = d2;
      }
      else if (this.isLeft(d1,d2)) {
        leftcount++;
        if (!bestleft || this.distance(d1,d2) < this.distance(d1,bestleft))
          bestleft = d2;
      }
      //  Also count dancers in front and in back
      else if (this.isInFront(d1,d2))
        frontcount++;
      else if (this.isInBack(d1,d2))
        backcount++;
    },this);
    //  Use the results of the counts to assign belle/beau/leader/trailer
    //  and partner
    if (leftcount % 2 == 1 && rightcount % 2 == 0 &&
        this.distance(d1,bestleft) < 3) {
      d1.partner = bestleft;
      d1.belle = true;
    }
    else if (rightcount % 2 == 1 && leftcount % 2 == 0 &&
        this.distance(d1,bestright) < 3) {
      d1.partner = bestright;
      d1.beau = true;
    }
    if (frontcount % 2 == 0 && backcount % 2 == 1)
      d1.leader = true;
    else if (frontcount % 2 == 1 && backcount % 2 == 0)
      d1.trailer = true;
    //  Assign ends
    if (rightcount == 0 && leftcount > 1)
      d1.end = true;
    else if (leftcount == 0 && rightcount > 1)
      d1.end = true;
    //  The very centers of a tidal wave are ends
    //  Remember this special case for assigning centers later
    if (rightcount == 3 && leftcount == 4 ||
        rightcount == 4 && leftcount == 3) {
      d1.end = true;
      istidal = true;
    }
  },this);
  //  Analyze for centers and very centers
  //  Sort dancers by distance from center
  var dorder = [];
  this.dancers.forEach(function(d1) {
    dorder.push(d1);
  });
  var ctx = this;
  dorder.sort(function(a,b) {
    return ctx.distance(a) - ctx.distance(b);
  });
  //  The 2 dancers closest to the center
  //  are centers (4 dancers) or very centers (8 dancers)
  if (!Math.isApprox(this.distance(dorder[1]),this.distance(dorder[2]))) {
    if (this.dancers.length == 4) {
      dorder[0].center = true;
      dorder[1].center = true;
    } else {
      dorder[0].verycenter = true;
      dorder[1].verycenter = true;
    }
  }
  // If tidal, then the next 4 dancers are centers
  if (istidal) {
    [2,3,4,5].forEach(function(i) {
      dorder[i].center = true;
    });
  }
  // Otherwise, if there are 4 dancers closer to the center than the other 4,
  // they are the centers
  else if (this.dancers.length > 4 &&
           !Math.isApprox(this.distance(dorder[3]),this.distance(dorder[4]))) {
    [0,1,2,3].forEach(function(i) {
      dorder[i].center = true;
    });
  }

};
