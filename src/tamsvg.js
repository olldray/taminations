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

/*

  TamSVG - Javascript+SVG implementation of the original Tamination.java

*/

// Use jQuery to make a deep copy
function clone(obj)
{
  return jQuery.extend(true,{},obj);
}

var popupMenuHTML =
  '<div id="popup">'+
  '<input id="HexagonPopupItem" type="checkbox"/> Hexagon<br/>'+
  '<input id="BigonPopupItem" type="checkbox"/> Bi-gon<br/>'+
  '<hr/>'+
  '<input id="BarstoolPopupItem" type="checkbox"/> Barstool<br/>'+
  '<input id="CompassPopupItem" type="checkbox"/> Compass<br/>'+
  '</div>';

var popupMenuTitleHTML =
  '<div id="titlepopup">'+
  '<a href="javascript:showDefinition()">Definition</a><br/>'+
  '<hr/>'+
  '<input id="HexagonTitlePopupItem" type="checkbox"/> '+
  '<a href="javascript:tamsvg.toggleHexagon()">'+
  'Hexagon</a><br/>'+
  '<input id="BigonTitlePopupItem" type="checkbox"/> '+
  '<a href="javascript:tamsvg.toggleBigon()">'+
  'Bi-gon<br/>'+
  '</div>';

function showDefinition()
{
  $('#titlepopup').hide();
  $('#definition').slideDown();
}

//  Setup - called when page is loaded
function TamSVG(svg_in)
{
  if (this instanceof TamSVG) {
    //  Called as 'new TamSVG(x)'
    this.init(svg_in);
    window.tamsvg = this;
  }
  else
    //  Called as 'TamSVG(x)'
    window.tamsvg = new TamSVG(svg_in);
}
TamSVG.prototype = {
  init: function(svg_in)
  {
    var me = this;
    cookie = new Cookie("TAMination");
    this.cookie = cookie;
    this.animationListener = null;
    $(document).bind("contextmenu",function() { return false; });
    //  Get initial values from cookie
    //  This is a hook to test hexagon
    this.hexagon = cookie.hexagon == "true";
    if (typeof args != 'undefined' && args.hexagon)
      this.hexagon = true;
    this.bigon = cookie.bigon == "true";
    if (typeof args != 'undefined' && args.bigon)
      this.bigon = true;
    if (cookie.speed == 'slow')
      this.slow(true);
    else if (cookie.speed == 'fast')
      this.fast(true);
    else
      this.normal(true);
    this.loop = cookie.loop == "true" || args.loop;
    this.grid = cookie.grid == "true";
    this.numbers = cookie.numbers == 'true' || args.numbers;
    this.couples = cookie.couples == 'true' || args.couples;
    if (this.couples)
      this.numbers = false;
    this.showPhantoms = cookie.phantoms == "true";
    if (cookie.svg != 'true') {
      cookie.svg = "true";
      cookie.store(365,'/tamination');
    }
    this.currentpart = 0;
    this.barstool = 0;
    this.compass = 0;
    this.animationStopped = function() { };
    this.goHexagon = function() { };
    this.goBigon = function() { };
    //  Set up the dance floor
    this.svg = svg_in;
    this.svg.configure({width: '100%', height:'100%', viewBox: '0 0 100 100'});
    this.floorsvg = this.svg.svg(null,0,0,100,100,-6.5,-6.5,13,13);
    this.floorsvg.setAttribute('width','100%');
    this.floorsvg.setAttribute('height','100%');
    this.allp = tam.getPath();
    if (tam.getParts() == '')
      this.parts = [];
    else {
      this.parts = tam.getParts().split(/;/);
      for (var i in this.parts)
        this.parts[i] = Number(this.parts[i]);
    }
    //  first token is 'Formation', followed by e.g. boy 1 2 180 ...
    var formation = tam.getFormation();
    //  Flip the y direction on the dance floor to match our math
    this.floor = this.svg.group(this.floorsvg);
    this.floor.setAttribute('transform',AffineTransform.getScaleInstance(1,-1).toString());
    this.svg.rect(this.floor,-6.5,-6.5,13,13,{fill:'#ffffc0'});

    //  Add title, optionally with audio link
    if (typeof tam.getTitle() != "undefined") {
      this.titlegroup = this.svg.group(this.floorsvg);
      var tt = tam.getTitle().replace(/ \(.*?\)/g,' ');
      var t = this.svg.text(this.titlegroup,0,0,tt,{fontSize: "10", transform:"translate(-6.4,-5.5) scale(0.1)"});
      l = t.getComputedTextLength();
      if (l > 110) {
        var s = 110/l;
        t.setAttribute('transform',"translate(-6.4,"+(-6.5+s)+") scale("+(s/10)+")");
      }
      //  Find out if we have audio for this title
      var ttid = '#'+tt.replace(/ /g,'_').replace(/\W/g,'').toLowerCase()+'_audio';
      if ($(ttid).length > 0) {
        //  Speaker SVG grabbed from Wikipedia (public domain)
        var speakergroup = this.svg.group(this.titlegroup,
            {fill:"none",stroke:"brown",strokeWidth:5,'stroke-linejoin':"round",'stroke-linecap':"round",
          transform:"translate(4.7,5) scale(0.02)"});
        this.svg.polygon(speakergroup,
            [[39.389,13.769], [22.235,28.606], [6,28.606], [6,47.699], [21.989,47.699], [39.389,62.75], [39.389,13.769]],
            {fill:"red"}
        );
        this.svg.path(speakergroup,
            this.svg.createPath().move(48.128,49.03).curveC([[50.057,45.934, 51.19,42.291, 51.19,38.377],
                                                             [51.19,34.399, 50.026,30.703, 48.043,27.577]]));
        this.svg.path(speakergroup,
            this.svg.createPath().move(55.082,20.537).curveC([[58.777,25.523, 60.966,31.694, 60.966,38.377],
                                                              [60.966,44.998, 58.815,51.115, 55.178,56.076]]));
        this.svg.path(speakergroup,
            this.svg.createPath().move(61.71,62.611).curveC([[66.977,55.945, 70.128,47.531, 70.128,38.378],
                                                             [70.128,29.161, 66.936,20.696, 61.609,14.01]]));
        $(speakergroup).mousedown(function() {
          $(ttid).get(0).play();
        });
      }
    }

    this.gridgroup = this.svg.group(this.floor,{fill:"none",stroke:"black",strokeWidth:0.01});
    this.hexgridgroup = this.svg.group(this.floor,{fill:"none",stroke:"black",strokeWidth:0.01});
    this.bigongridgroup = this.svg.group(this.floor,{fill:"none",stroke:"black",strokeWidth:0.01});
    this.bigoncentergroup = this.svg.group(this.floor,{fill:"none",stroke:"black",strokeWidth:0.01});
    this.drawGrid();
    if (!this.grid || this.hexagon || this.bigon)
      this.gridgroup.setAttribute('visibility','hidden');
    if (!this.grid || !this.hexagon)
      this.hexgridgroup.setAttribute('visibility','hidden');
    if (!this.grid || !this.bigon)
      this.bigongridgroup.setAttribute('visibility','hidden');
    if (!this.bigon)
      this.bigoncentergroup.setAttribute('visibility','hidden');
    this.pathparent = this.svg.group(this.floor);
    if (!this.showPaths)
      this.pathparent.setAttribute('visibility','hidden');
    this.handholds = this.svg.group(this.floor);
    this.dancegroup = this.svg.group(this.floor);
    this.dancers = [];
    var dancerColor = [ Color.red, Color.green, Color.blue, Color.yellow,
                        Color.lightGray, Color.lightGray, Color.lightGray, Color.lightGray ];
    var numbers = tam.getNumbers();
    var couples = tam.getCouples();
    $('dancer',formation).each(function(j) {
      var gender = Dancer.genders[$(this).attr('gender')];
      var d = new Dancer({
        tamsvg: me,
        gender: gender,
        x: -Number($(this).attr('y')),
        y: -Number($(this).attr('x')),
        angle: Number($(this).attr('angle'))+180,
        color:  dancerColor[couples[j*2]-1],
        path: me.allp[j],
        number: gender==Dancer.PHANTOM ? ' ' : numbers[me.dancers.length],
        couplesnumber: gender==Dancer.PHANTOM ? ' ' : couples[j*2],
        hidden: gender == Dancer.PHANTOM && !me.showPhantoms
      });
      me.dancers.push(d);
      d = new Dancer({
        tamsvg: me,
        gender: gender,
        x: Number($(this).attr('y')),
        y: Number($(this).attr('x')),
        angle: Number($(this).attr('angle')),
        color:  dancerColor[couples[j*2+1]-1],
        path: me.allp[j],
        number: gender==Dancer.PHANTOM ? ' ' : numbers[me.dancers.length],
        couplesnumber: gender==Dancer.PHANTOM ? ' ' : couples[j*2+1],
        hidden: gender == Dancer.PHANTOM && !me.showPhantoms
      });
      me.dancers.push(d);
    });
    this.barstoolmark = this.svg.circle(this.floor,0,0,0.2,{fill:'black'});
    var pth = this.svg.createPath();
    this.compassmark = this.svg.path(this.floor,
        pth.move(0,-0.5).line(0,0.5).move(-0.5,0).line(0.5,0),
        {stroke:'black',strokeWidth:0.05});
    this.barstoolmark.setAttribute('visibility','hidden');
    this.compassmark.setAttribute('visibility','hidden');

    //  Compute animation length
    this.beats = 0.0;
    for (var d in this.dancers)
      this.beats = Math.max(this.beats,this.dancers[d].beats());
    this.beats += 2.0;

    //  Mouse wheel moves the animation
    $(this.floorsvg).on('mousewheel',function(event) {
      me.beat += event.deltaY * 0.2;
      me.animate();
    });

    //  Initialize the animation
    if (this.hexagon)
      this.convertToHexagon();
    else if (this.bigon)
      this.convertToBigon();
    this.beat = -2.0;
    this.prevbeat = -2.0;
    //this.speed = 500;  now set above checking cookie
    this.running = false;
    for (var i in this.dancers)
      this.dancers[i].recalculate(i==4);
    this.lastPaintTime = new Date().getTime();
    this.animate();
  },

  hideTitle: function()
  {
    this.titlegroup.setAttribute('visibility','hidden');
  },

  toggleHexagon: function()
  {
    $('#titlepopup').hide();
    this.setHexagon(!this.hexagon);
    if (this.hexagon)
      this.goHexagon();
  },

  toggleBigon: function()
  {
    $('#titlepopup').hide();
    this.setBigon(!this.bigon);
    if (this.bigon)
      this.goBigon();
  },

  setAnimationListener: function(l)
  {
    this.animationListener = l;
  },

  //  This function is called repeatedly to move the dancers
  animate: function()
  {
    //  Update the animation time
    var now = new Date().getTime();
    var diff = now - this.lastPaintTime;
    if (this.running)
      this.beat += diff/this.speed;
    //  Update the dancers
    this.paint();
    this.lastPaintTime = now;
    //  Update the slider
    //  would probably be better to do this with a callback
    $('#playslider').slider('value',this.beat*100);
    if (this.animationListener != null)
      this.animationListener(this.beat);
    //$('#animslider').val(Math.floor(this.beat*100)).slider('refresh');
    if (this.beat >= this.beats) {
      if (this.loop)
        this.beat = -2;
      else
        this.stop();
    }
    if (this.beat > this.beats)
      this.beat = this.beats;
    if (this.beat < -2)
      this.beat = -2;
    //  Update the definition highlight
    var thispart = 1;
    var partsum = 0;
    for (var i in this.parts) {
      if (this.parts[i]+partsum < this.beat)
        thispart++;
      partsum += this.parts[i];
    }
    if (this.beat < 0 || this.beat > this.beats-2)
      thispart = 0;
    if (thispart != this.currentpart) {
      if (this.parts.length > 0 && this.setPart)
        this.setPart(thispart);
      this.currentpart = thispart;
    }
  },

  setBeat: function(b)
  {
    this.beat = b;
    this.animate();
  },

  paint: function(beat)
  {
    if (arguments.length == 0)
      beat = this.beat;
    //  If a big jump from the last hexagon animation, calculate some
    //  intervening ones so the wrap works
    while (this.hexagon && Math.abs(beat-this.prevbeat) > 1.1)
      this.paint(this.prevbeat + (beat > this.prevbeat ? 1.0 : -1.0));
    this.prevbeat = beat;

    //  Move dancers
    for (var i in this.dancers)
      this.dancers[i].animate(beat);

    //  If hexagon, rotate relative to center
    if (this.hexagon) {
      for (var i in this.dancers) {
        var d = this.dancers[i];
        var a0 = Math.atan2(d.starty,d.startx);  // hack
        var a1 = Math.atan2(d.tx.getTranslateY(),d.tx.getTranslateX());
        //  Correct for wrapping around +/- pi
        if (this.beat <= 0.0)
          d.prevangle = a1;
        var wrap = Math.round((a1-d.prevangle)/(Math.PI*2));
        a1 -= wrap*Math.PI*2;
        var a2 = -(a1-a0)/3;
        d.concatenate(AffineTransform.getRotateInstance(a2));
        d.prevangle = a1;
      }
    }
    //  If bigon, rotate relative to center
    if (this.bigon) {
      for (var i in this.dancers) {
        var d = this.dancers[i];
        var a0 = Math.atan2(d.starty,d.startx);  // hack
        var a1 = Math.atan2(d.tx.getTranslateY(),d.tx.getTranslateX());
        //  Correct for wrapping around +/- pi
        if (this.beat <= 0.0)
          d.prevangle = a1;
        var wrap = Math.round((a1-d.prevangle)/(Math.PI*2));
        a1 -= wrap*Math.PI*2;
        var a2 = +(a1-a0);
        d.concatenate(AffineTransform.getRotateInstance(a2));
        d.prevangle = a1;
      }
    }

    //  If barstool, translate to keep the barstool dancer stationary in center
    if (this.barstool) {
      var tx = AffineTransform.getTranslateInstance(
          -this.barstool.tx.getTranslateX(),
          -this.barstool.tx.getTranslateY());
      for (var i in this.dancers) {
        this.dancers[i].concatenate(tx);
      }
      this.barstoolmark.setAttribute('cx',0);
      this.barstoolmark.setAttribute('cy',0);
      this.barstoolmark.setAttribute('visibility','visible');
    }
    else
      this.barstoolmark.setAttribute('visibility','hidden');

    //  If compass, rotate relative to compass dancer
    if (this.compass) {
      var tx = AffineTransform.getRotateInstance(
          this.compass.startangle*Math.PI/180-this.compass.tx.getAngle());
      for (var i in this.dancers) {
        this.dancers[i].concatenate(tx);
      }
      this.compassmark.setAttribute('transform',
          AffineTransform.getTranslateInstance(
              this.compass.tx.getTranslateX(),
              this.compass.tx.getTranslateY()));
      this.compassmark.setAttribute('visibility','visible');
    }
    else
      this.compassmark.setAttribute('visibility','hidden');

    //  Compute handholds
    Handhold.dfactor0 = this.hexagon ? 1.15 : 1.0;
    var hhlist = [];
    for (var i0 in this.dancers) {
      var d0 = this.dancers[i0];
      d0.rightdancer = d0.leftdancer = null;
      d0.rightHandNewVisibility = false;
      d0.leftHandNewVisibility = false;
    }
    for (var i1=0; i1<this.dancers.length-1; i1++) {
      var d1 = this.dancers[i1];
      if (d1.gender==Dancer.PHANTOM && !this.showPhantoms)
        continue;
      for (var i2=i1+1; i2<this.dancers.length; i2++) {
        var d2 = this.dancers[i2];
        if (d2.gender==Dancer.phantom && !this.showPhantoms)
          continue;
        var hh = Handhold.getHandhold(d1,d2);
        if (hh != null)
          hhlist.push(hh);
      }
    }

    hhlist.sort(function(a,b) { return a.score - b.score; });
    for (var h in hhlist) {
      var hh = hhlist[h];
      /*if (this.bigon) {
        if (Math.abs(hh.d1.centerAngle()-3*Math.PI/2) < 3 &&
            hh.d1.hands == Movement.RIGHTHAND)
          continue;
      }*/
      //  Check that the hands aren't already used
      var incenter = this.hexagon && hh.inCenter();
      if (incenter ||
          (hh.h1 == Movement.RIGHTHAND && hh.d1.rightdancer == null ||
              hh.h1 == Movement.LEFTHAND && hh.d1.leftdancer == null) &&
              (hh.h2 == Movement.RIGHTHAND && hh.d2.rightdancer == null ||
                  hh.h2 == Movement.LEFTHAND && hh.d2.leftdancer == null)) {
        hh.paint();
        if (incenter)
          continue;
        if (hh.h1 == Movement.RIGHTHAND) {
          hh.d1.rightdancer = hh.d2;
          if ((hh.d1.hands & Movement.GRIPRIGHT) == Movement.GRIPRIGHT)
            hh.d1.rightgrip = hh.d2;
        } else {
          hh.d1.leftdancer = hh.d2;
          if ((hh.d1.hands & Movement.GRIPLEFT) == Movement.GRIPLEFT)
            hh.d1.leftgrip = hh.d2;
        }
        if (hh.h2 == Movement.RIGHTHAND) {
          hh.d2.rightdancer = hh.d1;
          if ((hh.d2.hands & Movement.GRIPRIGHT) == Movement.GRIPRIGHT)
            hh.d2.rightgrip = hh.d1;
        } else {
          hh.d2.leftdancer = hh.d1;
          if ((hh.d2.hands & Movement.GRIPLEFT) == Movement.GRIPLEFT)
            hh.d2.leftgrip = hh.d1;
        }
      }
    }
    //  Clear handholds no longer visible
    for (var i in this.dancers) {
      var d = this.dancers[i];
      if (d.rightHandVisibility && !d.rightHandNewVisibility) {
        d.righthand.setAttribute('visibility','hidden');
        d.rightHandVisibility = false;
      }
      if (d.leftHandVisibility && !d.leftHandNewVisibility) {
        d.lefthand.setAttribute('visibility','hidden');
        d.leftHandVisibility = false;
      }
    }

    //  Paint dancers with hands
    //$('#animslider').val(this.beat);
    for (var i in this.dancers)
      this.dancers[i].paint();

  },

  rewind: function()
  {
    this.stop();
    this.beat = -2;
    this.animate();
  },

  prev: function()
  {
    var b = 0;
    var best = this.beat;
    for (var i in this.parts) {
      b += this.parts[i];
      if (b < this.beat)
        best = b;
    }
    if (best == this.beat && best > 0)
      best = 0;
    else if (this.beat <= 0)
      best = -2;
    this.beat = best;
    this.animate();
  },

  backward: function()
  {
    this.stop();
    if (this.beat > 0.1)
      this.beat -= 0.1;
    this.animate();
  },

  stop: function()
  {
    if (this.timer != null)
      clearInterval(this.timer);
    this.timer = null;
    this.running = false;
    this.animationStopped();
  },

  start: function()
  {
    this.lastPaintTime = new Date().getTime();
    if (this.timer == null) {
      var me = this;
      this.timer = setInterval(function() { me.animate(); },25);
    }
    if (this.beat >= this.beats)
      this.beat = -2;
    this.running = true;
    $('#playButton').attr('value','Stop');
  },

  play: function()
  {
    if (this.running)
      this.stop();
    else
      this.start();
  },

  forward: function()
  {
    this.stop();
    if (this.beat < this.beats)
      this.beat += 0.1;
    this.animate();
  },

  next: function()
  {
    var b = 0;
    for (var i in this.parts) {
      b += this.parts[i];
      if (b > this.beat) {
        this.beat = b;
        b = -1000;
      }
    }
    if (b >= 0 && b < this.beats-2)
      this.beat = this.beats-2;
    this.animate();
  },

  end: function()
  {
    this.stop();
    if (this.beat < this.beats-2)
      this.beat = this.beats-2;
    this.animate();
  },

  slow: function(setcookie)
  {
    this.speed = 1500;
    if (arguments.length > 0) {
      this.cookie.speed = 'slow';
      this.cookie.store(365,'/tamination');
    }
  },
  normal: function(setcookie)
  {
    this.speed = 500;
    if (arguments.length > 0) {
      this.cookie.speed = 'normal';
      this.cookie.store(365,'/tamination');
    }
  },
  fast: function(setcookie)
  {
    this.speed = 200;
    if (arguments.length > 0) {
      this.cookie.speed = 'fast';
      this.cookie.store(365,'/tamination');
    }
  },
  isSlow: function()
  {
    return this.speed == 1500;
  },
  isNormal: function()
  {
    return this.speed == 500;
  },
  isFast: function()
  {
    return this.speed == 200;
  },

  setLoop: function(v) {
    if (arguments.length > 0)
      this.loop = v;
    this.cookie.loop = this.loop;
    this.cookie.store(365,'/tamination');
    return this.loop;
  },

  setGrid: function(v) {
    if (arguments.length > 0) {
      this.grid = v;
      this.hexgridgroup.setAttribute('visibility','hidden');
      this.bigongridgroup.setAttribute('visibility','hidden');
      this.gridgroup.setAttribute('visibility','hidden');
      if (this.grid) {
        if (tamsvg.hexagon)
          tamsvg.hexgridgroup.setAttribute('visibility','visible');
        else if (tamsvg.bigon)
          tamsvg.bigongridgroup.setAttribute('visibility','visible');
        else
          tamsvg.gridgroup.setAttribute('visibility','visible');
      }
    }
    this.cookie.grid = this.grid;
    this.cookie.store(365,'/tamination');
    return this.grid;
  },

  setPaths: function(v) {
    if (arguments.length > 0)
      this.showPaths = v;
    this.pathparent.setAttribute('visibility',this.showPaths ? 'visible' : 'hidden');
    for (var i in this.dancers) {
      this.dancers[i].pathgroup.setAttribute('visibility',this.showPaths ? 'visible' : 'hidden');
      this.dancers[i].beziergroup.setAttribute('visibility','hidden');
      this.dancers[i].pathVisible = this.showPaths;
    }
    return this.showPaths;
  },

  setNumbers: function(v)
  {
    if (arguments.length > 0) {
      this.numbers = v;
      if (this.numbers)
        this.couples = false;
      for (var i in this.dancers) {
        var d = this.dancers[i];
        if (this.numbers)
          d.showNumber();
        else
          d.hideNumbers();
      }
      this.cookie.numbers = this.numbers;
      this.cookie.couples = this.couples;
      this.cookie.store(365,'/tamination');
    }
    return this.numbers;
  },

  setCouples: function(v)
  {
    if (arguments.length > 0) {
      this.couples = v;
      if (this.couples)
        this.numbers = false;
      for (var i in this.dancers) {
        var d = this.dancers[i];
        if (this.couples)
          d.showCouplesNumber();
        else
          d.hideNumbers();
      }
      this.cookie.numbers = this.numbers;
      this.cookie.couples = this.couples;
      this.cookie.store(365,'/tamination');
    }
    return this.couples;
  },

  setPhantoms: function(v)
  {
    if (arguments.length > 0) {
      this.showPhantoms = v;
      for (var i in this.dancers)
        if (this.dancers[i].gender == Dancer.PHANTOM) {
          if (this.showPhantoms)
            this.dancers[i].show();
          else
            this.dancers[i].hide();
        }
    }
    this.cookie.phantoms = this.showPhantoms;
    this.cookie.store(365,'/tamination');
    return this.showPhantoms;
  },

  setHexagon: function(v)
  {
    if (arguments.length > 0) {
      this.hexagon = v;
      if (this.hexagon) {
        if (this.bigon) {
          this.bigon = false;
          this.revertFromBigon();
        }
        this.convertToHexagon();
        this.animate();
        if (this.grid) {
          this.gridgroup.setAttribute('visibility','hidden');
          this.bigongridgroup.setAttribute('visibility','hidden');
          this.hexgridgroup.setAttribute('visibility','visible');
        }
      } else {
        this.revertFromHexagon();
        this.animate();
        if (this.grid) {
          this.hexgridgroup.setAttribute('visibility','hidden');
          this.gridgroup.setAttribute('visibility','visible');
        }
      }
      for (var i in this.dancers)
        this.dancers[i].paintPath();
      this.animate();
      this.cookie.hexagon = this.hexagon;
      this.cookie.bigon = false;
      this.cookie.store(365,'/tamination');
    }
    return this.hexagon;
  },

  setBigon: function(v)
  {
    if (arguments.length > 0) {
      this.bigon = v;
      if (this.bigon) {
        if (this.hexagon) {
          this.hexagon = false;
          this.revertFromHexagon();
        }
        this.convertToBigon();
        this.animate();
        if (this.grid) {
          this.gridgroup.setAttribute('visibility','hidden');
          this.hexgridgroup.setAttribute('visibility','hidden');
          this.bigongridgroup.setAttribute('visibility','visible');
        }
      } else {
        this.revertFromBigon();
        this.animate();
        if (this.grid) {
          this.bigongridgroup.setAttribute('visibility','hidden');
          this.gridgroup.setAttribute('visibility','visible');
        }
      }
      for (var i in this.dancers)
        this.dancers[i].paintPath();
      this.animate();
      this.cookie.bigon = this.bigon;
      this.cookie.hexagon = false;
      this.cookie.store(365,'/tamination');
    }
    return this.bigon;
  },


  drawGrid: function()
  {
    //  Square grid
    for (var x=-7.5; x<=7.5; x+=1)
      this.svg.line(this.gridgroup,x,-7.5,x,7.5);
    for (var y=-7.5; y<=7.5; y+=1)
      this.svg.line(this.gridgroup,-7.5,y,7.5,y);

    //  Hex grid
    for (var x0=0.5; x0<=8.5; x0+=1) {
      var points = [];
      // moveto 0, x0
      points.push([0,x0]);
      for (var y0=0.5; y0<=8.5; y0+=0.5) {
        var a = Math.atan2(y0,x0)*2/3;
        var r = Math.sqrt(x0*x0+y0*y0);
        var x = r*Math.sin(a);
        var y = r*Math.cos(a);
        // lineto x,y
        points.push([x,y]);
      }
      //  reflect and rotate the result
      for (var a=0; a<6; a++) {
        var t = "rotate("+(a*60)+")";
        this.svg.polyline(this.hexgridgroup,points,{transform:t});
        this.svg.polyline(this.hexgridgroup,points,{transform:t+" scale(1,-1)"});
      }
    }

    //  Bigon grid
    for (var x1=-7.5; x1<=7.5; x1+=1) {
      var points = [];
      points.push([0,Math.abs(x1)]);
      for (var y1=0.2; y1<=7.5; y1+=0.2) {
        var a = 2*Math.atan2(y1,x1);
        var r = Math.sqrt(x1*x1+y1*y1);
        var x = r*Math.sin(a);
        var y = r*Math.cos(a);
        points.push([x,y]);
      }
      this.svg.polyline(this.bigongridgroup,points);
      this.svg.polyline(this.bigongridgroup,points,{transform:"scale(1,-1)"});
    }

    //  Bigon center mark
    this.svg.line(this.bigoncentergroup,0,-0.5,0,0.5);
    this.svg.line(this.bigoncentergroup,-0.5,0,0.5,0);

  },

  convertToHexagon: function()
  {
    //  Save current dancers
    for (var i in this.dancers)
      this.dancers[i].hide();
    this.saveDancers = this.dancers;
    this.dancers = [];
    var dancerColor = [ Color.red, Color.green, Color.magenta, Color.blue, Color.yellow,
                        Color.cyan, Color.lightGray ];
    var hexnumbers = [ "A","E","I","B","F","J",
                       "C","G","K","D","H","L",' ' ];
    var hexcouples = [ "1", "3", "5", "1", "3", "5",
                       "2", "4", "6", "2", "4", "6", ' ' ];
    //  Generate hexagon dancers
    for (var i=0; i<this.saveDancers.length; i+=2) {
      var j = Math.floor(i/4);
      var jj = j <= 1 ? [j,j+2,j+4] : [6, 6, 6];
      var isPh = this.saveDancers[i].gender == Dancer.PHANTOM;
      this.dancers.push(new Dancer({dancer:this.saveDancers[i],
                                    angle:30,
                                    color:dancerColor[jj[0]],
                                    hidden: isPh && !this.showPhantoms,
                                    number:isPh?' ':hexnumbers[i/2*3],
                                    couplesnumber:isPh?' ':hexcouples[i/2*3]}));
      this.dancers.push(new Dancer({dancer:this.saveDancers[i],
                                    angle:150,
                                    color:dancerColor[jj[1]],
                                    hidden: isPh && !this.showPhantoms,
                                    number:isPh?' ':hexnumbers[i/2*3+1],
                                    couplesnumber:isPh?' ':hexcouples[i/2*3+1]}));
      this.dancers.push(new Dancer({dancer:this.saveDancers[i],
                                    angle:270,
                                    color:dancerColor[jj[2]],
                                    hidden: isPh && !this.showPhantoms,
                                    number:isPh?' ':hexnumbers[i/2*3+2],
                                    couplesnumber:isPh?' ':hexcouples[i/2*3+2]}));
    }
    //  Convert to hexagon positions and paths
    for (var i=0; i<this.dancers.length; i++) {
      this.hexagonify(this.dancers[i],30+(i%3)*120);
    }
  },

  convertToBigon: function()
  {
    //  Save current dancers
    for (var i in this.dancers)
      this.dancers[i].hide();
    this.saveDancers = this.dancers;
    this.dancers = [];
    var dancerColor = [ Color.red, Color.yellow, Color.green, Color.blue,
                        Color.magenta, Color.cyan ];
    for (var i=0; i<this.saveDancers.length; i+=2) {
      var j = Math.floor(i/2);
      var isPh = this.saveDancers[i].gender == Dancer.PHANTOM;
      var numstr = isPh ? ' ' : (j+1)+'';
      this.dancers.push(new Dancer({dancer:this.saveDancers[i],
                                    number:numstr,couplesnumber:numstr,
                                    hidden: isPh && !this.showPhantoms,
                                    color:dancerColor[j]}));
    }
    //  Generate BIgon dancers
    for (var i=0; i<this.dancers.length; i++) {
      this.bigonify(this.dancers[i]);
    }
    this.bigoncentergroup.setAttribute('visibility','visible');

  },

  revertFromHexagon: function()
  {
    for (var i in this.dancers)
      this.dancers[i].hide();
    this.dancers = this.saveDancers;
    for (var i in this.dancers)
      if (this.dancers[i].gender != Dancer.PHANTOM || this.showPhantoms)
      this.dancers[i].show();
    this.animate();
  },

  revertFromBigon: function()
  {
    this.bigoncentergroup.setAttribute('visibility','hidden');
    //  Just restore the saved dancers
    this.revertFromHexagon();
  },

  //  Moves the position and angle of a dancer from square to hexagon
  hexagonify: function(d,a)
  {
    a = a*Math.PI/180;
    var x = d.startx;
    var y = d.starty;
    var r = Math.sqrt(x*x+y*y);
    var angle = Math.atan2(y,x);
    var dangle = 0.0;
    if (angle < 0)
      dangle = -(Math.PI+angle)/3;
    else
      dangle = (Math.PI-angle)/3;
    d.startx = r*Math.cos(angle+dangle+a);
    d.starty = r*Math.sin(angle+dangle+a);
    d.startangle += dangle*180/Math.PI;
    d.computeStart();
    d.recalculate();
  },

  bigonify: function(d)
  {
    var cangle = Math.PI/2.0;
    var x = d.startx;
    var y = d.starty;
    var r = Math.sqrt(x*x+y*y);
    var angle = Math.atan2(y,x)+cangle;
    var bigangle = angle*2-cangle;
    d.startx = r*Math.cos(bigangle);
    d.starty = r*Math.sin(bigangle);
    d.startangle += angle*180/Math.PI;
    d.computeStart();
    d.recalculate();
  }


};
////////////////////////////////////////////////////////////////////////////////
//  Handhold class for computing the potential handhold between two dancers
//  The actual graphic hands are part of the Dancer object

//  Properties of Handhold object
//  Dancer d1,d2;
//  int h1,h2;
//  angle ah1, ah2; (in radians)
//  double score;
//  private boolean isincenter = false;
//  public static double dfactor0 = 1.0;
Handhold = defineClass(
  function(/*Dancer*/ dd1, /*Dancer*/ dd2,
             /*int*/ hh1, /*int*/ hh2, /*angle*/ ahh1, ahh2, /*distance*/ d, s)
  {
    this.d1 = dd1;
    this.d2 = dd2;
    this.h1 = hh1;
    this.h2 = hh2;
    this.ah1 = ahh1;
    this.ah2 = ahh2;
    this.distance = d;
    this.score = s;
  });

  //  If two dancers can hold hands, create and return a handhold.
  //  Else return null.
Handhold.getHandhold = function(/*Dancer*/ d1, /*Dancer*/ d2)
{
  if (d1.hidden || d2.hidden)
    return null;
  //  Turn off grips if not specified in current movement
  if ((d1.hands & Movement.GRIPRIGHT) != Movement.GRIPRIGHT)
    d1.rightgrip = null;
  if ((d1.hands & Movement.GRIPLEFT) != Movement.GRIPLEFT)
    d1.leftgrip = null;
  if ((d2.hands & Movement.GRIPRIGHT) != Movement.GRIPRIGHT)
    d2.rightgrip = null;
  if ((d2.hands & Movement.GRIPLEFT) != Movement.GRIPLEFT)
    d2.leftgrip = null;


  //  Check distance
  var x1 = d1.tx.getTranslateX();
  var y1 = d1.tx.getTranslateY();
  var x2 = d2.tx.getTranslateX();
  var y2 = d2.tx.getTranslateY();
  var dx = x2-x1;
  var dy = y2-y1;
  var dfactor1 = 0.1;  // for distance up to 2.0
  var dfactor2 = 2.0;  // for distance past 2.0
  var cutover = 2.0;
  if (d1.tamsvg.hexagon)
    cutover = 2.5;
  if (d1.tamsvg.bigon)
    cutover = 3.7;
  var d = Math.sqrt(dx*dx+dy*dy);
  var d0 = d*Handhold.dfactor0;
  var score1 = d0 > cutover ? (d0-cutover)*dfactor2+2*dfactor1 : d0*dfactor1;
  var score2 = score1;
  //  Angle between dancers
  var a0 = Math.atan2(dy,dx);
  //  Angle each dancer is facing
  var a1 = Math.atan2(d1.tx.getShearY(),d1.tx.getScaleY());
  var a2 = Math.atan2(d2.tx.getShearY(),d2.tx.getScaleY());
  //  For each dancer, try left and right hands
  var h1 = 0;
  var h2 = 0;
  var ah1 = 0;
  var ah2 = 0;
  var afactor1 = 0.2;
  var afactor2 = 1.0;
  if (d1.tamsvg.bigon)
    afactor2 = 0.6;
  //  Dancer 1
  var a = Math.abs(Math.IEEEremainder(Math.abs(a1-a0+Math.PI*3/2),Math.PI*2));
  var ascore = a > Math.PI/6 ? (a-Math.PI/6)*afactor2+Math.PI/6*afactor1
                                : a*afactor1;
  if (score1+ascore < 1.0 && (d1.hands & Movement.RIGHTHAND) != 0 &&
      d1.rightgrip==null || d1.rightgrip==d2) {
    score1 = d1.rightgrip==d2 ? 0.0 : score1 + ascore;
    h1 = Movement.RIGHTHAND;
    ah1 = a1-a0+Math.PI*3/2;
  } else {
    a = Math.abs(Math.IEEEremainder(Math.abs(a1-a0+Math.PI/2),Math.PI*2));
    ascore = a > Math.PI/6 ? (a-Math.PI/6)*afactor2+Math.PI/6*afactor1
                           : a*afactor1;
    if (score1+ascore < 1.0 && (d1.hands & Movement.LEFTHAND) != 0 &&
        d1.leftgrip==null || d1.leftgrip==d2) {
      score1 = d1.leftgrip==d2 ? 0.0 : score1 + ascore;
      h1 = Movement.LEFTHAND;
      ah1 = a1-a0+Math.PI/2;
    } else
      score1 = 10;
  }
  //  Dancer 2
  a = Math.abs(Math.IEEEremainder(Math.abs(a2-a0+Math.PI/2),Math.PI*2));
  ascore = a > Math.PI/6 ? (a-Math.PI/6)*afactor2+Math.PI/6*afactor1
                         : a*afactor1;
  if (score2+ascore < 1.0 && (d2.hands & Movement.RIGHTHAND) != 0 &&
      d2.rightgrip==null || d2.rightgrip==d1) {
    score2 = d2.rightgrip==d1 ? 0.0 : score2 + ascore;
    h2 = Movement.RIGHTHAND;
    ah2 = a2-a0+Math.PI/2;
  } else {
    a = Math.abs(Math.IEEEremainder(Math.abs(a2-a0+Math.PI*3/2),Math.PI*2));
    ascore = a > Math.PI/6 ? (a-Math.PI/6)*afactor2+Math.PI/6*afactor1
                           : a*afactor1;
    if (score2+ascore < 1.0 && (d2.hands & Movement.LEFTHAND) != 0 &&
        d2.leftgrip==null || d2.leftgrip==d1) {
      score2 = d2.leftgrip==d1 ? 0.0 : score2 + ascore;
      h2 = Movement.LEFTHAND;
      ah2 = a2-a0+Math.PI*3/2;
    } else
      score2 = 10;
  }

  if (d1.rightgrip == d2 && d2.rightgrip == d1)
    return new Handhold(d1,d2,Movement.RIGHTHAND,Movement.RIGHTHAND,ah1,ah2,d,0);
  if (d1.rightgrip == d2 && d2.leftgrip == d1)
    return new Handhold(d1,d2,Movement.RIGHTHAND,Movement.LEFTHAND,ah1,ah2,d,0);
  if (d1.leftgrip == d2 && d2.rightgrip == d1)
    return new Handhold(d1,d2,Movement.LEFTHAND,Movement.RIGHTHAND,ah1,ah2,d,0);
  if (d1.leftgrip == d2 && d2.leftgrip == d1)
    return new Handhold(d1,d2,Movement.LEFTHAND,Movement.LEFTHAND,ah1,ah2,d,0);

  if (score1 > 1.0 || score2 > 1.0 || score1+score2 > 1.2)
    return null;
  return new Handhold(d1,d2,h1,h2,ah1,ah2,d,score1+score2);
};

/* boolean */
Handhold.prototype.inCenter = function()
{
  var x1 = this.d1.tx.getTranslateX();
  var y1 = this.d1.tx.getTranslateY();
  var x2 = this.d2.tx.getTranslateX();
  var y2 = this.d2.tx.getTranslateY();
  this.isincenter = Math.sqrt(x1*x1+y1*y1) < 1.1 &&
         Math.sqrt(x2*x2+y2*y2) < 1.1;
  if (this.isincenter) {
    this.ah1 = 0;
    this.ah2 = 0;
    this.distance = 2.0;
  }
  return this.isincenter;
};

//  Make the handhold visible
Handhold.prototype.paint = function()
{
  //  Scale should be 1 if distance is 2
  var scale = this.distance/2;
  if (this.h1 == Movement.RIGHTHAND || this.h1 == Movement.GRIPRIGHT) {
    if (!this.d1.rightHandVisibility) {
      this.d1.righthand.setAttribute('visibility','visible');
      this.d1.rightHandVisibility = true;
    }
    this.d1.rightHandNewVisibility = true;
    this.d1.rightHandTransform = AffineTransform.getRotateInstance(-this.ah1)
      .concatenate(AffineTransform.getScaleInstance(scale,scale));
  }
  if (this.h1 == Movement.LEFTHAND || this.h1 == Movement.GRIPLEFT) {
    if (!this.d1.leftHandVisibility) {
      this.d1.lefthand.setAttribute('visibility','visible');
      this.d1.leftHandVisibility = true;
    }
    this.d1.leftHandNewVisibility = true;
    this.d1.leftHandTransform = AffineTransform.getRotateInstance(-this.ah1)
      .concatenate(AffineTransform.getScaleInstance(scale,scale));
  }
  if (this.h2 == Movement.RIGHTHAND || this.h2 == Movement.GRIPRIGHT) {
    if (!this.d2.rightHandVisibility) {
      this.d2.righthand.setAttribute('visibility','visible');
      this.d2.rightHandVisibility = true;
    }
    this.d2.rightHandNewVisibility = true;
    this.d2.rightHandTransform = AffineTransform.getRotateInstance(-this.ah2)
      .concatenate(AffineTransform.getScaleInstance(scale,scale));
  }
  if (this.h2 == Movement.LEFTHAND || this.h2 == Movement.GRIPLEFT) {
    if (!this.d2.leftHandVisibility) {
      this.d2.lefthand.setAttribute('visibility','visible');
      this.d2.leftHandVisibility = true;
    }
    this.d2.leftHandNewVisibility = true;
    this.d2.leftHandTransform = AffineTransform.getRotateInstance(-this.ah2)
      .concatenate(AffineTransform.getScaleInstance(scale,scale));
  }
};
////////////////////////////////////////////////////////////////////////////////
//  Dancer class
Dancer = defineClass(
function(args)   // (tamsvg,sex,x,y,angle,color,p,number,couplesnumber)
{
  this.startangle = 0;
  this.path = new Path();
  if (args.tamsvg)
    this.tamsvg = args.tamsvg;
  if (args.dancer) {
    var props = ['tamsvg','fillcolor','drawcolor','startx','starty','startangle','gender','number'];
    for (var i in props)
      this[props[i]] = args.dancer[props[i]];
    this.path = new Path(args.dancer.path);
  }
  if (args.gender)
    this.gender = args.gender;
  if (args.x !== undefined)
    this.startx = args.x;
  if (args.y !== undefined)
    this.starty = -args.y;
  if (args.angle !== undefined) {
    if (args.dancer)
      this.startangle += args.angle;
    else
      this.startangle = args.angle-90;
  }
  if (this.gender == Dancer.PHANTOM) {
    this.fillcolor = Color.gray;
    this.drawcolor = this.fillcolor.darker();
  }
  else if (args.color !== undefined) {
    this.fillcolor = args.color;
    this.drawcolor = args.color.darker();
  }
  if (args.path)
    this.path = new Path(args.path);
  if (args.number !== undefined)
    this.number = args.number;
  if (args.couplesnumber !== undefined)
    this.couplesnumber = args.couplesnumber;

  this.hidden = false;
  this.pathVisible = this.tamsvg.showPaths;
  this.leftgrip = null;
  this.rightgrip = null;
  this.rightHandVisibility = false;
  this.leftHandVisibility = false;
  this.rightHandTransform = new AffineTransform();
  this.leftHandTransform = new AffineTransform();
  this.prevangle = 0;
  this.computeStart();
  if (!args.color)
    return;
  //  Create SVG representation
  this.svg = this.tamsvg.svg.group(this.tamsvg.dancegroup);
  var dancer = this;
  //  Show popup on shift-click or right-click
  $(document).bind("contextmenu",function() { return false; });
  $(this.svg).mousedown(function(ev) {
    $('#popup').hide();
    if (ev.shiftKey || ev.ctrlKey || ev.which==3) {

      $('#HexagonPopupItem').attr("checked",dancer.tamsvg.hexagon);
      $('#HexagonPopupItem').unbind();
      $('#HexagonPopupItem').change(function() {
        dancer.tamsvg.toggleHexagon();
        $('#popup').hide();
      });

      $('#BigonPopupItem').attr("checked",dancer.tamsvg.bigon);
      $('#BigonPopupItem').unbind();
      $('#BigonPopupItem').change(function() {
        dancer.tamsvg.toggleBigon();
        $('#popup').hide();
      });

      $('#BarstoolPopupItem').attr("checked",dancer==dancer.tamsvg.barstool);
      $('#BarstoolPopupItem').unbind();
      $('#BarstoolPopupItem').change(function() {
        if ($(this).attr("checked"))
          dancer.tamsvg.barstool = dancer;
        else
          dancer.tamsvg.barstool = 0;
        $('#popup').hide();
        dancer.tamsvg.animate();
      });

      $('#CompassPopupItem').attr("checked",dancer==dancer.tamsvg.compass);
      $('#CompassPopupItem').unbind();
      $('#CompassPopupItem').change(function() {
        if ($(this).attr("checked"))
          dancer.tamsvg.compass = dancer;
        else
          dancer.tamsvg.compass = 0;
        $('#popup').hide();
        dancer.tamsvg.animate();
      });
      $('#popup').css("top",ev.pageY).css("left",ev.pageX).show();
      return false;  // prevent interception by dance floor
    }
    else if (ev.altKey) {
      if (dancer.pathVisible)
        dancer.hidePath();
      else
        dancer.showBezier();
    }
    else {
      if (dancer.pathVisible)
        dancer.hidePath();
      else
        dancer.showPath();
    }
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  });
  //  handholds
  this.lefthand = this.tamsvg.svg.group(this.tamsvg.handholds,{visibility:'hidden'});
  this.tamsvg.svg.circle(this.lefthand,0,1,1/8,{fill:Color.orange.toString()});
  this.tamsvg.svg.line(this.lefthand,0,0,0,1,{stroke:Color.orange.toString(),'stroke-width':0.05});
  this.righthand = this.tamsvg.svg.group(this.tamsvg.handholds,{visibility:'hidden'});
  this.tamsvg.svg.circle(this.righthand,0,-1,1/8,{fill:Color.orange.toString()});
  this.tamsvg.svg.line(this.righthand,0,0,0,-1,{stroke:Color.orange.toString(),'stroke-width':0.05});
  //  body
  this.tamsvg.svg.circle(this.svg,.5,0,1/3,{fill:this.drawcolor.toString()});
  if (this.gender == Dancer.BOY)
    this.body = this.tamsvg.svg.rect(this.svg,-.5,-.5,1,1,
             {fill:this.fillcolor.toString(),
              stroke:this.drawcolor.toString(),'stroke-width':0.1});
  if (this.gender == Dancer.GIRL)
    this.body = this.tamsvg.svg.circle(this.svg,0,0,.5,
               {fill:this.fillcolor.toString(),
                stroke:this.drawcolor.toString(),'stroke-width':0.1});
  if (this.gender == Dancer.PHANTOM)
    this.body = this.tamsvg.svg.rect(this.svg,-.5,-.5,1,1,.2,.2,      // with rounded corners
             {fill:this.fillcolor.toString(),
              stroke:this.drawcolor.toString(),'stroke-width':0.1});
  this.numbersvg = this.tamsvg.svg.text(this.svg,-4,5,this.number,{fontSize: "14",transform:"scale(0.04 -0.04)"});
  this.couplessvg = this.tamsvg.svg.text(this.svg,-4,5,this.couplesnumber,{fontSize: "14",transform:"scale(0.04 -0.04)"});
  if (this.tamsvg.numbers || this.tamsvg.couples)
    this.body.setAttribute('fill',this.fillcolor.veryBright().toString());
  if (!this.tamsvg.numbers)
    this.numbersvg.setAttribute('visibility','hidden');
  if (!this.tamsvg.couples)
    this.couplessvg.setAttribute('visibility','hidden');
  //  path
  this.pathgroup = this.tamsvg.svg.group(this.tamsvg.pathparent);
  this.beziergroup = this.tamsvg.svg.group(this.tamsvg.pathparent);
  this.paintPath();
  if (args.hidden != undefined && args.hidden)
    this.hide();
});
Dancer.BOY = 1;
Dancer.GIRL = 2;
Dancer.PHANTOM = 3;
Dancer.genders =
  { 'boy':Dancer.BOY, 'girl':Dancer.GIRL, 'phantom':Dancer.PHANTOM };

Dancer.prototype.hidePath = function()
{
  this.pathgroup.setAttribute('visibility','hidden');
  this.beziergroup.setAttribute('visibility','hidden');
  this.pathVisible = false;
};

Dancer.prototype.showPath = function()
{
  this.pathgroup.setAttribute('visibility','visible');
  this.pathVisible = true;
};

Dancer.prototype.showBezier = function()
{
  this.pathgroup.setAttribute('visibility','visible');
  this.beziergroup.setAttribute('visibility','visible');
  this.pathVisible = true;
};

Dancer.prototype.hide = function()
{
  this.hidden = true;
  this.svg.setAttribute('visibility','hidden');
  this.lefthand.setAttribute('visibility','hidden');
  this.righthand.setAttribute('visibility','hidden');
  this.pathgroup.setAttribute('visibility','hidden');
  this.beziergroup.setAttribute('visibility','hidden');
  this.numbersvg.setAttribute('visibility','hidden');
  this.couplessvg.setAttribute('visibility','hidden');
};

Dancer.prototype.show = function()
{
  this.hidden = false;
  this.svg.setAttribute('visibility','visible');
  if (this.leftHandVisibility)
    this.lefthand.setAttribute('visibility','visible');
  if (this.rightHandVisibility)
    this.righthand.setAttribute('visibility','visible');
  this.pathgroup.setAttribute('visibility','inherit');
  if (this.tamsvg.numbers)
    this.numbersvg.setAttribute('visibility','visible');
  if (this.tamsvg.couples)
    this.couplessvg.setAttribute('visibility','visible');
};

Dancer.prototype.computeStart = function()
{
  this.start = new AffineTransform();
  this.start.translate(this.startx,this.starty);
  this.start.rotate(Math.toRadians(this.startangle));
  this.tx = new AffineTransform(this.start);
  if (this.svg)
    this.svg.setAttribute('transform',this.start.toString());
};

Dancer.prototype.beats = function()
{
  var b = 0;
  if (this.path != null) {
    for (var i in this.path.movelist)
      b += this.path.movelist[i].beats;
  }
  return b;
};

Dancer.prototype.showNumber = function()
{
  this.body.setAttribute('fill',this.fillcolor.veryBright().toString());
  if (!this.hidden) {
    this.couplessvg.setAttribute('visibility','hidden');
    this.numbersvg.setAttribute('visibility','visible');
    this.paint();
  }
};

Dancer.prototype.showCouplesNumber = function()
{
  this.body.setAttribute('fill',this.fillcolor.veryBright().toString());
  if (!this.hidden) {
    this.numbersvg.setAttribute('visibility','hidden');
    this.couplessvg.setAttribute('visibility','visible');
    this.paint();
  }
};

Dancer.prototype.hideNumbers = function()
{
  this.body.setAttribute('fill',this.fillcolor.toString());
  this.numbersvg.setAttribute('visibility','hidden');
  this.couplessvg.setAttribute('visibility','hidden');
};

Dancer.prototype.recalculate = function(debug)
{
  this.path.recalculate(debug);
  this.paintPath();
};

//  Return location as a Vector object
Dancer.prototype.location = function()
{
  return new Vector(this.tx.getTranslateX(),this.tx.getTranslateY());
};

//  Return distance from center
Dancer.prototype.distance = function()
{
  var x = this.tx.getTranslateX();
  var y = this.tx.getTranslateY();
  return Math.sqrt(x*x+y*y);
};

//  Return angle from dancer's facing direction to center
Dancer.prototype.centerAngle = function()
{
  var a1 = Math.atan2(this.tx.getTranslateY(),this.tx.getTranslateX());
  return this.tx.getAngle() + a1;
};

Dancer.prototype.concatenate = function(tx2)
{
  this.tx.preConcatenate(tx2);
  this.svg.setAttribute('transform',tx2.toString());
};

Dancer.prototype.paintPath = function()
{
  this.paintBezier();
  this.tamsvg.svg.remove(this.pathgroup);
  this.pathgroup = this.tamsvg.svg.group(this.tamsvg.pathparent);
  var points=[];
  for (var b=0; b<this.beats(); b+=0.1) {
    this.animate(b);
    if (this.tamsvg.hexagon)
      this.hexagonify(b);
    if (this.tamsvg.bigon)
      this.bigonify(b);
    points.push([this.tx.getTranslateX(),this.tx.getTranslateY()]);
  }
  this.tamsvg.svg.polyline(this.pathgroup,points,
      {fill:'none',stroke:this.drawcolor.toString(),strokeWidth:0.1,strokeOpacity:.3});
};

Dancer.prototype.paintBezier = function()
{
  var ff = function(x,y,t) {
    var v = (new Vector(x,y)).preConcatenate(t);
    return [v.x,v.y];
  };
  this.tamsvg.svg.remove(this.beziergroup);
  this.beziergroup = this.tamsvg.svg.group(this.tamsvg.pathparent);
  var points=[];
  var t = this.start;
  for (var i in this.path.movelist) {
    var m = this.path.movelist[i];
    var pt = ff(0,0,t);
    points.push(pt);
    this.tamsvg.svg.circle(this.beziergroup,pt[0],pt[1],0.2,{fill:this.drawcolor.toString()});
    pt = ff(m.btranslate.ctrlx1,m.btranslate.ctrly1,t);
    points.push(pt);
    this.tamsvg.svg.circle(this.beziergroup,pt[0],pt[1],0.2,{fill:this.drawcolor.toString(),fillOpacity:.3});
    pt = ff(m.btranslate.ctrlx2,m.btranslate.ctrly2,t);
    points.push(pt);
    this.tamsvg.svg.circle(this.beziergroup,pt[0],pt[1],0.2,{fill:this.drawcolor.toString(),fillOpacity:.3});
    pt = ff(m.btranslate.x2,m.btranslate.y2,t);
    points.push(pt);
    this.tamsvg.svg.circle(this.beziergroup,pt[0],pt[1],0.2,{fill:this.drawcolor.toString()});
    t = new AffineTransform(this.start);
    t.concatenate(this.path.transformlist[i]);
  }
  this.tamsvg.svg.polyline(this.beziergroup,points,
      {fill:'none',stroke:'black',strokeWidth:0.1,strokeOpacity:.3});
};

//  Compute and apply the transform for a specific time
var count = 0;
Dancer.prototype.animate = function(beat)
{
  // Be sure to reset grips at start
  if (beat == 0)
    this.rightgrip = this.leftgrip = null;
  //  Start to build transform
  //  Apply all completed movements
  this.tx = new AffineTransform(this.start);
  var m = null;
  if (this.path != null) {
    for (var i=0; i<this.path.movelist.length; i++) {
      m = this.path.movelist[i];
      if (beat >= this.path.movelist[i].beats) {
        this.tx = new AffineTransform(this.start);
        this.tx.concatenate(this.path.transformlist[i]);
        beat -= this.path.movelist[i].beats;
        m = null;
      } else
        break;
    }
  }
  //  Apply movement in progress
  if (m != null) {
    this.tx.concatenate(m.translate(beat));
    this.tx.concatenate(m.rotate(beat));
    if (beat < 0)
      this.hands = Movement.BOTHHANDS;
    else
      this.hands = m.usehands;
    if ((m.usehands & Movement.GRIPLEFT) == 0)
      this.leftgrip = null;
    if ((m.usehands & Movement.GRIPRIGHT) == 0)
      this.rightgrip = null;
  }
  else  // End of movement
    this.hands = Movement.BOTHHANDS;  // hold hands in ending formation
  this.angle = Math.toDegrees(this.tx.getAngle());
};
Dancer.prototype.hexagonify = function(beat)
{
  var a0 = Math.atan2(this.starty,this.startx);  // hack
  var a1 = Math.atan2(this.tx.getTranslateY(),this.tx.getTranslateX());
  //  Correct for wrapping around +/- pi
  if (beat <= 0.0)
    this.prevangle = a1;
  var wrap = Math.round((a1-this.prevangle)/(Math.PI*2));
  a1 -= wrap*Math.PI*2;
  var a2 = -(a1-a0)/3;
  this.concatenate(AffineTransform.getRotateInstance(a2));
  this.prevangle = a1;
};

Dancer.prototype.bigonify = function(beat)
{
  var a0 = Math.atan2(this.starty,this.startx);  // hack
  var a1 = Math.atan2(this.tx.getTranslateY(),this.tx.getTranslateX());
  //  Correct for wrapping around +/- pi
  if (beat <= 0.0)
    this.prevangle = a1;
  var wrap = Math.round((a1-this.prevangle)/(Math.PI*2));
  a1 -= wrap*Math.PI*2;
  var a2 = +(a1-a0);
  this.concatenate(AffineTransform.getRotateInstance(a2));
  this.prevangle = a1;
};

Dancer.prototype.paint = function()
{
  this.svg.setAttribute('transform',this.tx.toString());
  if (this.gender == Dancer.PHANTOM)
    this.svg.setAttribute('opacity',0.6);
  this.righthand.setAttribute('transform',
      new AffineTransform(this.tx).concatenate(this.rightHandTransform).toString());
  this.lefthand.setAttribute('transform',
      new AffineTransform(this.tx).concatenate(this.leftHandTransform).toString());
  if (this.tamsvg.numbers || this.tamsvg.couples) {
    var a = this.tx.getAngle();
    var t1 = AffineTransform.getScaleInstance(0.04,-0.04);
    var t2 = AffineTransform.getRotateInstance(a);
    if (this.tamsvg.numbers)
      this.numbersvg.setAttribute('transform',t1.concatenate(t2).toString());
    else
      this.couplessvg.setAttribute('transform',t1.concatenate(t2).toString());
  }
};

////////////////////////////////////////////////////////////////////////////////
//  Path class
Path = defineClass(
  function(p)
  {
    this.movelist = [];
    this.transformlist = [];
    if (p instanceof Path) {
      for (var m in p.movelist)
        this.add(p.movelist[m].clone());
    }
    else if (p && (p.select != undefined)) {
      var mm = tam.translateMove(p);
      for (var m in mm)
        this.add(new Movement(mm[m]));
    }
    else if (p instanceof Movement) {
      this.add(p.clone());
    }
    else if (p) {
      for (var i=0; i<p.length; i++) {
        if (p[i] instanceof Movement)
          this.add(p[i]);
        else if (p[i].cx1 != undefined)
          this.add(new Movement(p[i]));
        else
          this.add(new Path(p[i]));
      }
    }
  });

Path.prototype.clear = function()
{
  this.movelist = [];
  this.transformlist = [];
};

Path.prototype.recalculate = function()
{
  this.transformlist = [];
  var tx = new AffineTransform();
  for (var i in this.movelist) {
    var tt = this.movelist[i].translate(999);
    tx.concatenate(tt);
    var tr = this.movelist[i].rotate(999);
    tx.concatenate(tr);
    this.transformlist.push(new AffineTransform(tx));
  }
};

//  Return total number of beats in path
Path.prototype.beats = function()
{
  var b = 0.0;
  if (this.movelist != null) {
    for (var i in this.movelist)
      b += this.movelist[i].beats;
  }
  return b;
};

//  Make the path run slower or faster to complete in a given number of beats
Path.prototype.changebeats = function(newbeats)
{
  if (this.movelist != null) {
    var factor = newbeats/this.beats();
    for (var i in this.movelist)
      this.movelist[i].beats *= factor;
  }
};

//  Change hand usage
Path.prototype.changehands = function(hands)
{
  if (this.movelist != null) {
    for (var i in this.movelist)
      this.movelist[i].useHands(hands);
  }
};

//  Change the path by scale factors
Path.prototype.scale = function(x,y)
{
  if (this.movelist != null) {
    for (var i in this.movelist)
      this.movelist[i].scale(x,y);
  }
};

//  Skew the path by translating the destination point
Path.prototype.skew = function(x,y)
{
  if (self.movelist != null) {
    for (var i in this.movelist)
      this.movelist[i].skew(x,y);
  }
};

//  Append one movement to the end of the Path
Path.prototype.add = function(m)
{
  if (m instanceof Movement)
    this.movelist.push(m);
  if (m instanceof Path)
    this.movelist = this.movelist.concat(m.movelist);
  this.recalculate();
  return this;
};

//  Reflect the path about the x-axis
Path.prototype.reflect = function()
{
  for (var i in this.movelist)
    this.movelist[i].reflect();
  this.recalculate();
  return this;
};

////////////////////////////////////////////////////////////////////////////////
//  Movement class
Movement = defineClass(
  //  Constructor for independent heading and movement
  function(h,b,ctrlx1,ctrly1,ctrlx2,ctrly2,x2,y2,
           ctrlx3,ctrly3,ctrlx4,ctrly4,x4,y4)
  {
    if (arguments.length == 1) {
      b = h.beats;
      ctrlx1 = h.cx1;
      ctrly1 = h.cy1;
      ctrlx2 = h.cx2;
      ctrly2 = h.cy2;
      x2 = h.x2;
      y2 = h.y2;
      ctrlx3 = h.cx3;
      ctrly3 = 0;
      ctrlx4 = h.cx4;
      ctrly4 = h.cy4;
      x4 = h.x4;
      y4 = h.y4;
      h = h.hands;
    }
    this.btranslate = new Bezier(0,0,ctrlx1,ctrly1,ctrlx2,ctrly2,x2,y2);
    this.numargs = arguments.length;
    this.myargs = [];
    for (var i in arguments)
      this.myargs[i] = arguments[i];
    if (ctrlx3 != undefined)
      this.brotate = new Bezier(0,0,ctrlx3,ctrly3,ctrlx4,ctrly4,x4,y4);
    else
      this.brotate = new Bezier(0,0,ctrlx1,ctrly1,ctrlx2,ctrly2,x2,y2);
    this.beats = b;
    if (typeof h == "string")
      this.usehands = Movement.setHands[h];
    else
      this.usehands = h;
  });

Movement.NOHANDS = 0;
Movement.LEFTHAND = 1;
Movement.RIGHTHAND = 2;
Movement.BOTHHANDS = 3;
Movement.GRIPLEFT = 5;
Movement.GRIPRIGHT = 6;
Movement.GRIPBOTH =  7;
Movement.ANYGRIP =  4;
Movement.setHands = { "none": Movement.NOHANDS,
                      "left": Movement.LEFTHAND,
                      "right": Movement.RIGHTHAND,
                      "both": Movement.BOTHHANDS,
                      "gripleft": Movement.GRIPLEFT,
                      "gripright": Movement.GRIPRIGHT,
                      "gripboth": Movement.GRIPBOTH,
                      "anygrip": Movement.ANYGRIP };

Movement.prototype.useHands = function(h)
{
  this.usehands = h;
  return this;
};

Movement.prototype.clone = function()
{
  var m = new Movement(this.usehands,
                       this.beats,
                       this.btranslate.ctrlx1,this.btranslate.ctrly1,
                       this.btranslate.ctrlx2,this.btranslate.ctrly2,
                       this.btranslate.x2,this.btranslate.y2,
                       this.brotate.ctrlx1,this.brotate.ctrly1,
                       this.brotate.ctrlx2,this.brotate.ctrly2,
                       this.brotate.x2,this.brotate.y2);
  return m;
};

Movement.prototype.translate = function(t) {
  var tt = Math.min(Math.max(0,t),this.beats);
  return this.btranslate.translate(tt/this.beats);
};

Movement.prototype.reflect = function()
{
  return this.scale(1,-1);
};

Movement.prototype.rotate = function(t)
{
  var tt = Math.min(Math.max(0,t),this.beats);
  return this.brotate.rotate(tt/this.beats);
};

Movement.prototype.scale = function(x,y)
{
  this.btranslate = new Bezier(0,0,this.btranslate.ctrlx1*x,
                                   this.btranslate.ctrly1*y,
                                   this.btranslate.ctrlx2*x,
                                   this.btranslate.ctrly2*y,
                                   this.btranslate.x2*x,
                                   this.btranslate.y2*y);
  this.brotate = new Bezier(0,0,this.brotate.ctrlx1*x,
                                this.brotate.ctrly1*y,
                                this.brotate.ctrlx2*x,
                                this.brotate.ctrly2*y,
                                this.brotate.x2*x,
                                this.brotate.y2*y);
  if (y < 0) {
    if (this.usehands == Movement.LEFTHAND)
      this.usehands = Movement.RIGHTHAND;
    else if (this.usehands == Movement.RIGHTHAND)
      this.usehands = Movement.LEFTHAND;
  }
  return this;
};

Movement.prototype.toString = function()
{
  return this.btranslate.toString() + ' '+this.brotate.toString();
};
////////////////////////////////////////////////////////////////////////////////
//  Bezier class
Bezier = defineClass(
  function (x1,y1,ctrlx1,ctrly1,ctrlx2,ctrly2,x2,y2)
  {
    this.x1 = x1;
    this.y1 = y1;
    this.ctrlx1 = ctrlx1;
    this.ctrly1 = ctrly1;
    this.ctrlx2 = ctrlx2;
    this.ctrly2 = ctrly2;
    this.x2 = x2;
    this.y2 = y2;
    this.calculatecoefficients();
  });

Bezier.prototype.calculatecoefficients = function()
{
  this.cx = 3.0*(this.ctrlx1-this.x1);
  this.bx = 3.0*(this.ctrlx2-this.ctrlx1) - this.cx;
  this.ax = this.x2 - this.x1 - this.cx - this.bx;

  this.cy = 3.0*(this.ctrly1-this.y1);
  this.by = 3.0*(this.ctrly2-this.ctrly1) - this.cy;
  this.ay = this.y2 - this.y1 - this.cy - this.by;
};

//  Return the movement along the curve given "t" between 0 and 1
Bezier.prototype.translate = function(t)
{
  var x = this.x1 + t*(this.cx + t*(this.bx + t*this.ax));
  var y = this.y1 + t*(this.cy + t*(this.by + t*this.ay));
  return AffineTransform.getTranslateInstance(x,y);
};

//  Return the angle of the derivative given "t" between 0 and 1
Bezier.prototype.rotate = function(t)
{

  var x = this.cx + t*(2.0*this.bx + t*3.0*this.ax);
  var y = this.cy + t*(2.0*this.by + t*3.0*this.ay);
  var theta = Math.atan2(y,x);
  return AffineTransform.getRotateInstance(theta);
};

Bezier.prototype.toString = function()
{
  return '[ '+this.x1.toFixed(1)+' '+this.y1.toFixed(1)+' '+
              this.ctrlx1.toFixed(1)+' '+this.ctrly1.toFixed(1)+' '+
              this.ctrlx2.toFixed(1)+' '+this.ctrly2.toFixed(1)+' '+
              this.x2.toFixed(1)+' '+this.y2.toFixed(1)+' ]';
};
////////////////////////////////////////////////////////////////////////////////
//   Vector class
Vector = defineClass(
  function(x,y,z)
  {
    if (arguments.length > 0 && x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
      this.z = x.z;
    } else {
      this.x = arguments.length > 0 ? x : 0;
      this.y = arguments.length > 1 ? y : 0;
      this.z = arguments.length > 2 ? z : 0;
    }
  });

//  Add/subtract two vectors
Vector.prototype.add = function(v)
{
  return new Vector(thix.x+v.x,this.y+v.y,this.z+v.z);
};
Vector.prototype.subtract = function(v)
{
  return new Vector(this.x-v.x,this.y-v.y,this.z-v.z);
};
//  Compute the cross product
Vector.prototype.cross = function(v)
{
  return new Vector(
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
  );
};
//  Return angle of vector from the origin
Vector.prototype.angle = function()
{
  return Math.atan2(this.y,this.x);
};
//  Return distance from origin
Vector.prototype.distance = function()
{
  return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);
};
//  Rotate by a given angle
Vector.prototype.rotate = function(th)
{
  var d = Math.sqrt(this.x*this.x+this.y*this.y);
  var a = this.angle() + th;
  return new Vector(
      d * Math.cos(a),
      d * Math.sin(a),
      this.z);
};
//  Apply a transform
Vector.prototype.concatenate = function(tx)
{
  var vx = AffineTransform.getTranslateInstance(this.x,this.y);
  vx = vx.concatenate(tx);
  return new Vector(vx.getTranslateX(),vx.getTranslateY());
};
Vector.prototype.preConcatenate = function(tx)
{
  var vx = AffineTransform.getTranslateInstance(this.x,this.y);
  vx = vx.preConcatenate(tx);
  return new Vector(vx.getTranslateX(),vx.getTranslateY());
};

//  Return true if this vector followed by vector 2 is clockwise
Vector.prototype.isCW = function(v)
{
  return this.cross(v).z < 0;
};
Vector.prototype.isCCW = function(v)
{
  return this.cross(v).z > 0;
};

//  Return true if the vector from this to v points left of the origin
Vector.prototype.isLeft = function(v)
{
  var v1 = new Vector().subtract(this);
  var v2 = new Vector(v).subtract(this);
  return v1.isCCW(v2);
};

Vector.prototype.toString = function()
{
  return "("+Math.round(this.x*10)/10+","+Math.round(this.y*10)/10+")";
};
////////////////////////////////////////////////////////////////////////////////
//   AffineTransform class
AffineTransform = defineClass({
  construct: function(tx)
  {
    if (arguments.length == 0) {
      //  default constructor - return the identity matrix
      this.x1 = 1.0;
      this.x2 = 0.0;
      this.x3 = 0.0;
      this.y1 = 0.0;
      this.y2 = 1.0;
      this.y3 = 0.0;
    }
    else if (tx instanceof AffineTransform) {
      //  return a copy
      this.x1 = tx.x1;
      this.x2 = tx.x2;
      this.x3 = tx.x3;
      this.y1 = tx.y1;
      this.y2 = tx.y2;
      this.y3 = tx.y3;
    }
  }});

//  Generate a new transform that moves to a new location
AffineTransform.getTranslateInstance = function(x,y)
{
  var a = new AffineTransform();
  a.x3 = x;
  a.y3 = y;
  return a;
};
//  Generate a new transform that does a rotation
AffineTransform.getRotateInstance = function(theta)
{
  var ab = new AffineTransform();
  if (theta) {
    ab.y1 = Math.sin(theta);
    ab.x2 = -ab.y1;
    ab.x1 = Math.cos(theta);
    ab.y2 = ab.x1;
  }
  return ab;
};
//  Generate a new transform that does a scaling
AffineTransform.getScaleInstance = function(x,y)
{
  var a = new AffineTransform();
  a.scale(x,y);
  return a;
};

//  Add a translation to this transform
AffineTransform.prototype.translate = function(x,y)
{
  this.x3 += x*this.x1 + y*this.x2;
  this.y3 += x*this.y1 + y*this.y2;
};

//  Add a scaling to this transform
AffineTransform.prototype.scale = function(x,y)
{
  this.x1 *= x;
  this.y1 *= x;
  this.x2 *= y;
  this.y2 *= y;
};

//  Add a rotation to this transform
AffineTransform.prototype.rotate = function(angle)
{
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  var copy = new AffineTransform(this);
  //{ x1: this.x1, x2: this.x2, y1: this.y1, y2: this.y2 };
  this.x1 =  cos * copy.x1 + sin * copy.x2;
  this.x2 = -sin * copy.x1 + cos * copy.x2;
  this.y1 =  cos * copy.y1 + sin * copy.y2;
  this.y2 = -sin * copy.y1 + cos * copy.y2;
  return this;
};

AffineTransform.prototype.concatenate = function(tx)
{
  // [this] = [this] x [Tx]
  var copy = new AffineTransform(this);
  this.x1 = copy.x1 * tx.x1 + copy.x2 * tx.y1;
  this.x2 = copy.x1 * tx.x2 + copy.x2 * tx.y2;
  this.x3 = copy.x1 * tx.x3 + copy.x2 * tx.y3 + copy.x3;
  this.y1 = copy.y1 * tx.x1 + copy.y2 * tx.y1;
  this.y2 = copy.y1 * tx.x2 + copy.y2 * tx.y2;
  this.y3 = copy.y1 * tx.x3 + copy.y2 * tx.y3 + copy.y3;
  return this;
};

AffineTransform.prototype.preConcatenate = function(tx)
{
  // [this] = [Tx] x [this]
  var copy = { x1: this.x1, x2: this.x2, x3: this.x3,
      y1: this.y1, y2: this.y2, y3: this.y3 };
  this.x1 = tx.x1 * copy.x1 + tx.x2 * copy.y1;
  this.x2 = tx.x1 * copy.x2 + tx.x2 * copy.y2;
  this.x3 = tx.x1 * copy.x3 + tx.x2 * copy.y3 + tx.x3;
  this.y1 = tx.y1 * copy.x1 + tx.y2 * copy.y1;
  this.y2 = tx.y1 * copy.x2 + tx.y2 * copy.y2;
  this.y3 = tx.y1 * copy.x3 + tx.y2 * copy.y3 + tx.y3;
  return this;
};
AffineTransform.prototype.getScaleX = function()
{
  return this.x1;
};
AffineTransform.prototype.getScaleY = function()
{
  return this.y2;
};
AffineTransform.prototype.getShearX = function()
{
  return this.x2;
};
AffineTransform.prototype.getShearY = function()
{
  return this.y1;
};
AffineTransform.prototype.getTranslateX = function()
{
  return this.x3;
};
AffineTransform.prototype.getTranslateY = function()
{
  return this.y3;
};
AffineTransform.prototype.getAngle = function()
{
  return Math.atan2(this.y1,this.y2);
};
//  Compute and return the inverse matrix - only for affine transform matrix
AffineTransform.prototype.getInverse = function()
{
  var inv = new AffineTransform();
  var det = this.x1*this.y2 - this.x2*this.y1;
  inv.x1 = this.y2/det;
  inv.y1 = -this.y1/det;
  inv.x2 = -this.x2/det;
  inv.y2 = this.x1/det;
  inv.x3 = (this.x2*this.y3 - this.y2*this.x3) / det;
  inv.y3 = (this.y1*this.x3 - this.x1*this.y3) / det;
  return inv;
};
//  Return a string that can be used as the svg transform attribute
AffineTransform.prototype.toString = function()
{
  return 'matrix('+this.x1+','+this.y1+','+
                   this.x2+','+this.y2+','+
                   this.x3+','+this.y3+')';
};
//  A prettier version for debugging
AffineTransform.prototype.print = function()
{
  return '[ '+this.x1.toFixed(2)+' '+this.y1.toFixed(2)+' '+
              this.x2.toFixed(2)+' '+this.y2.toFixed(2)+' '+
              this.x3.toFixed(2)+' '+this.y3.toFixed(2)+' ]';
};
////////////////////////////////////////////////////////////////////////////////
//   Color class
Color = defineClass(
  function (r,g,b)
  {
    this.r = Math.floor(r);
    this.g = Math.floor(g);
    this.b = Math.floor(b);
  });
Color.FACTOR = 0.7;  // from Java
Color.hex = [ '0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
Color.black = new Color(0,0,0);
Color.red = new Color(255,0,0);
Color.green = new Color(0,255,0);
Color.blue = new Color(0,0,255);
Color.yellow = new Color(255,255,0);
Color.orange = new Color(255,200,0);
Color.lightGray = new Color(192,192,192);
Color.gray = new Color(128,128,128);
Color.magenta = new Color(255,0,255);
Color.cyan = new Color(0,255,255);

Color.prototype.invert = function()
{
  return new Color(255-this.r,255-this.g,255-this.b);
};
Color.prototype.darker = function()
{
  return new Color(Math.floor(this.r*Color.FACTOR),
      Math.floor(this.g*Color.FACTOR),
      Math.floor(this.b*Color.FACTOR));
};
Color.prototype.brighter = function()
{
  return this.invert().darker().invert();
};
Color.prototype.veryBright = function()
{
  return this.brighter().brighter().brighter().brighter();
};
Color.prototype.rotate = function()
{
  var cc = new Color(0,0,0);
  if (this.r == 255 && this.g == 0 && this.b == 0)
    cc.g = c.b = 255;
  else if (this.r == Color.lightGray.r)
    cc = Color.lightGray;
  else
    cc.b = 255;
  return cc;
};
Color.prototype.toString = function()
{
  return '#' + Color.hex[this.r>>4] + Color.hex[this.r&0xf] +
               Color.hex[this.g>>4] + Color.hex[this.g&0xf] +
               Color.hex[this.b>>4] + Color.hex[this.b&0xf];
};
////////////////////////////////////////////////////////////////////////////////
//  Misc
Math.toRadians = function(deg)
{
  return deg * Math.PI / 180;
};
Math.toDegrees = function(rad)
{
  return rad * 180 / Math.PI;
};
Math.IEEEremainder = function(d1,d2)
{
  var n = Math.round(d1/d2);
  return d1 - n*d2;
};
Math.isApprox = function(a,b,delta)
{
  if (!delta)
    delta = 0.1;
  return Math.abs(a-b) < delta;
};
Math.angleDiff = function(a1,a2)
{
  return ((((a1-a2) % (Math.PI*2)) + (Math.PI*3)) % (Math.PI*2)) - Math.PI;
};
Math.anglesEqual = function(a1,a2)
{
  return Math.isApprox(Math.angleDiff(a1,a2),0);
};
////////////////////////////////////////////////////////////////////////////////
// Build buttons and slider below animation
// TODO this cheats a bit peeking into tamsvg data - the interface should be better
function generateButtonPanel()
{
  $('#buttonpanel').remove();
  $('#svgcontainer').append('<div id="buttonpanel" style="background-color: #c0c0c0"></div>');

  $('#buttonpanel').append('<div id="optionpanel"></div>');
  $('#optionpanel').append('<input type="button" class="appButton" id="slowButton" value="Slow"/>');
  $('#optionpanel').append('<input type="button" class="appButton" id="normalButton" value="Normal"/>');
  $('#optionpanel').append('<input type="button" class="appButton" id="fastButton" value="Fast"/>');
  if (tamsvg.isSlow())
    $('#slowButton').addClass('selected');
  else if (tamsvg.isFast())
    $('#fastButton').addClass('selected');
  else
    $('#normalButton').addClass('selected');
  $('#optionpanel').append('<input type="button" class="appButton" id="loopButton" value="Loop"/>');
  if (tamsvg.loop)
    $('#loopButton').addClass('selected');
  $('#optionpanel').append('<input type="button" class="appButton" id="gridButton" value="Grid"/>');
  if (tamsvg.grid)
    $('#gridButton').addClass('selected');
  if (tamsvg.dancers.length > 8) {
    $('#optionpanel').append('<input type="button" class="appButton" id="phantomButton" value="Phantoms"/>');
    if (tamsvg.showPhantoms)
      $('#phantomButton').addClass('selected');
  } else {
    $('#optionpanel').append('<input type="button" class="appButton" id="pathsButton" value="Paths"/>');
    if (tamsvg.showPaths)
      $('#pathsButton').addClass('selected');
  }
  $('#optionpanel').append('<input type="button" class="appButton" id="couplesButton" value="#4" style="width:8%"/>');
  if (tamsvg.couples)
    $('#couplesButton').addClass('selected');
  $('#optionpanel').append('<input type="button" class="appButton" id="numbersButton" value="#8" style="width:8%"/>');
  if (tamsvg.numbers)
    $('#numbersButton').addClass('selected');

  tamsvg.goHexagon = tamsvg.goBigon = function() {
    $('#numbersButton').removeClass('selected');
  };
  // Add popup to display for extra options
  $('#popup').remove();
  $('#svgcontainer').append(popupMenuHTML);
  $('#popup').hide();
  $('#svgcontainer').append(popupMenuTitleHTML);
  $('#titlepopup').hide();
  $(tamsvg.floor).mousedown(function(ev) {
    $('#popup').hide();
    $('#titlepopup').hide();
  });

  // Speed button actions
  $('#slowButton').click(function() {
    tamsvg.slow(true);
    $('#slowButton').addClass('selected');
    $('#normalButton,#fastButton').removeClass('selected');
  });
  $('#normalButton').click(function() {
    tamsvg.normal(true);
    $('#normalButton').addClass('selected');
    $('#slowButton,#fastButton').removeClass('selected');
  });
  $('#fastButton').click(function() {
    tamsvg.fast(true);
    $('#fastButton').addClass('selected');
    $('#slowButton,#normalButton').removeClass('selected');
  });

  // Actions for other options
  $('#loopButton').click(function() {
    if (tamsvg.loop) {
      tamsvg.loop = false;
      $('#loopButton').removeClass('selected');
    } else {
      tamsvg.loop = true;
      $('#loopButton').addClass('selected');
    }
    cookie.loop = tamsvg.loop;
    cookie.store(365,'/tamination');
  });
  $('#pathsButton').click(function() {
    if (tamsvg.showPaths) {
      tamsvg.showPaths = false;
      tamsvg.setPaths(false);
      //tamsvg.pathparent.setAttribute('visibility','hidden');
      $('#pathsButton').removeClass('selected');
    } else {
      tamsvg.showPaths = true;
      tamsvg.setPaths(true);
      //tamsvg.pathparent.setAttribute('visibility','visible');
      $('#pathsButton').addClass('selected');
    }
    cookie.paths = tamsvg.showPaths;
    cookie.store(365,'/tamination');
  });
  $('#gridButton').click(function() {
    if (tamsvg.grid) {
      tamsvg.grid = false;
      tamsvg.hexgridgroup.setAttribute('visibility','hidden');
      tamsvg.bigongridgroup.setAttribute('visibility','hidden');
      tamsvg.gridgroup.setAttribute('visibility','hidden');
      $('#gridButton').removeClass('selected');
    } else {
      tamsvg.grid = true;
      if (tamsvg.hexagon)
        tamsvg.hexgridgroup.setAttribute('visibility','visible');
      else if (tamsvg.bigon)
        tamsvg.bigongridgroup.setAttribute('visibility','visible');
      else
        tamsvg.gridgroup.setAttribute('visibility','visible');
      $('#gridButton').addClass('selected');
    }
    cookie.grid = tamsvg.grid;
    cookie.store(365,'/tamination');
  });
  $('#phantomButton').click(function() {
    if (tamsvg.setPhantoms()) {
      tamsvg.setPhantoms(false);
      $('#phantomButton').removeClass('selected');
    } else {
      tamsvg.setPhantoms(true);
      $('#phantomButton').addClass('selected');
    }
    tamsvg.animate();
  });
  $('#numbersButton').click(function() {
    tamsvg.setNumbers(!tamsvg.setNumbers());
    if (tamsvg.numbers) {
      $('#numbersButton').addClass('selected');
      $('#couplesButton').removeClass('selected');
    }
    else
      $('#numbersButton').removeClass('selected');
    cookie.numbers = tamsvg.numbers;
    cookie.store(365,'/tamination');
  });
  $('#couplesButton').click(function() {
    tamsvg.setCouples(!tamsvg.setCouples());
    if (tamsvg.couples) {
      $('#couplesButton').addClass('selected');
      $('#numbersButton').removeClass('selected');
    }
    else
      $('#couplesButton').removeClass('selected');
    cookie.couples = tamsvg.couples;
    cookie.store(365,'/tamination');
  });

  // Slider
  $('#buttonpanel').append('<div id="playslider" style="margin:10px 10px 0 10px"></div>');
  $('#playslider').slider({min: -200, max: tamsvg.beats*100, value: -200,
    slide: function(event,ui) {
      //tamsvg.beat = ui.value/100;
      //tamsvg.lastPaintTime = new Date().getTime();
      //tamsvg.animate();
      tamsvg.setBeat(ui.value/100);
    }});
  // Slider tick marks
  $('#buttonpanel').append('<div id="playslidertics" style="position: relative; height:10px; width:100%"></div>');
  $('#buttonpanel').append('<div id="playsliderlegend" style="color: black; position: relative; top:0; left:0; width:100%; height:16px"></div>');
  updateSliderMarks();

  // Bottom row of buttons
  $('#buttonpanel').append('<input type="button" class="appButton" id="rewindButton" value="&lt;&lt;"/>');
  $('#rewindButton').click(function() { tamsvg.rewind(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="prevButton" value="|&lt;"/>');
  $('#prevButton').click(function() { tamsvg.prev(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="backButton" value="&lt;"/>');
  $('#backButton').click(function() { tamsvg.backward(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="playButton" value="Play"/>');
  $('#playButton').click(function() { tamsvg.play(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="forwardButton" value="&gt;"/>');
  $('#forwardButton').click(function() { tamsvg.forward(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="nextButton" value="&gt;|"/>');
  $('#nextButton').click(function() { tamsvg.next(); });
  $('#buttonpanel').append('<input type="button" class="appButton" id="endButton" value="&gt;&gt;"/>');
  $('#endButton').click(function() { tamsvg.end(); });
  tamsvg.animationStopped = function()
  {
    $('#playButton').attr('value','Play');
  };

  //  Some browsers wrap the top row of buttons, this code is to fix that
  var fontsize = 14;
  while ($('#numbersButton').position().top > $('#slowButton').position().top) {
    fontsize--;
    $('.appButton').css('font-size',fontsize+'px');
  }


}

function updateSliderMarks(nofractions)
{
  //  Set the end of the slider to the current length of the animation
  $('#playslider').slider('option','max',tamsvg.beats*100);
  //  (Re)generate slider tic marks
  $('#playslidertics').empty();
  for (var i=-1; i<tamsvg.beats; i++) {
    var x = (i+2) * $('#buttonpanel').width() / (tamsvg.beats+2);
    $('#playslidertics').append('<div style="position: absolute; background-color: black; top:0; left:'+x+'px; height:100%; width: 1px"></div>');
  }
  // Add "Start", "End" and part numbers below slider
  $('#playsliderlegend').empty();
  if (tamsvg.beats > 2) {  // skip if no calls (sequencer)
    var startx = 2 * $('#buttonpanel').width() / (tamsvg.beats+2) - 50;
    var endx = tamsvg.beats * $('#buttonpanel').width() / (tamsvg.beats+2) - 50;
    $('#playsliderlegend').append('<div style="position:absolute; top:0; left:'+startx+'px; width:100px; text-align: center">Start</div>');
    $('#playsliderlegend').append('<div style="position:absolute;  top:0; left:'+endx+'px; width: 100px; text-align:center">End</div>');
    var offset = 0;
    for (var i in tamsvg.parts) {
      if (tamsvg.parts[i] > 0) {
        var t = '<font size=-2><sup>'+(Number(i)+1) + '</sup>/<sub>' + (tamsvg.parts.length+1) + '</sub></font>';
        if (nofractions)
          t = '<font size=-2>'+(Number(i)+2)+'</font>';
        offset += tamsvg.parts[i];
        var x = (offset+2) * $('#buttonpanel').width() / (tamsvg.beats+2) - 20;
        $('#playsliderlegend').append('<div style="position:absolute; top:0; left:'+x+
            'px; width:40px; text-align: center">'+t+'</div>');
      }
    }
  }
}
