loadCSS('/style.css');
loadCSS('/fonts.css');

var $window = $(window);

var floatFoldImgRegex = /background-image: url\(\)/g;

// Store trigger points for state changes
var titleTop,
    titleHeight,
    landingHeadFixPoint,
    contactTop,
    downAnimReached,
    photosSectTop;

// State booleans
var pagePos = 0,
    titleFixed = false,
    landingHeadFixed = false,
    topTextShowing = true,
    contactPopped = false,
    photosTriggered = false;

// Getting back end data
var contact = {};

$.get('/api/info', function(data) {
    contact = data.contact;
});

// UI Functionality
var landingTogglerClicked = false;

function main() {
    // Create static jQuery selector vars
    with('window.') {
      $placeHolder = $('#place-holder');
      $landingHead = $('#landing-head');
      $landing = $('#landing');
      $title = $('#title');
      $contact = $('#contact');
      $landingContent = $landing.find('#landing-content').children();
      $landingTogglers = $landing.find('.landing-tab');
      $contactImg = $('.contact-img');
      $contactSub = $('.contact-sub');
      $contactSubInside = $contactSub.find('.contact-sub-inside');
      $scrollTo = $('.scroll-to');
      $floatFold = $('.float-fold');
      $photosSect = $('#photos');
      $videoContainer = $('.video-container');
      $videos = $('.video');
    }

    //// Setting up scrollTo animation
    $scrollTo.click(function(event){
      $($(this).data("scrollTo")).ScrollTo({
        duration: $(this).data("scrollDuration") || 1000,
        offsetTop: titleHeight + ($(this).data("scrollTo") === '#videos'? titleHeight/2 : 3)
      });
      if(event.bubbles) event.stopPropogation();
    });

    //// Crazy photo animation setup
    // how many times images will get sliced for animation
    var totalSlices = 6,
        struct	= '',
        i;

    // add tags to string
    for(i = 1; i < totalSlices + 1; i++) {
      struct	+= '<div class="slice total-slices-' + totalSlices + ' slice-' + i + '" style="background-image: url(), linear-gradient(top, rgba(0,0,0,0) 0%,rgba(0,0,0, .7) 100%); background-image: url(), -webkit-linear-gradient(top, rgba(0,0,0,0) 0%,rgba(0,0,0, .7) 100%); background-image: url(), -moz-linear-gradient(top, rgba(0,0,0,0) 0%,rgba(0,0,0, .7) 100%); background-image: url(), -ms-linear-gradient(top, rgba(0,0,0,0) 0%,rgba(0,0,0, .7) 100%); background-image: url(), -o-linear-gradient(top, rgba(0,0,0,0) 0%,rgba(0,0,0, .7) 100%);">';
    }

    for(i = totalSlices; i > 0; i--) {
      struct	+= '</div>';
    }

	  $floatFold.each(function(i) {
    	var $this = $(this),
    		imgPath	= $this.data('src');
        // if(!$this.complete) $.get(imgPath);
        // $this.addClass('float-fold-' + i + ' float-fold-total-' + $floatFold.length)
        //     .append($(struct.replace(floatFoldImgRegex, 'background-image: url('+ imgPath +')' )));
        var imgClasses = $this.attr('class');
        $this.replaceWith($('<div class="' + imgClasses + ' float-fold-' + i + ' float-fold-total-' + $floatFold.length + '"></div>')
             .append($(struct.replace(floatFoldImgRegex, 'background-image: url('+ imgPath +')' ))));
    });

    // Add scroll and resize listeners
    listeners();

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

    // set initial contact sub width, adjusted because loaded font is skinnier
    $contactSub.innerWidth($contactSubInside.width());

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

    // async load youtube API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, firstScriptTag);
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

var isIOS = navigator.userAgent.match(/iPhone|ipod/i);

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
    // var iframe = document.createElement("iframe");
    // console.dir(iframe);
    // iframe.className = "video";
    // iframe.setAttribute("src", "//www.youtube.com/embed/" +
    //                     this.dataset.youtubeId + "?" +
    //                     (this.dataset.start ? "start=" + this.dataset.start + "&" : "") +
    //                     (this.dataset.end ? "end=" + this.dataset.end + "&" : "") +
    //                     "autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=0&enablejsapi=1");
    // iframe.setAttribute("allowfullscreen", "");
    // this.appendChild(iframe, this);
    // window.addEventListener("message", function(message){
    //   console.log('message');
    //   console.log(message);
    //   iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    // }, false);
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

// function initBufferVideo(iframe){
//     playVideo(iframe);
//     setTimeout(stopVideo(iframe), 400);
// }

// function playVideo(iframe){
//     iframe[0].contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
// }

// function stopVideo(iframe){
//     iframe[0].contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
// }

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
  window.addEventListener('resize', calcTriggerPoints);

  // on orientation change fire both
  window.addEventListener('orientationchange', calcTriggerPoints);
}


// Store trigger points for state changes
function calcTriggerPoints(event) {
    // Calculate scroll values
    titleTop = $landing.outerHeight();
    titleHeight = $title.height();
    // when to fix image to title bar, don't ever mess with this, finalllly got it!  Needs to be forced to bottom of stack for iPhone
    setTimeout(function(){
      landingHeadFixPoint = $window.innerHeight() * 0.61 - ($title.outerHeight() - $landingHead.outerHeight())/2 - 6.25;
      console.log('window.innerHeight',window.innerHeight);
      console.log('$window.innerHeight()',$window.innerHeight());
      console.log('landingHeadFixPoint',landingHeadFixPoint);
    });
    contactTop = Math.ceil($contact.offset().top) * 0.92;
    downAnimReached = Math.ceil(titleTop * 0.395 + 4.5); //when page position is such that the centered landing header is right above the down arrow;
    photosSectTop = Math.ceil($photosSect.offset().top * 0.82);

    // Check if any changes in DOM occur as a result of these calculations
    scrollTriggers();
    event && event.stopImmediatePropagation();
}


// debounce scroll handling
function onScroll(event) {
  latestKnownScrollY = window.scrollY;
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
    // if (pagePos >= titleTop) {
    //   // console.log(pagePos - titleTop);
    //   // console.log($title.css('transform'));
    //   $title.css('transform', 'translateY(' + (pagePos - titleTop) + 'px)');
    // }

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

$(document).ready(main);
