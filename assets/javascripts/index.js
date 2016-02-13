var $window = $(window),
    $document = $(document),
    $body = $('body'),
    $landing,
    $modal,
    $modalWrapper;

// load CSS files async
setTimeout(function(){
  var stylesheet = loadCSS('/style.css');
  onloadCSS(stylesheet, function(){
    if($landing) calcTriggerPoints();
  });
});

var floatFoldImgRegex = /background-image: url\(\)/g;

var scrollBarWidth = getScrollBarWidth();

// Store trigger points for state changes
var titleTop,
    titleHeight,
    landingHeadFixPoint,
    contactTop,
    downAnimReached,
    photosSectTop,
    windowWidth,
    windowHeight,
    documentHeight,
    sectionMenuTrigger = [];

// State booleans
var pagePos = 0,
    titleFixed = false,
    landingHeadFixed = false,
    topTextShowing = true,
    contactPopped = false,
    photosTriggered = false;

// Getting back end data
var contact = {},
    photos = [];

// ajax for back end data
$.get('/api/info', function(data) {
    contact = data.contact;
});

// adding key events to modal carousel
$document.keyup(function(e) {
    if($modalWrapper && !$modalWrapper.hasClass('hidden')) {
      if(e.keyCode == 27) {
        $modalWrapper.addClass('hidden'); // escape key closes modal
        $body.attr('style', $body.attr('style').replace("overflow: hidden; padding-right: " + scrollBarWidth + "px;", ""));
        $title.attr('style', $title.attr('style').replace("padding-right: " + scrollBarWidth + "px;", ""));
        $paperResumeWrapper.attr('style', "right: 0px;");
      }
      if(e.keyCode == 39 || e.keyCode == 38) $modal.slick('slickGoTo', $modal.slick('slickCurrentSlide') + 1); // right key and up key move modal forwards
      if(e.keyCode == 37 || e.keyCode == 40) $modal.slick('slickGoTo', $modal.slick('slickCurrentSlide') - 1); // left key and down key move modal backwards
    }
});

// UI Functionality
var landingTogglerClicked = false;

function main() {
    // load CSS files following initial DOM render
    setTimeout(function(){
      loadCSS('/fonts.css');
    });

    // Create static jQuery selector vars
    $landing = $('#landing');
    window.$placeHolder = $('#place-holder');
    window.$landingHead = $('#landing-head');
    window.$title = $('#title');
    window.$titleSections = $title.children('.scroll-to');
    window.$contact = $('#contact');
    window.$landingContent = $landing.find('#landing-content').children();
    window.$landingTogglers = $landing.find('.landing-tab');
    window.$contactImg = $('.contact-img');
    window.$contactSub = $('.contact-sub');
    window.$contactSubInside = $contactSub.children('.contact-sub-inside');
    window.$scrollTo = $('.scroll-to');
    window.$floatFold = $('.float-fold');
    window.$photosSect = $('#photos');
    window.$videoContainer = $('.video-container');
    window.$videos = $('.video');
    $modalWrapper = $('#Modal-wrapper');
    $modal = $modalWrapper.children('#Modal');
    window.$modalShadow = $modalWrapper.children('#Modal-shadow');
    window.$paperResumeWrapper = $('.paper-resume-wrapper');

    //// Setting up scrollTo animation
    $scrollTo.click(function(event){
      $($(this).data("scrollTo")).ScrollTo({
        duration: $(this).data("scrollDuration") || 1000,
        offsetTop: titleHeight + ($window.width() <= 768 ? titleHeight * 0.3 : $(this).data("scrollTo") === '#videos'? titleHeight/2 : 3)
      });
      event.stopImmediatePropagation();
    });

    if($window.width() > 768) {
      //// Landing Section
      $landingTogglers.click(function(event) {
          var notSelImg;
          var tempThis; //for storing context
          if (!$(this).hasClass('landing-active')) {
              if (!$landingHead.hasClass('fade-out')) {
                  $landingHead.addClass('fade-out');
                  landingTogglerClicked = !landingTogglerClicked && !!$title.addClass('show-logo');
                  $(this).toggleClass('landing-active');
                  tempThis = this;
                  if ($(this).attr("id") === 'tab-2') {
                      notSelImg = $('.landing-img').not('.show');
                      $('.landing-img.show').toggleClass('show');
                      setTimeout(function() {
                          $(tempThis).children('.full').toggleClass('show');
                          notSelImg.toggleClass('show');
                      }, 400);
                  } else {
                      setTimeout(function() {
                          $(tempThis).children('.full').toggleClass('show');
                      }, 400);
                  }
              } else {
                  var $startLandingActive = $('.landing-active');
                  $startLandingActive.toggleClass('landing-active');
                  $startLandingActive.children('.full').toggleClass('show');
                  $(this).toggleClass('landing-active');
                  tempThis = this;
                  notSelImg = $('.landing-img').not('.show');
                  $('.landing-img.show').toggleClass('show');
                  setTimeout(function() {
                      $(tempThis).children('.full').toggleClass('show');
                      notSelImg.toggleClass('show');
                  }, 400);
              }
          }
          event.stopImmediatePropagation();
      });
    } else {
      // disable following link on tablet and phone
      $contactImg.click(function(event){
        event.stopImmediatePropagation();
        return false;
      });
    }

    // init slick
    $modal.slick({
      centerMode: true,
      slidesToShow: 3,
      variableWidth: true,
      arrows: false,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 3
          }
        },
        {
          breakpoint: 500,
          settings: {
            slidesToShow: 1
          }
        }
      ]
    });

    var firstClick = true;
    $floatFold.each(function(i) {
      var $this = $(this);
      $this.click(function(){
        $modalWrapper.removeClass('hidden');
        if(firstClick) {
          $modalWrapper.attr('style', $modalWrapper.attr('style').replace("display: none;", ""));
          firstClick = false;
        }
        $body.attr('style', ($body.attr('style') || '') + "overflow: hidden; padding-right: " + scrollBarWidth + "px;");
        $title.attr('style', ($title.attr('style') || '') + "padding-right: " + scrollBarWidth + "px;");
        $paperResumeWrapper.attr('style', ($paperResumeWrapper.attr('style') || '') + "right: " + scrollBarWidth + "px;");
        $modal.slick('slickGoTo', i);
        event.stopImmediatePropagation();
      });
    });

    $('.slick-slide').each(function(i){
      var $this = $(this);
      $this.click(function(event){
        $modal.slick('slickGoTo', $this.data('slickIndex'));
        event.stopImmediatePropagation();
      });
    });

    $modal.on('setPosition', function(event, slick, currentSlide, nextSlide) {
      var slidesShown = $modal.slick('slickGetOption', 'slidesToShow');
      var numberOfSlides = $modal.find('.slick-slide').length;

      if (slidesShown === numberOfSlides)
        $modal.find('.slick-track').css('transform', 'translate3d(0px, 0px, 0px)');
    });

    $modalShadow.click(function(){
      $modalWrapper.addClass('hidden');
      $body.attr('style', $body.attr('style').replace("overflow: hidden; padding-right: " + scrollBarWidth + "px;", ""));
      $title.attr('style', $title.attr('style').replace("padding-right: " + scrollBarWidth + "px;", ""));
      $paperResumeWrapper.attr('style', "right: 0px;");
      event.stopImmediatePropagation();
    });

    // update contact sub width
    $contactImg.mouseenter(function(event) {
      var selected = $(this).attr('class').split(' ')[1];
      if ($contactSubInside.text() !== contact[selected].text) {
        $contactSub.attr('href', contact[selected].link);
        if (!!contact[selected].link === $contactSub.hasClass('disable-link')) $contactSub.toggleClass('disable-link');  // check if there's a link for the contact button toggled
        slideSwitchText(contact[selected].text);
        event.stopImmediatePropagation();
      }
    });

    // set initial contact sub width, adjusted because loaded font is skinnier
    var intervalCount = 0;
    var settingFunc = setInterval(function(){
      if(intervalCount < 7) {
        $contactSub.innerWidth($contactSubInside.width());
        intervalCount++;
      } else clearInterval(settingFunc);
    }, 200);

    // async load youtube API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, firstScriptTag);

    // Add scroll and resize listeners
    setTimeout(function(){
      listeners();
    });
}

//// Create click events to play Youtube videos
function onYouTubeIframeAPIReady() {
  $videoContainer.click(function(event){
    if(this.className.indexOf('fade-to-youtube') === -1) {
      addPlayerAndPlay.call(this);  // play video
      this.className += ' fade-to-youtube'; // remove link
    }
    event.stopImmediatePropagation();
  });
}

//// Add player and play it
function addPlayerAndPlay() {
    var player = new YT.Player(this.dataset.elemId, {
      videoId: this.dataset.youtubeId,
      playerVars: {
        start: +this.dataset.start,
        end: +this.dataset.end
      },
      events: {
        onReady: function(event) {
          event.target.playVideo();
          event.target.setVolume(0);
        },
        onStateChange: function(event) {
          if((event.data === YT.PlayerState.PLAYING || isIOS && event.data === YT.PlayerState.BUFFERING) && event.target.f.className.indexOf('showYoutube') === -1) {
            var volume = 0;
            var fadeInVolume = setInterval(function(){
              volume = volume += 10;
              event.target.setVolume(volume);
              volume === 100 && clearInterval(fadeInVolume);
            }, 150);
            event.target.f.className += ' showYoutube';
          }
        }
      }
    });
}

//// Contact Section
//function for sliding box on text change in contact section
function slideSwitchText(val) {
    $contactSubInside.toggleClass('show');
    setTimeout(function(){
        $contactSubInside.text(val);
        $contactSubInside.toggleClass('show');
        $contactSub.innerWidth($contactSubInside.width());
    },525);
}

// scroll event vars
var latestKnownScrollY = 0,
    ticking = false;

// Resize and Scroll listeners
function listeners() {
  // initial sync of state with HTML elements
  calcTriggerPoints();

  // update state based on scroll position
  window.addEventListener('scroll', onScroll);

  // update state and recalculate trigger points when screen is resized
  var timeout;
  window.addEventListener('resize', function(){
    calcTriggerPoints();
    if($modal) {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        $modal.slick('slickGoTo', $modal.slick('slickCurrentSlide'));
      }, 100);
    }
  });

  // on orientation change fire both
  window.addEventListener('orientationchange', calcTriggerPoints);
}


// Store trigger points for state changes
function calcTriggerPoints(event) {
    if(!window.$title) return; //if jQuery vars don't exist yet don't run

    // Calculate scroll values
    titleTop = $landing.outerHeight() + 2; // 2 takes into account bottom border on landing image
    titleHeight = $title.height();
    windowHeight = $window.height();
    windowWidth = $window.width();
    documentHeight = $document.height();

    // when to fix image to title bar, don't ever mess with this, finalllly got it!  Needs to be forced to bottom of stack for iPhone
    var intervalCount = 0;
    var interval = setInterval(function(){
      if(intervalCount < 7) {
        landingHeadFixPoint = $window.innerHeight() * 0.61 - ($title.outerHeight() - $landingHead.outerHeight())/2 - 6.25;
        intervalCount++;
      } else clearInterval(interval);
    });

    // when to make contact buttons pop out
    contactTop = Math.ceil($contact.offset().top) * 0.92;
    downAnimReached = Math.ceil(titleTop * 0.395 + 4.5); //when page position is such that the centered landing header is right above the down arrow;
    photosSectTop = Math.ceil($photosSect.offset().top * 0.82);

    sectionMenuTrigger = [];
    if(windowWidth > 768) {
      $titleSections.each(function(){
        var $currentTitleSection = $(this);
        var elemIdStr = $currentTitleSection.data("scrollTo");
        var elem = $(elemIdStr);
        sectionMenuTrigger.push({
          active: false,
          elem: $currentTitleSection,
          top: Math.floor(Math.min(windowHeight + elem.offset().top - (elemIdStr === '#videos' ? titleHeight * 2 - 16 : titleHeight + 8), documentHeight) + (!titleFixed && elemIdStr === '#contact' && titleHeight - 40))
        });
        sectionMenuTrigger.sort(function(a, b){
          return b.top - a.top > 0;
        });
      });
    }

    // Check if any changes in DOM occur as a result of these calculations
    scrollTriggers();
    event && event.stopImmediatePropagation();
}


// debounce scroll handling
function onScroll(event) {
  latestKnownScrollY = window.scrollY || window.pageYOffset;
  requestTick();
  event.stopImmediatePropagation();
}


// attempt animation
function requestTick() {
  if(!ticking)
    requestAnimationFrame(scrollTriggers);
  ticking = true;
}


// Check for DOM updates on scroll
function scrollTriggers() {
    //calculates current vertical scroll position
    ticking = false;
    pagePos = latestKnownScrollY;

    //fixes title header to proper position
    if (!landingTogglerClicked && (pagePos >= landingHeadFixPoint && !landingHeadFixed || pagePos < landingHeadFixPoint && landingHeadFixed)) {
        $landingHead.toggleClass('landing-head-hide');
        $title.toggleClass('show-logo');
        landingHeadFixed = !landingHeadFixed;
    }

    if(windowWidth > 768) {
      var haveHitActive = false;
      sectionMenuTrigger.forEach(function(val, index, arr){
        if(val.active) {
          if(!haveHitActive && pagePos + windowHeight >= val.top) haveHitActive = true;
          else {
            val.elem.removeClass('active');
            val.active = false;
          }
        }
        else if(!val.active && pagePos + windowHeight >= val.top && !haveHitActive) {
          val.elem.addClass('active');
          val.active = true;
          haveHitActive = true;
        }
      });
    }

    //fades all but title with scroll
    if (pagePos < downAnimReached && !topTextShowing) topTextShowing = true;
    if (pagePos === 0) $landingContent.css('opacity', 1);
    else if (pagePos >= downAnimReached && topTextShowing) $landingContent.css('opacity', +(topTextShowing = false));
    else if (pagePos > 0 && pagePos < downAnimReached) $landingContent.css('opacity', 1 - pagePos / downAnimReached);

    //fixes main title to top of page
    if (pagePos >= titleTop && !titleFixed || pagePos < titleTop && titleFixed) {
        $title.toggleClass('sticky');
        $placeHolder.toggleClass('no-show');
        titleFixed = !titleFixed;
    }

    //triggers photo animation
    if(!photosTriggered && pagePos > photosSectTop) {
      $photosSect.addClass('triggered');
      photosTriggered = true;
    }

    //make contact pop
    if (pagePos >= contactTop && !contactPopped || pagePos < contactTop && contactPopped) {
        $contact.toggleClass('poppin');
        contactPopped = !contactPopped;
    }
}

function getScrollBarWidth() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    document.body.removeChild(outer);

    return (w1 - w2);
}

function onloadCSS(ss, callback ){
	var called;
	function newcb(){
			if( !called && callback ){
				called = true;
				callback.call( ss );
			}
	}
	if( ss.addEventListener ){
		ss.addEventListener( "load", newcb );
	}
	if( ss.attachEvent ){
		ss.attachEvent( "onload", newcb );
	}

	// This code is for browsers that don’t support onload
	// No support for onload (it'll bind but never fire):
	//	* Android 4.3 (Samsung Galaxy S4, Browserstack)
	//	* Android 4.2 Browser (Samsung Galaxy SIII Mini GT-I8200L)
	//	* Android 2.3 (Pantech Burst P9070)

	// Weak inference targets Android < 4.4
 	if( "isApplicationInstalled" in navigator && "onloadcssdefined" in ss ) {
		ss.onloadcssdefined( newcb );
	}
}

$document.ready(main);
