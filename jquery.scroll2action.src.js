/**
 * @author: Thomas Lukacs
 */
(function($) {
	var animationTimeout = null;
	var bottomScrollInterval = [];

	$.fn.scroll2action = function() {

		var _ = {
			f: {
				handlerIsSet: false,
				locked: false,
				scrollActive: false
			},

			config: {
				speedMap: {
					"webkit": 2,
					"ie": 3,
					"opera": 2,
					"mozilla": 2.5
				},
				speed: null,
				snapping: false
			},

			elements: {},
			elementCount: 0,
			element: function(config) {
				this.id = config.id;
				this.parent = config.parent;
				this.content = $("<div class='s2a_content'></div>");
				this.wrapper = $("<div class='s2a_wrapper'></div>").append($('> *', this.parent));
				this.addStyling = function() {
					this.parent
						.css("position", "relative")
						.css("overflow", "hidden");
	
					var height = this.parent.height();
					var width = this.parent.width();
					this.content.height(height);
					this.viewBottom.width(width);
					this.viewTop.width(width);
				};
				this.addScrollbar = function() {
					this.scrollBar = $("<div class='s2a_scroll'></div>");
					this.scrollBarHandler = $("<div class='s2a_handler' ></div>");
					this.parent.append(this.scrollBar.append(this.scrollBarHandler));
				};

				this.parent.addClass("s2a_box");
				this.content.append(this.wrapper).appendTo(this.parent);
			},

			init: function(elem) {

				// Bind Scroll handler onmousewheel
				if (!_.f.handlerIsSet) {
					if (window.addEventListener) {
						window.addEventListener('DOMMouseScroll', _.handler.DOMMouseScroll, false);
					}
					window.onmousewheel = document.onmousewheel = _.handler.DOMMouseScroll;
					_.f.handlerIsSet = true;
				}

				_.config.speed = _.config.speed || (_.utils.getSpeed() || 2);

				var id = "s2a_"+(++_.elementCount);
				_.elements[id] = new _.element({
					id: id,
					parent: elem
				});

				_.elements[id].addScrollbar();

				_.addScrollbar(_.elements[id]);
				_.addViews(_.elements[id]);

				_.elements[id].addStyling();
			},

			handler: {
				DOMMouseScroll: function(e) {
					if (!e) { e = window.event; } /* IE */
					var target = _.utils.findUp($.event.fix(e).target);

					if (!!target) {
						var delta = e.wheelDelta? e.wheelDelta : /* IE/Opera */
									e.detail? -e.detail :	     /* Mozilla  */
									0;

						_.scroll(target, delta);

						if (e.preventDefault) { e.preventDefault(); }
						e.returnValue = false;
					}
				}
			},

			utils: {
				findUp: function(node) {
					var found = false;
					$.each(_.elements, function(key, value) {
						if (value.parent[0] === $(node)[0]) { found = value; }
					});
					if (found) { return found; }

					var parent = node.parentElement || node.parentNode; /* Mozilla */
					if (parent === null) { return false; }
					return _.utils.findUp(parent);
				},
				getBrowser: function() {
					var b = $.browser;
					return b.webkit? "webkit":
						   b.msie? "ie":
						   b.opera? "opera":
						   b.mozilla? "mozilla":
						   false;
				},
				getSpeed: function() {
					return _.config.speedMap[_.utils.getBrowser()] || false;
				}
			},


			addScrollbar: function(elem) {
				var
				boxHeight = elem.parent.innerHeight(),
				targetHeight = elem.content.innerHeight();

				_.bindScrollbarHandler(elem.scrollBarHandler);

				elem.scrollBar.height(boxHeight);
				elem.scrollBarHandler.height(~~(boxHeight/targetHeight*boxHeight));
			},
			bindScrollbarHandler: (function() {

				var clickPos = null;
				var lastTarget = null;
				var posTop = 0;

				return function(sb) {
					sb.mousedown(function(e) {
						lastTarget = _.utils.findUp(this);
						clickPos = e.pageY;
						_.f.scrollActive = true;
						if (lastTarget !== null) {
							lastTarget.parent.addClass("s2a_scrollActive");
							posTop = ~~lastTarget.content.attr("data-s2a-pos");
						}
					});
					$('body').mouseup(function() {
						_.f.scrollActive = false;
						if (lastTarget !== null) {
							lastTarget.parent.removeClass("s2a_scrollActive");
							lastTarget.scrollBar.removeClass("hover");
						}
					});

					$('body').mousemove(function(e) {
						if (!_.f.scrollActive) { return; }
						if (lastTarget !== null) {
							_.scrollTo(lastTarget, posTop+e.pageY-clickPos, true);
						}
					});
				}
			})(),


			addViews: function(elem) {
				elem.viewTop = $("<div class='s2a_view s2a_viewTop'></div>");
				elem.viewBottom = $("<div class='s2a_view s2a_viewBottom'></div>");
				elem.parent.prepend(elem.viewTop).append(elem.viewBottom);
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
				if (_.f.locked) { return; }

				up = up > 0;
				var
				scrollTo = target.content.scrollTop()+_.config.speed*-1*(up? 10 : -10),
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
					_.f.locked = true;
					window.setTimeout(function() { _.f.locked = false; }, 400); // wait for animation
					return;
				}
				if (snapped < 0 && up) {
					target.content.removeClass('s2a_bottom');
					target.viewBottom.removeClass('s2a_bottom');
					target.scrollBarHandler.height(sbhHeight);
					_.f.locked = true;
					window.setTimeout(function() { _.f.locked = false; }, 400); // wait for animation
					return;
				}

				// actual scrolling
				_.scrollTo(target, scrollTo);

				// reached top limit
				if (scrollTo < 0) {

					target.content.addClass('s2a_top');
					target.viewTop.addClass('s2a_top');
					target.scrollBarHandler.height(sbhHeight/2);

					if (!_.config.snapping) {
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

					if (!_.config.snapping) {
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
			_.init($(this));
		});
	};
})(jQuery);