/**
 * @author: Thomas Lukacs
 */
(function($) {
	var animationTimeout = null;
	var bottomScrollInterval = [];

	$.fn.pullToShow = function() {

		var p = {
			f: {
				init: false,
				locked: false,
				disableSnapping: false,
				mouseScrollActive: false,
				mouseEntered: false
			},
			init: function() {
				if (p.f.init) { return; }
				p.f.init = true;

				if (window.addEventListener) {
					window.addEventListener('DOMMouseScroll', p.scrollHandler, false);
				}
				window.onmousewheel = document.onmousewheel = p.scrollHandler;
			},
			start: function(elem) {
				p.elements.push(elem);
				p.wrapContent(elem);
				p.addScrollbar(elem);
				p.addViews(elem);
				p.addStyling(elem);
				p.speed = p.getSpeed(p.getBrowser($.browser)) || 2;

				$('> .pullToShow_scroll', elem).hover(function() {
					$(this).addClass("hover");
				}, function() {
					if (!p.f.mouseScrollActive) {
						$(this).removeClass("hover");
					}
				});

				elem.hover(function() {
					p.f.mouseEntered = true;
					$('> .pullToShow_scroll', elem).removeClass("hidden");
				}, function() {
					p.f.mouseEntered = false;
					if (!p.f.mouseScrollActive) {
						$('> .pullToShow_scroll', elem).addClass("hidden");
					}
				});
			},
			addStyling: function(elem) {
				elem.css("position", "relative")
					.css("overflow", "hidden");

				var height = elem.height();
				var width = elem.width();
				$(".pullToShow_content", elem).height(height);
				$(".pullToShow_viewTop, .pullToShow_viewBottom", elem).width(width);
			},
			wrapContent: function(elem) {
				var wrap1 = $("<div class='pullToShow_content'></div>");
				var wrap2 = $("<div></div>");
				elem.append(wrap1.append(wrap2.append($('> *', elem))));
			},
			addViews: function(elem) {
				var top = $("<div class='pullToShow_viewTop'></div>");
				var bottom = $("<div class='pullToShow_viewBottom'></div>");
				elem.prepend(top).append(bottom);
			},
			addScrollbar: function(elem) {
				var $sb = $("<div class='pullToShow_scroll hidden'></div>");
				var $sbh = $("<div class='pullToShow_handler' ></div>");
				var boxHeight = elem.innerHeight();
				var targetHeight = $('.pullToShow_content > div', elem).innerHeight();

				p.bindScrollbarHandler($sbh);

				$sb.height(boxHeight);
				$sbh.height(~~(boxHeight/targetHeight*boxHeight));

				elem.append($sb.append($sbh));
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
						posTop = ~~$('.pullToShow_content', lastTarget).attr("data-pullToShow-pos");
					});
					$('body').mouseup(function() {
						p.f.mouseScrollActive = false;
						var scroll = $('.pullToShow_scroll', lastTarget);
						scroll.removeClass("hover");
						if (!p.f.mouseEntered) {
							scroll.addClass("hidden");
						}
					});

					$('body').mousemove(function(e) {
						if (!p.f.mouseScrollActive) { return; }
						p.scrollTo(lastTarget, posTop+e.pageY-clickPos, true);
					});
				}
			})(),
			elements: [],
			findUp: function(node) {
				var found = false;
				$.each(p.elements, function(key, value) {
					if (value[0] === $(node)[0]) { found = value; }
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
			speed: null,
			scrollHandler: function(e) {

				if (!e) { e = window.event; } /* IE */
				var target = p.findUp($.event.fix(e).target);

				if (target !== false) {

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
				$content = $('> .pullToShow_content', target),
				$scrollBarHandler = $('> .pullToShow_scroll .pullToShow_handler', target),
				boxHeight = target.innerHeight(),
				targetHeight = $('> .pullToShow_content > div', target).innerHeight();
				targetHeight = targetHeight < boxHeight? boxHeight : targetHeight;
				var
				ratio = boxHeight/targetHeight,
				sbhHeight = ~~(ratio*boxHeight);

				if (multiplyRatio) { value = value/ratio; }
				var sbht = ~~(ratio*value);

				// actual scrolling
				$content.scrollTop(value);
				$content.attr("data-pullToShow-pos", value*ratio);

				// ScrollbarHandler positioning
				$scrollBarHandler.css("top",
						sbht+sbhHeight > boxHeight? boxHeight-sbhHeight-2 :
						sbht < 0? 0 : sbht );
			},
			scroll: function(target, up) {
				if (p.f.locked) { return; }

				up = up > 0;
				var
				$content = $('> .pullToShow_content', target),
				$scrollBarHandler = $('> .pullToShow_scroll .pullToShow_handler', target),
				$viewTop = $('> .pullToShow_viewTop', target),
				$viewBottom = $('> .pullToShow_viewBottom', target),
				scrollTo = $content.scrollTop()+p.speed*-1*(up? 10 : -10),
				boxHeight = target.innerHeight(),
				targetHeight = $('> .pullToShow_content > div', target).innerHeight();
				targetHeight = targetHeight < boxHeight? boxHeight : targetHeight;
				var
				snapped = $content.hasClass('scroll_top')? 1 : $content.hasClass('scroll_bottom')? -1 : 0,
				sbhHeight = ~~(boxHeight/targetHeight*boxHeight);

				// dont scroll further if snapped
				if (snapped > 0 && up || snapped < 0 && !up) { return; }

				// direction change -> release
				if (snapped > 0 && !up) {
					$content.removeClass('scroll_top');
					$viewTop.removeClass('scroll_top');
					$scrollBarHandler.height(sbhHeight);
					p.f.locked = true;
					window.setTimeout(function() { p.f.locked = false; }, 400); // wait for animation
					return;
				}
				if (snapped < 0 && up) {
					$content.removeClass('scroll_bottom');
					$viewBottom.removeClass('scroll_bottom');
					$scrollBarHandler.height(sbhHeight);
					p.f.locked = true;
					window.setTimeout(function() { p.f.locked = false; }, 400); // wait for animation
					return;
				}

				// actual scrolling
				p.scrollTo(target, scrollTo);

				// reached top limit
				if (scrollTo < 0) {

					$content.addClass('scroll_top');
					$viewTop.addClass('scroll_top');
					$scrollBarHandler.height(sbhHeight/2);

					if (p.f.disableSnapping) {
						window.clearTimeout(animationTimeout);
						animationTimeout = window.setTimeout(function() {
							window.clearTimeout(animationTimeout);
							animationTimeout = null;
							$content.removeClass('scroll_top');
							$viewTop.removeClass('scroll_top');
							$scrollBarHandler.height(sbhHeight);
							$('.pullToShow_scroll').removeClass("scroll_top");
						}, 150);
					}

				// reached bottom limit
				} else if (scrollTo > targetHeight-boxHeight) {

					$content.addClass('scroll_bottom');
					$viewBottom.addClass('scroll_bottom');
					$scrollBarHandler.css("top", "auto");
					$scrollBarHandler.css("bottom", 0);
					$scrollBarHandler.height(sbhHeight/2);

					$.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
					bottomScrollInterval = [];
					bottomScrollInterval.push(window.setInterval(function() {
						$content.scrollTop(boxHeight+targetHeight);
					}, 10));
					window.setTimeout(function() {
						$.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
						bottomScrollInterval = [];
					}, 800);

					if (p.f.disableSnapping) {
						animationTimeout = window.setTimeout(function() {
							window.clearTimeout(animationTimeout);
							animationTimeout = null;
							$content.removeClass('scroll_bottom');
							$viewBottom.removeClass('scroll_bottom');
							$scrollBarHandler.height(sbhHeight);
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