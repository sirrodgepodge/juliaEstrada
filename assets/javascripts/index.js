// Create static jQuery selector vars
var $window = $(window),
    $placeHolder = $('#place-holder'),
    $landingHead = $('#landing-head'),
    $title = $('#title'),
    $contact = $('#contact'),
    $landing = $('#landing'),
    $landingContent = $landing.find('#landing-content').children(),
    $landingTogglers = $landing.find('.landing-tab'),
    $contactImg = $('.contact-img'),
    $contactSub = $('.contact-sub'),
    $contactSubInside = $contactSub.find('.contact-sub-inside'),
    $scrollTo = $('.scroll-to'),
    $floatFold = $('.float-fold'),
    $photosSect = $('#photos'),
    $videoBtn = $('.video-btn'),
    $videos = $('.video');

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

var main = function() {
    //// Setting up scrollTo animation
    $scrollTo.click(function(){
      $($(this).data("scrollTo")).ScrollTo({
        duration: $(this).data("scrollDuration") || 1000,
        offsetTop: titleHeight + ($(this).data("scrollTo") === '#videos'? titleHeight/2 : 3)
      });
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
      $landingTogglers.click(function() {
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
      });
    } else {
      // disable following link on tablet and phone
      $contactImg.click(function(){
        return false;
      });
    }

    // set initial contact sub width, adjusted because loaded font is skinnier
    $contactSub.innerWidth($contactSubInside.width());

    // update contact sub width
    $contactImg.mouseenter(function() {
        var selected = $(this).attr('class').split(' ')[1];
        if ($contactSubInside.text() !== contact[selected].text) {
            $contactSub.attr('href', contact[selected].link);
            if (!!contact[selected].link === $contactSub.hasClass('disable-link')) $contactSub.toggleClass('disable-link');  // check if there's a link for the contact button toggled
            slideSwitchText(contact[selected].text);
        }
    });


    //////////////////////////////////////////////////////////
    // $videos.each(function(){
    //   initBufferVideo($(this));
    // });

    $videoBtn.click(function(){
      var thisVideoBtn = $(this).addClass('bring-backward'); // remove link
      playVideo(thisVideoBtn.siblings('.video-container').children('.video'));  // play video
      thisVideoBtn.siblings('.video-container').addClass('bring-video-forward');  // fade in video
    });
};

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

function initBufferVideo(iframe){
    playVideo(iframe);
    setTimeout(stopVideo(iframe), 400);
}

function playVideo(iframe){
    iframe[0].contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
}

function stopVideo(iframe){
    iframe[0].contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
}

// Resize and Scroll listeners
function listeners() {
  // initial sync of state with HTML elements
  calcTriggerPoints();

  // update state and recalculate trigger points when screen is resized
  window.onresize = calcTriggerPoints;
  window.addEventListener("orientationchange", function() {
	// Announce the new orientation number
	alert(window.orientation);
  }, false);

  // update state based on scroll position
  window.onscroll = landingScroll;
}


// Store trigger points for state changes
function calcTriggerPoints() {
    // Calculate scroll values
    titleTop = Math.ceil($title.offset().top);
    titleHeight = Math.ceil($title.height());
    landingHeadFixPoint = titleTop - Math.ceil($landingHead.offset().top - window.pageYOffset) + 2.5; //distance from top of window calculation
    contactTop = Math.ceil($contact.offset().top) * 0.92;
    downAnimReached = Math.ceil(titleTop * 0.395 + 4.5); //when page position is such that the centered landing header is right above the down arrow;
    photosSectTop = Math.ceil($photosSect.offset().top * 0.82);

    // Check if any changes in DOM occur as a result of these calculations
    landingScroll();
}


// Check for DOM updates on scroll
function landingScroll() {
    //calculates current vertical scroll position
    pagePos = window.pageYOffset;

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
