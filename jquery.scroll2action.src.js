/**
 * @author: Thomas Lukacs
 */
(function($) {
	var animationTimeout = null;
	var bottomScrollInterval = [];

	$.fn.scroll2action = function() {

		var p = {
			f: {
				init: false,
				locked: false,
				disableSnapping: true,
				mouseScrollActive: false,
				mouseEntered: false
			},

			elements: {},
			elementCount: 0,
			speed: null,

			init: function() {
				if (p.f.init) { return; }
				p.f.init = true;

				if (window.addEventListener) {
					window.addEventListener('DOMMouseScroll', p.scrollHandler, false);
				}
				window.onmousewheel = document.onmousewheel = p.scrollHandler;
			},
			start: function(elem) {
				var id = "s2a_"+(++p.elementCount);
				p.elements[id] = { parent: elem };
				p.wrapContent(p.elements[id]);
				p.addScrollbar(p.elements[id]);
				p.addViews(p.elements[id]);
				p.addStyling(p.elements[id]);
				p.speed = p.getSpeed(p.getBrowser($.browser)) || 2;
			},
			wrapContent: function(elem) {
				elem.content = $("<div class='s2a_content'></div>");
				elem.parent.append(elem.content.append($("<div></div>").append($('> *', elem.parent))));
			},
			addScrollbar: function(elem) {
				elem.scrollBar = $("<div class='s2a_scroll hidden'></div>");
				elem.scrollBarHandler = $("<div class='s2a_handler' ></div>");

				var
				boxHeight = elem.parent.innerHeight(),
				targetHeight = elem.content.innerHeight();

				p.bindScrollbarHandler(elem.scrollBarHandler);

				elem.scrollBar.hover(function() {
					$(this).addClass("hover");
				}, function() {
					if (!p.f.mouseScrollActive) {
						$(this).removeClass("hover");
					}
				});

				elem.parent.hover(function() {
					p.f.mouseEntered = true;
					elem.scrollBar.removeClass("hidden");
				}, function() {
					p.f.mouseEntered = false;
					if (!p.f.mouseScrollActive) {
						elem.scrollBar.addClass("hidden");
					}
				});

				elem.scrollBar.height(boxHeight);
				elem.scrollBarHandler.height(~~(boxHeight/targetHeight*boxHeight));

				elem.parent.append(elem.scrollBar.append(elem.scrollBarHandler));
			},
			bindScrollbarHandler: (function() {

				var clickPos = null;
				var lastTarget = null;
				var posTop = 0;

				return function(sb) {
					sb.mousedown(function(e) {
						lastTarget = p.findUp(this);
						clickPos = e.pageY;
						p.f.mouseScrollActive = true;
						posTop = ~~lastTarget.content.attr("data-s2a-pos");
					});
					$('body').mouseup(function() {
						p.f.mouseScrollActive = false;
						lastTarget.scrollBar.removeClass("hover");
						if (!p.f.mouseEntered) {
							lastTarget.scrollBar.addClass("hidden");
						}
					});

					$('body').mousemove(function(e) {
						if (!p.f.mouseScrollActive) { return; }
						p.scrollTo(lastTarget, posTop+e.pageY-clickPos, true);
					});
				}
			})(),
			addViews: function(elem) {
				elem.viewTop = $("<div class='s2a_view s2a_viewTop'></div>");
				elem.viewBottom = $("<div class='s2a_view s2a_viewBottom'></div>");
				elem.parent.prepend(elem.viewTop).append(elem.viewBottom);
			},
			addStyling: function(elem) {
				elem.parent
					.css("position", "relative")
					.css("overflow", "hidden");

				var height = elem.parent.height();
				var width = elem.parent.width();
				elem.content.height(height);
				elem.viewBottom.width(width);
				elem.viewTop.width(width);
			},

			findUp: function(node) {
				var found = false;
				$.each(p.elements, function(key, value) {
					if (value.parent[0] === $(node)[0]) { found = value; }
				});
				if (found) { return found; }

				var parent = node.parentElement || node.parentNode; /* Mozilla */
				if (parent === null) { return false; }
				return p.findUp(parent);
			},
			getSpeed: (function() {
				var browserMap = {
					"webkit": 2,
					"ie": 3,
					"opera": 2,
					"mozilla": 2.5
				};

				return function(browser) { return browser in browserMap? browserMap[browser] : false; }
			})(),
			getBrowser: function(b) {
				if (b.webkit) { return "webkit"; }
				if (b.msie) { return "ie"; }
				if (b.opera) { return "opera"; }
				if (b.mozilla) { return "mozilla"; }
				return false;
			},

			scrollHandler: function(e) {

				if (!e) { e = window.event; } /* IE */
				var target = p.findUp($.event.fix(e).target);

				if (!!target) {

					var delta =
						e.wheelDelta? e.wheelDelta : /* IE/Opera */
						e.detail? -e.detail :	     /* Mozilla  */
						0;

					p.scroll(target, delta);

					if (e.preventDefault) { e.preventDefault(); }
					e.returnValue = false;
				}
			},
			scrollTo: function(target, value, multiplyRatio) {
				var
				boxHeight = target.parent.innerHeight(),
				targetHeight = $(' > div', target.content).innerHeight();
				targetHeight = targetHeight < boxHeight? boxHeight : targetHeight;
				var
				ratio = boxHeight/targetHeight,
				sbhHeight = ~~(ratio*boxHeight);

				if (multiplyRatio) { value = value/ratio; }
				var sbht = ~~(ratio*value);

				// actual scrolling
				target.content.scrollTop(value);
				target.content.attr("data-s2a-pos", value*ratio);

				// ScrollbarHandler positioning
				target.scrollBarHandler.css("top",
						sbht+sbhHeight > boxHeight? boxHeight-sbhHeight-2 :
						sbht < 0? 0 : sbht );
			},
			scroll: function(target, up) {
				if (p.f.locked) { return; }

				up = up > 0;
				var
				scrollTo = target.content.scrollTop()+p.speed*-1*(up? 10 : -10),
				boxHeight = target.content.innerHeight(),
				targetHeight = $('> div', target.content).innerHeight();
				targetHeight = targetHeight < boxHeight? boxHeight : targetHeight;
				var
				snapped = target.content.hasClass('s2a_top')? 1 : target.content.hasClass('s2a_bottom')? -1 : 0,
				sbhHeight = ~~(boxHeight/targetHeight*boxHeight);

				// dont scroll further if snapped
				if (snapped > 0 && up || snapped < 0 && !up) { return; }

				// direction change -> release
				if (snapped > 0 && !up) {
					target.content.removeClass('s2a_top');
					target.viewTop.removeClass('s2a_top');
					target.scrollBarHandler.height(sbhHeight);
					p.f.locked = true;
					window.setTimeout(function() { p.f.locked = false; }, 400); // wait for animation
					return;
				}
				if (snapped < 0 && up) {
					target.content.removeClass('s2a_bottom');
					target.viewBottom.removeClass('s2a_bottom');
					target.scrollBarHandler.height(sbhHeight);
					p.f.locked = true;
					window.setTimeout(function() { p.f.locked = false; }, 400); // wait for animation
					return;
				}

				// actual scrolling
				p.scrollTo(target, scrollTo);

				// reached top limit
				if (scrollTo < 0) {

					target.content.addClass('s2a_top');
					target.viewTop.addClass('s2a_top');
					target.scrollBarHandler.height(sbhHeight/2);

					if (p.f.disableSnapping) {
						window.clearTimeout(animationTimeout);
						animationTimeout = window.setTimeout(function() {
							window.clearTimeout(animationTimeout);
							animationTimeout = null;
							target.content.removeClass('s2a_top');
							target.viewTop.removeClass('s2a_top');
							target.scrollBarHandler.height(sbhHeight);
							target.scrollBar.removeClass("s2a_top");
						}, 150);
					}

				// reached bottom limit
				} else if (scrollTo > targetHeight-boxHeight) {

					target.content.addClass('s2a_bottom');
					target.viewBottom.addClass('s2a_bottom');
					target.scrollBarHandler.css("top", "auto");
					target.scrollBarHandler.css("bottom", 0);
					target.scrollBarHandler.height(sbhHeight/2);

					$.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
					bottomScrollInterval = [];
					bottomScrollInterval.push(window.setInterval(function() {
						target.content.scrollTop(boxHeight+targetHeight);
					}, 10));
					window.setTimeout(function() {
						$.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
						bottomScrollInterval = [];
					}, 800);

					if (p.f.disableSnapping) {
						animationTimeout = window.setTimeout(function() {
							window.clearTimeout(animationTimeout);
							animationTimeout = null;
							target.content.removeClass('s2a_bottom');
							target.viewBottom.removeClass('s2a_bottom');
							target.scrollBarHandler.height(sbhHeight);
						}, 150);
					}
				}
			}
		};

		return this.each(function() {
			p.init();
			p.start($(this));
		});
	};
})(jQuery);