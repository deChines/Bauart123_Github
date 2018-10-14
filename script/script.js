var slideTimeout;

$('#fullpage').fullpage({
    sectionsColor: ['#000', '#999', '#777'],
    anchors: ['home', 'about', 'contact'],
    animateAnchor: false,
    menu: '.nav',
    paddingTop: '60px',
    verticalCentered: false,
    slidesNavigation: true,
    slidesNavPosition: 'bottom',
    css3: true,
	dragAndMove: true, // TODO gloube muesch die extension choufe süsch funktionierts nid (siehe punkt 1): https://alvarotrigo.com/fullPage/extensions/faqs.html
	/*afterRender: function () {
		//on page load, start the slideshow
		 slideTimeout = setInterval(function () {
				$.fn.fullpage.moveSlideRight();
			}, 5000);
	}, */

    onLeave: function (index, direction) {
        //after leaving section 1 (home) and going anywhere else, whether scrolling down to next section or clicking a nav link, this SHOULD stop the slideshow and allow you to navigate the site...but it does not
        if (index == '1') {
            console.log('on leaving the slideshow/section1');
            clearInterval(slideTimeout);
        }
    }
});

-->

$.fn.scrollpane = function(options) {

    options = $.extend({
        direction: "horizontal",
        deadzone: 25,
        useTransition: false,
        desktop: true,
        setupCss: true,
        onscroll: function(pos, page, duration) {},
        onscrollfinish: function(pos, page) {}
    }, options);

    var isTouch = "ontouchend" in document || !options.desktop,
        onTouchstart = isTouch ? "touchstart" : "mousedown",
        onTouchmove = isTouch ? "touchmove" : "mousemove",
        onTouchend = isTouch ? "touchend" : "mouseup";



    return this.each(function() {

        // the scroll pane viewport
        var outerElem = $(this);

        // a large div containing the scrolling content
        var innerElem = $("<div></div>");

        innerElem.append(outerElem.children().remove());

        outerElem.append(innerElem);

        // cache these for later
        var outerWidth = outerElem.width();
        var outerHeight = outerElem.height();

        // boolean
        var horizontal = (options.direction === "horizontal");

        // the number of pixels the user has to drag and release to trigger a page transition
        // natural
        var deadzone = Math.max(0, options.deadzone);

        // the index of the current page. changed after the user completes each scrolling gesture.
        // integer
        var currentPage = 0;

        // width of a page
        // integer
        var scrollUnit = horizontal ? outerWidth : outerHeight;

        // x coordinate on the transform. -ve numbers go to the right,
        // so this goes -ve as currentPage goes +ve
        // integer (pixels)
        var currentPos = 0;


        // min and max scroll position:
        // integer (pixels)
        var scrollMax = 0;

        var scrollMin = -scrollUnit * (innerElem.children().length - 1);

        // time to settle after touched:
        // natural (ms)
        var settleTime = 200;


        // dragMid and dragEnd are updated each frame of dragging:
        // integer (pixels)
        var dragStart = 0; // touch position when dragging starts
        var dragMid = 0; // touch position on the last touchmove event
        var dragEnd = 0; // touch position on this touchmove event
        // +1 if dragging in +ve x direction, -1 if dragging in -ve x direction
        // U(-1, +1)
        var dragDir = 0;

        if (options.setupCss) {

            outerElem.css({
                position: "relative",
                overflow: "hidden"
            });

            // position the pages:
            innerElem.children().each(function(index) {
                $(this).css({
                    position: "absolute",
                    display: "block",
                    width: outerWidth,
                    height: outerHeight
                }).css(horizontal ? "left" : "top", scrollUnit * index);
            });

        }

        // natural natural boolean -> void

        function scrollTo(position, duration, finish) {
            var parameters = {};
            parameters[(horizontal ? 'marginLeft' : 'marginTop')] = position;

            options.onscroll(position, -position / scrollUnit, duration);

            if (options.useTransition) {
                innerElem.css({
                    transition: "none",
                    transform: horizontal ? ("translate3d(" + position + "px, 0, 0)") : ("translate3d(0, " + position + "px, 0)")
                });
            }


            if (finish) {
                if (!options.useTransition) {
                    innerElem.find('li').animate(parameters, duration);
                } else {
                    innerElem.css({
                        transition: "all " + (duration === 0 ? "0" : duration + "ms")
                    });
                }
                setTimeout(function() {
                    options.onscrollfinish(position, -position / scrollUnit, duration);
                });
            } else if (!options.useTransition) {
                innerElem.find('li').stop().css(parameters);
            }
        }

        // Immediately set the 3D transform on the scroll pane.
        // This causes Safari to create OpenGL resources to manage the animation.
        // This sometimes causes a brief flicker, so best to do it at page load
        // rather than waiting until the user starts to drag.
        scrollTo(0, 0, true);




        // bind the touch drag events:
        outerElem.on(onTouchstart, function(e) {
            e = isTouch ? e.originalEvent.touches[0] || e.originalEvent.changedTouches[0] : e;
            dragStart = dragEnd = dragMid = horizontal ? e.pageX : e.pageY;

            // bind the touch drag event:
            $(this).on(onTouchmove, function(e) {
                e = isTouch ? e.originalEvent.touches[0] || e.originalEvent.changedTouches[0] : e;

                dragEnd = horizontal ? e.pageX : e.pageY;
                dragDir = (dragEnd - dragMid) > 0 ? 1 : -1;
                currentPos += dragEnd - dragMid;
                dragMid = dragEnd;
                scrollTo(currentPos, 0, false);
            });

            // bind the touch end event
        }).on(onTouchend, function(e) {

            // boolean
            var reset = Math.abs(dragEnd - dragStart) < deadzone;

            // real
            var scrollPage = -1.0 * currentPos / scrollUnit;

            // natural
            var nextPage = reset ? currentPage : (dragDir < 0 ? Math.ceil(scrollPage) : Math.floor(scrollPage));

            // int
            var nextPos = Math.max(scrollMin, Math.min(scrollMax, -scrollUnit * nextPage));

            currentPos = nextPos;
            currentPage = nextPage;

            scrollTo(nextPos, settleTime, true);
            outerElem.off(onTouchmove);

        });

        // set up the menu callback:
        outerElem.data("showpage", function(page) {
            // int
            page = page < 0 ? innerElem.children().length + page : page;
            currentPos = Math.max(scrollMin, Math.min(scrollMax, -page * scrollUnit));
            currentPage = -currentPos / scrollUnit;
            scrollTo(currentPos, settleTime, true);
        });

    });
};



// Once you've initialized a scrollpane with $().scrollpane(),
// you can use this method to cause it to programmatically scroll
// to a particular page. Useful for creating a navigation menu, or
// those little dots on Apple-store-style product galleries.
//
// Pages are indexed from 0 upwards. Negative numbers can be used
// to index pages from the right.
//
// int -> jQuery
$.fn.showpage = function(index) {
    var fn = this.data("showpage");
    fn(index);
    return this;
};


$(document).bind("touchmove", function() {
    return false;
});

$(function() {
    $("#hpane").scrollpane();

    $("#vpane").scrollpane({
        direction: 'vertical',
        onscroll: function(pos, page, duration) {
            $("#pos").text(pos);
            $("#page").text(page);
            $("#snapping").text("no");
        },
        onscrollfinish: function(pos, page) {
            $("#pos").text(pos);
            $("#page").text(page);
            $("#snapping").text("yes");
        }
    });

    $("ul.pager li").click(function() {
        var index = $(this).index();
        $("#hpane").showpage(index);
        $("#vpane").showpage(index);
    });

    $("input").click(function() {
        alert(this.value);
    });
});


$(".menuIcon").click(function() {
    alert('TODO open the menu');
});