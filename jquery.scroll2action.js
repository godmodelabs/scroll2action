/**
 * @author: Thomas Lukacs
 */
(function($) {
	var
    animationTimeout = null,
    bottomScrollInterval = [],
    speedMap = {
        "webkit": 2,
        "ie": 3,
        "opera": 2,
        "mozilla": 2.5
    },
    utils = {
        findUp: function(node) {
            var found = false, normalScrollFirst = false;
            if (node === document) { return false; }
            $.each(_.elements, function(key, value) {
                if($(node).css("overflow-y") === "scroll") {
                    normalScrollFirst = true;
                    return false;
                }
                if (key === $(node).attr("data-s2a-id")) {
                    found = value;
                    return false;
                }
            });
            if (found) { return found; }
            if (normalScrollFirst) { return false; }

            var parent = node.parentElement || node.parentNode; /* Mozilla */
            if (parent === null) { return false; }
            return utils.findUp(parent);
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
            return speedMap[utils.getBrowser()] || false;
        }
    },
    _ = {
        f: {
            handlerIsSet: false,
            locked: false,
            scrollActive: false
        },

        config: {
            speed: utils.getSpeed() || 2
        },

        elements: {},
        elementCount: 0,
        element: function(config) {
            this.id = config.id;
            this.parent = config.parent;
            this.config = {
                snapping: config.snapping || false
            }

            this.cache = {
                position: config.parent.css("position")
            };

            this.content            = $("<div class='s2a_content'></div>");
            this.wrapper            = $("<div class='s2a_content_wrapper'></div>").append($('> *', this.parent));
            this.scrollBar          = $("<div class='s2a_scroll'></div>");
            this.scrollBarHandler   = $("<div class='s2a_scroll_handler' ></div>");
            this.viewTop            = $("<div class='s2a_view s2a_view_top'></div>");
            this.viewBottom         = $("<div class='s2a_view s2a_view_bottom'></div>");

            this.parent.css("position", "relative") // TODO get current position value, dont overwrite absolute/fixed

            this.parent.addClass("s2a_box");
            this.parent.attr("data-s2a-id", this.id);

            this.scrollBar.append(this.scrollBarHandler).appendTo(this.parent);
            this.content.append(this.wrapper).appendTo(this.parent);
            this.viewTop.prependTo(this.parent);
            this.viewBottom.appendTo(this.parent);

            this.setSize = function() {
                this.height  = this.parent.innerHeight();
                this.contentHeight = this.content.innerHeight();
                this.targetHeight = this.contentHeight < this.height? this.height : this.contentHeight;
                this.scrollBarHandlerHeight = ~~(this.height/this.contentHeight*this.height);
                this.ratio = this.height/this.targetHeight;

                var height = this.parent.height();
                var width = this.parent.width();
                this.content.height(height);
                this.viewBottom.width(width);
                this.viewTop.width(width);

                this.scrollBar.height(this.height);
                this.scrollBarHandler.height(this.scrollBarHandlerHeight);
            };
            this.setSize();

            _.handler.scrollbar(this);
        },

        init: function($elem, config) {
            if ($elem.hasClass("s2a_box")) { return false; } // No duplicate initialization

            // Bind scroll handler onmousewheel
            if (!_.f.handlerIsSet) {
                if (window.addEventListener) {
                    window.addEventListener('DOMMouseScroll', _.handler.DOMMouseScroll, false);
                }
                window.onmousewheel = document.onmousewheel = _.handler.DOMMouseScroll;
                _.f.handlerIsSet = true;
            }

            // Generate "unique" id
            var id = "s2a_"+(++_.elementCount);

            // Create scroll box
            _.elements[id] = new _.element($.extend({}, {
                id: id,
                parent: $elem
            }, config));
        },

        remove: function($elem) {
            var id = $elem.attr("data-s2a-id");
            if (!id || !(id in _.elements)) { return false; }
            var elem = _.elements[id];

            var children = $('.s2a_box', elem.parent);
            children.removeScroll2Action(); // TODO reactivate scroll2Action for children

            elem.parent.removeClass("s2a_box");
            elem.parent.html(elem.wrapper.html());
            elem.parent.removeAttr("data-s2a-id");
            elem.parent.css("position", elem.cache.position);

            delete _.elements[id];
        },

        handler: {
            DOMMouseScroll: function(e) {
                if (!e) { e = window.event; } /* IE */
                var target = utils.findUp($.event.fix(e).target);

                if (!!target) {
                    if (e.preventDefault) { e.preventDefault(); }
                    var delta = e.wheelDelta? e.wheelDelta : /* IE/Opera */
                                e.detail? -e.detail :	     /* Mozilla  */
                                0;

                    _.scroll(target, delta);

                    e.returnValue = false;
                }
            },
            scrollbar: (function() {

                var clickPos = null;
                var lastTarget = null;
                var posTop = 0;

                return function(elem) {
                    sb = elem.scrollBarHandler;
                    sb.mousedown(function(e) {
                        lastTarget = utils.findUp(this);
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
                            _.scrollTo(lastTarget, (posTop+e.pageY-clickPos)/lastTarget.ratio);
                        }
                    });
                }
            })()
        },

        scroll: function(elem, up) {
            if (_.f.locked) { return; }

            up = up > 0;
            var
                scrollTo = elem.content.scrollTop()+_.config.speed*-1*(up? 10 : -10),
                snapped = elem.content.hasClass('s2a_top')? 1 : elem.content.hasClass('s2a_bottom')? -1 : 0;

            // dont scroll further if snapped
            if (snapped > 0 && up || snapped < 0 && !up) { return; }

            // direction change -> release
            if (snapped > 0 && !up) {
                elem.content.removeClass('s2a_top');
                elem.viewTop.removeClass('s2a_top');
                elem.scrollBarHandler.height(elem.scrollBarHandlerHeight);
                _.f.locked = true;
                window.setTimeout(function() { _.f.locked = false; }, 400); // wait for animation
                return;
            }
            if (snapped < 0 && up) {
                elem.content.removeClass('s2a_bottom');
                elem.viewBottom.removeClass('s2a_bottom');
                elem.scrollBarHandler.height(elem.scrollBarHandlerHeight);
                _.f.locked = true;
                window.setTimeout(function() { _.f.locked = false; }, 400); // wait for animation
                return;
            }

            // actual scrolling
            _.scrollTo(elem, scrollTo);

            // reached top limit
            if (scrollTo < 0) {

                elem.content.addClass('s2a_top');
                elem.viewTop.addClass('s2a_top');
                elem.scrollBarHandler.height(elem.scrollBarHandlerHeight/2);

                if (!elem.config.snapping) {
                    window.clearTimeout(animationTimeout);
                    animationTimeout = window.setTimeout(function() {
                        window.clearTimeout(animationTimeout);
                        animationTimeout = null;
                        elem.content.removeClass('s2a_top');
                        elem.viewTop.removeClass('s2a_top');
                        elem.scrollBarHandler.height(elem.scrollBarHandlerHeight);
                        elem.scrollBar.removeClass("s2a_top");
                    }, 150);
                }

                // reached bottom limit
            } else if (scrollTo > elem.targetHeight-elem.height) {

                elem.content.addClass('s2a_bottom');
                elem.viewBottom.addClass('s2a_bottom');
                elem.scrollBarHandler.css("top", "auto");
                elem.scrollBarHandler.css("bottom", 0);
                elem.scrollBarHandler.height(elem.scrollBarHandlerHeight/2);

                $.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
                bottomScrollInterval = [];
                bottomScrollInterval.push(window.setInterval(function() {
                    elem.content.scrollTop(elem.height+elem.targetHeight);
                }, 10));
                window.setTimeout(function() {
                    $.each(bottomScrollInterval, function(k,v) { window.clearInterval(v); });
                    bottomScrollInterval = [];
                }, 800);

                if (!elem.config.snapping) {
                    animationTimeout = window.setTimeout(function() {
                        window.clearTimeout(animationTimeout);
                        animationTimeout = null;
                        elem.content.removeClass('s2a_bottom');
                        elem.viewBottom.removeClass('s2a_bottom');
                        elem.scrollBarHandler.height(elem.scrollBarHandlerHeight);
                    }, 150);
                }
            }
        },
        scrollTo: function(elem, value) {
            // actual scrolling
            elem.content.scrollTop(value);
            elem.content.attr("data-s2a-pos", value*elem.ratio);

            // ScrollbarHandler positioning
            var sbht = ~~(value*elem.ratio);
            elem.scrollBarHandler.css("top",
                sbht+elem.scrollBarHandlerHeight > elem.height? elem.height-elem.scrollBarHandlerHeight-2 :
                    sbht < 0? 0 : sbht );
        }
    };

	$.fn.scroll2Action = function(config) {
		return this.each(function() { _.init($(this), config); });
	};

    $.fn.removeScroll2Action = function() {
        return this.each(function() { _.remove($(this)); });
    };
})(jQuery);