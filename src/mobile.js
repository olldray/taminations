
var animations = 0;
var currentcall = '';  // needed for tamination.js
var callnamedict = {};
var menudata;
preload('menus.xml',function(a) { menudata = a; });

//  Given an url or other fragment, parse out "a=b args" into an object
function parseArgs(str)
{
  //  If arg not given, use document URL
  str = str || document.URL;
  if (str.match(/[?#]/))
    str = str.split(/[?#]/)[1];
  var a = str.split(/\&/);
  var retval = {};
  for (var i=0; i<a.length; i++) {
    var a1 = a[i].split(/=/);
    if (a1.length > 1)
      retval[a1[0]] = a1[1];
    else
      retval[a1[0]] = true;
  }
  return retval;
}

//  This function is called just once after the html has loaded
//  Other mobile-specific callbacks are called for each page change
$(document).ready(function(){
  //  Add the functions for the buttons.
  //  Do it here because it should only be done once.
  $('#rewindButton').bind('tap',function(event,ui) {
    tamsvg.rewind();
  });
  $('#backButton').bind('tap',function(event,ui) {
    tamsvg.backward();
  });
  $('#playButton').bind('tap',function(event,ui) {
    tamsvg.play();
    $('#playButton').button('refresh');
  });
  $('#forwardButton').bind('tap',function(event,ui) {
    tamsvg.forward();
  });
  $('#endButton').bind('tap',function(event,ui) {
    tamsvg.end();
  });
  $('#optionsButton').bind('tap',function(event,ui) {
    $.mobile.changePage('#optionspage');
  });
  $('#defButton').bind('tap',function(event,ui) {
    $.mobile.changePage('#definitionpage');
  });
  $('#calltitle').bind('tap',function(event,ui) {
    $.mobile.changePage('#definitionpage');
  });
  $('#slowButton').bind('change',function(event,ui) {
    tamsvg.slow();
  });
  $('#normalButton').bind('change',function(event,ui) {
    tamsvg.normal();
  });
  $('#fastButton').bind('change',function(event,ui) {
    tamsvg.fast();
  });
  $('#loopButton').bind('change',function(event,ui) {
    tamsvg.setLoop($('#loopButton').attr('checked')=='checked');
  });
  $('#gridButton').bind('change',function(event,ui) {
    tamsvg.setGrid($('#gridButton').attr('checked')=='checked');
  });
  $('#pathsButton').bind('change',function(event,ui) {
    tamsvg.setPaths($('#pathsButton').attr('checked')=='checked');
  });
  $('#numbersButton').bind('change',function(event,ui) {
    tamsvg.setNumbers($('#numbersButton').attr('checked')=='checked');
  });
  $('#hexagonButton').bind('change',function(event,ui) {
    var ishex = $('#hexagonButton').attr('checked')=='checked';
    tamsvg.setHexagon(ishex);
    if (ishex) {
      $('#numbersButton').removeAttr('checked').checkboxradio('refresh').checkboxradio('disable');
      $('#bigonButton').removeAttr('checked').checkboxradio('refresh');
    }
    else
      $('#numbersButton').checkboxradio('enable');
  });
  $('#bigonButton').bind('change',function(event,ui) {
    var isbigon = $('#bigonButton').attr('checked')=='checked';
    tamsvg.setBigon(isbigon);
    if (isbigon) {
      $('#numbersButton').removeAttr('checked').checkboxradio('refresh').checkboxradio('disable');
      $('#hexagonButton').removeAttr('checked').checkboxradio('refresh');
    }
    else
      $('#numbersButton').checkboxradio('enable');
  });
});

//  This is needed to keep the green color for the level header
$(document).bind('mobileinit',function()
  {
    $.mobile.page.prototype.options.headerTheme = "d";
    $.mobile.listview.prototype.options.headerTheme = "d";
    $.mobile.pushStateEnabled = false;
  });

$(document).delegate('#level','pagecreate',
  function()
  {
    // Build menus for level and call selection
    $('menulist',menudata).each(function() {
      var title = $(this).attr('title');
      if (title.match(/Info|General|Styling/))
        return;
      var html = '<li data-theme="c" data-icon="arrow-r">'+ title +
                 '<ul id="'+title+'" data-role="listview"></ul></li>';
      $('#levelslist').append(html);
      $(this).children().each(function() {
        var text = $(this).attr('text');
        var link = $(this).attr('link');
        var htmlpage = encodeURIComponent(link);
        var xmlpage = htmlpage.replace('html','xml');
        callnamedict[xmlpage] = text;
        var html = '<li><a href="#animlistpage&'+htmlpage+'">'+text+'</li>';
        $('#'+title).append(html);
      });
    });
  }
);

//  Fetch xml that lists the animations for a specific call
//  Then build a menu
function loadcall(options,htmlpage)
{
  if (htmlpage.length > 0) {
    console.log(htmlpage);
    //  Some browsers do better loading the definition as xml, others as html
    //  So we will try both
    $.ajax({url:decodeURIComponent(htmlpage), datatype:'xml', success:function(a) {
      if ($('body',a).size() > 0) {
        $('#definitioncontent').empty().append($('body',a).children());
        repairDefinition(htmlpage);
      }
      else {
        $.ajax({url:decodeURIComponent(htmlpage), datatype:'html', success:function(a) {
          $('#definitioncontent').empty().append(a.match(/<body>((.|\n)*)<\/body>/)[1]);
          repairDefinition(htmlpage);
        }});
      }
    }});
    //  Load the xml file of animations
    var xmlpage = htmlpage.replace('html','xml');
    $.ajax({url:decodeURIComponent(xmlpage), datatype:'xml',success:function(a) {
      animations = a;
      var prevtitle = "";
      var prevgroup = "";
      var page = $('#animlistpage');
      var content = page.children(":jqmData(role=content)");
      content.empty();
      var html = '<ul data-role="listview">';
      $("tam",animations).each(function(n) {
        var callname = $(this).attr('title') + 'from' + $(this).attr('from');
        var name = $(this).attr('from');
        if ($(this).attr("group") != undefined) {
          if ($(this).attr("group") != prevgroup)
            html += '<li data-role="list-divider">'+$(this).attr("group")+"</li>";
          name = $(this).attr('title').replace($(this).attr('group'),' ');
          callname = $(this).attr('title');
        }
        else if ($(this).attr("title") != prevtitle)
          html += '<li data-role="list-divider">'+$(this).attr("title")+" from</li>";
        //if ($(this).attr("difficulty") != undefined) {
        //  name = name + difficultText[Number($(this).attr("difficulty"))-1];
        //  showDiffLegend = true;
        //}
        //  First replace strips "(DBD)" et al
        //  Second strips all non-alphanums, not valid in html ids
        callname = callname.replace(/ \(DBD.*/,"").replace(/\W/g,"");
        //animationNumber[callname] = n;
        prevtitle = $(this).attr("title");
        prevgroup = $(this).attr('group');
        if ($("path",this).length == 2)
          name += ' (4 dancers)';
        html += '<li><a href="#animation-'+n+'">'+name+'</a></li>';
      });
      content.html(html);
      page.page();
      content.find(':jqmData(role=listview)').listview();
      $('#calltitle').empty().text(callnamedict[xmlpage]);
      $.mobile.changePage($('#animlistpage'),options);
    }});
  }
  else
    $.mobile.changePage($('#animlistpage'),options);
}

function repairDefinition(htmlpage)
{
  // Append copyright
  $('#definitioncontent').append(getCopyright(htmlpage));
  //  Repair image locations
  $('#definitioncontent img').each(function(i) {
    $(this).attr('src',htmlpage.match(/(.*)%/)[1]+'/'+$(this).attr('src'));
  });
  //  Strip out any links
  $('#definitioncontent a').each(function(i) {
    $(this).replaceWith($(this).text());
  });
}

$(document).bind('pagebeforechange',function(e,data)
{
  if (typeof tamsvg == 'object') {
    tamsvg.stop();
    //$('#playButton').button('refresh');
  }
  if (typeof data.toPage == 'string') {
    var u = $.mobile.path.parseUrl(data.toPage);
    if (u.hash.indexOf('#animlistpage') == 0) {
      xmlpage = u.hash.substring(14);
      if (xmlpage.length < 1 && !animations)
        // "refresh" - go back to main page
        $.mobile.changePage('#level');
      else
        loadcall(data.options,xmlpage);
      e.preventDefault();
    }
    else if (u.hash.indexOf('#animation') == 0) {
      n = u.hash.substring(11);
      if (n.match(/\d+/)) {
        data.options.n = n;
        $.mobile.changePage($('#animationpage'),data.options);
        //generateAnimation(n);
        //bindControls();
      }
      else if (typeof tamsvg != 'object') {
        // "refresh" - go back to main page
        $.mobile.changePage('#level');
        e.preventDefault();
      }
    }
    else if (u.hash.indexOf('#optionspage') == 0) {
      if (typeof tamsvg != 'object') {
        $.mobile.changePage('#level');
        e.preventDefault();
      } else {
        if (tamsvg.isSlow())
          $('#slowButton').attr('checked','checked');
        if (tamsvg.isNormal())
          $('#normalButton').attr('checked','checked');
        if (tamsvg.isFast())
          $('#fastButton').attr('checked','checked');
        if (tamsvg.setLoop())
          $('#loopButton').attr('checked','checked');
        else
          $('#loopButton').removeAttr('checked');
        if (tamsvg.setGrid())
          $('#gridButton').attr('checked','checked');
        else
          $('#gridButton').removeAttr('checked');
        if (tamsvg.setPaths())
          $('#pathsButton').attr('checked','checked');
        else
          $('#pathsButton').removeAttr('checked');
        if (tamsvg.setNumbers())
          $('#numbersButton').attr('checked','checked');
        else
          $('#numbersButton').removeAttr('checked');
        if (tamsvg.setHexagon())
          $('#hexagonButton').attr('checked','checked');
        else
          $('#hexagonButton').removeAttr('checked');
        if (tamsvg.setBigon())
          $('#bigonButton').attr('checked','checked');
        else
          $('#bigonButton').removeAttr('checked');
      }
    }
  }
});

$(document).bind('pagechange',function(e,data)
{
  if (typeof data.options.n != "undefined") {
    generateAnimation(n);
    bindControls();
  }
});


//  Code to build animation
var args = {};
var animations;
var definitiondoc;
var isSmall = true;
function svgSize()
{
  var aw = 100;
  var ah = 100;
  var h = window.innerHeight ? window.innerHeight : document.body.offsetHeight;
  var w = window.innerWidth ? window.innerWidth : document.body.offsetWidth;
  if (typeof h == "number" && typeof w == "number") {
    h = h - $('#animform').height() - $('#animheader').height();
    aw = ah = h > w ? w : h;
  }
  aw = Math.floor(aw);
  ah = Math.floor(ah);
  return { width: aw, height: ah };
}

function generateAnimation(n)
{
  var dims = svgSize();
  svgstr='<div id="appletcontainer"><div id="svgdiv" '+
            'style="width:'+dims.width+'px; height:'+dims.height+'px;">'+
            '</div></div>';
  $("#animationcontent").empty().append(svgstr).width(dims.width);
  TAMination(0,animations,'','');
  SelectAnimation(n);
  $('#animtitle').empty().text(tam.getTitle());
  $('#svgdiv').svg({onLoad:TamSVG});
  //  Rest of code logic from tampage.js
  //  Add tic  marks and labels to slider
  $('#playslidertics').empty();
  for (var i=-1; i<tamsvg.beats; i++) {
    var x = (i+2) * $('#playslidertics').width() / (tamsvg.beats+2);
    $('#playslidertics').append('<div style="position: absolute; background-color: black; top:0; left:'+x+'px; height:100%; width: 1px"></div>');
  }
  //  "Start", "End" and part numbers below slider
  $('#playsliderlabels').empty();
  var startx = 2 * $('#playsliderlabels').width() / (tamsvg.beats+2) - 50;
  var endx = tamsvg.beats * $('#playsliderlabels').width() / (tamsvg.beats+2) - 50;
  $('#playsliderlabels').append('<div style="position:absolute; top:0; left:'+startx+'px; width:100px; text-align: center">Start</div>');
  $('#playsliderlabels').append('<div style="position:absolute;  top:0; left:'+endx+'px; width: 100px; text-align:center">End</div>');
  var offset = 0;
  for (var i in tamsvg.parts) {
    if (tamsvg.parts[i] > 0) {
      var t = '<font size=-2><sup>'+(Number(i)+1) + '</sup>/<sub>' + (tamsvg.parts.length+1) + '</sub></font>';
      offset += tamsvg.parts[i];
      var x = (offset+2) * $('#playsliderlabels').width() / (tamsvg.beats+2) - 20;
      $('#playsliderlabels').append('<div style="position:absolute; top:0; left:'+x+
          'px; width:40px; text-align: center">'+t+'</div>');
    }
  }

}

function bindControls()
{
  $('#animslider').attr('max',Math.floor(tamsvg.beats*100));
  tamsvg.animationStopped = function()
  {
    $('#playButton').attr('value','Play').button('refresh');
  };
  //$('#animslider').change(function()
  //  {
  //    tamsvg.setBeat($('#animslider').val()/100);
  //    tamsvg.paint();
  //  });
}
