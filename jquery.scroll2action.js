(function(a){var b=null;var c=[];a.fn.pullToShow=function(){var d={f:{init:false,locked:false,disableSnapping:true,mouseScrollActive:false,mouseEntered:false},init:function(){if(d.f.init){return}d.f.init=true;if(window.addEventListener){window.addEventListener("DOMMouseScroll",d.scrollHandler,false)}window.onmousewheel=document.onmousewheel=d.scrollHandler},start:function(b){d.elements.push(b);d.wrapContent(b);d.addScrollbar(b);d.addViews(b);d.addStyling(b);d.speed=d.getSpeed(d.getBrowser(a.browser))||2;a("> .pullToShow_scroll",b).hover(function(){a(this).addClass("hover")},function(){if(!d.f.mouseScrollActive){a(this).removeClass("hover")}});b.hover(function(){d.f.mouseEntered=true;a("> .pullToShow_scroll",b).removeClass("hidden")},function(){d.f.mouseEntered=false;if(!d.f.mouseScrollActive){a("> .pullToShow_scroll",b).addClass("hidden")}})},addStyling:function(b){b.css("position","relative").css("overflow","hidden");var c=b.height();var d=b.width();a(".pullToShow_content",b).height(c);a(".pullToShow_viewTop, .pullToShow_viewBottom",b).width(d)},wrapContent:function(b){var c=a("<div class='pullToShow_content'></div>");var d=a("<div></div>");b.append(c.append(d.append(a("> *",b))))},addViews:function(b){var c=a("<div class='pullToShow_viewTop'></div>");var d=a("<div class='pullToShow_viewBottom'></div>");b.prepend(c).append(d)},addScrollbar:function(b){var c=a("<div class='pullToShow_scroll hidden'></div>");var e=a("<div class='pullToShow_handler' ></div>");var f=b.innerHeight();var g=a(".pullToShow_content > div",b).innerHeight();d.bindScrollbarHandler(e);c.height(f);e.height(~~(f/g*f));b.append(c.append(e))},bindScrollbarHandler:function(){var b=null;var c=null;var e=0;return function(f){f.mousedown(function(f){c=d.findUp(this);b=f.pageY;d.f.mouseScrollActive=true;e=~~a(".pullToShow_content",c).attr("data-pullToShow-pos")});a("body").mouseup(function(){d.f.mouseScrollActive=false;var b=a(".pullToShow_scroll",c);b.removeClass("hover");if(!d.f.mouseEntered){b.addClass("hidden")}});a("body").mousemove(function(a){if(!d.f.mouseScrollActive){return}d.scrollTo(c,e+a.pageY-b,true)})}}(),elements:[],findUp:function(b){var c=false;a.each(d.elements,function(d,e){if(e[0]===a(b)[0]){c=e}});if(c){return c}var e=b.parentElement||b.parentNode;if(e===null){return false}return d.findUp(e)},getSpeed:function(){var a={webkit:2,ie:3,opera:2,mozilla:2.5};return function(b){return b in a?a[b]:false}}(),getBrowser:function(a){if(a.webkit){return"webkit"}if(a.msie){return"ie"}if(a.opera){return"opera"}if(a.mozilla){return"mozilla"}return false},speed:null,scrollHandler:function(b){if(!b){b=window.event}var c=d.findUp(a.event.fix(b).target);if(c!==false){var e=b.wheelDelta?b.wheelDelta:b.detail?-b.detail:0;d.scroll(c,e);if(b.preventDefault){b.preventDefault()}b.returnValue=false}},scrollTo:function(b,c,d){var e=a("> .pullToShow_content",b),f=a("> .pullToShow_scroll .pullToShow_handler",b),g=b.innerHeight(),h=a("> .pullToShow_content > div",b).innerHeight();h=h<g?g:h;var i=g/h,j=~~(i*g);if(d){c=c/i}var k=~~(i*c);e.scrollTop(c);e.attr("data-pullToShow-pos",c*i);f.css("top",k+j>g?g-j-2:k<0?0:k)},scroll:function(e,f){if(d.f.locked){return}f=f>0;var g=a("> .pullToShow_content",e),h=a("> .pullToShow_scroll .pullToShow_handler",e),i=a("> .pullToShow_viewTop",e),j=a("> .pullToShow_viewBottom",e),k=g.scrollTop()+d.speed*-1*(f?10:-10),l=e.innerHeight(),m=a("> .pullToShow_content > div",e).innerHeight();m=m<l?l:m;var n=g.hasClass("scroll_top")?1:g.hasClass("scroll_bottom")?-1:0,o=~~(l/m*l);if(n>0&&f||n<0&&!f){return}if(n>0&&!f){g.removeClass("scroll_top");i.removeClass("scroll_top");h.height(o);d.f.locked=true;window.setTimeout(function(){d.f.locked=false},400);return}if(n<0&&f){g.removeClass("scroll_bottom");j.removeClass("scroll_bottom");h.height(o);d.f.locked=true;window.setTimeout(function(){d.f.locked=false},400);return}d.scrollTo(e,k);if(k<0){g.addClass("scroll_top");i.addClass("scroll_top");h.height(o/2);if(d.f.disableSnapping){window.clearTimeout(b);b=window.setTimeout(function(){window.clearTimeout(b);b=null;g.removeClass("scroll_top");i.removeClass("scroll_top");h.height(o);a(".pullToShow_scroll").removeClass("scroll_top")},150)}}else if(k>m-l){g.addClass("scroll_bottom");j.addClass("scroll_bottom");h.css("top","auto");h.css("bottom",0);h.height(o/2);a.each(c,function(a,b){window.clearInterval(b)});c=[];c.push(window.setInterval(function(){g.scrollTop(l+m)},10));window.setTimeout(function(){a.each(c,function(a,b){window.clearInterval(b)});c=[]},800);if(d.f.disableSnapping){b=window.setTimeout(function(){window.clearTimeout(b);b=null;g.removeClass("scroll_bottom");j.removeClass("scroll_bottom");h.height(o)},150)}}}};return this.each(function(){d.init();d.start(a(this))})}})(jQuery)