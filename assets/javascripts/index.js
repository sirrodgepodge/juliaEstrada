// Create static jQuery selector vars
var $window = $(window),
    $placeHolder = $('.place-holder'),
    $landingHead = $('.landing-head'),
    $title = $('.title'),
    $contact = $('#contact'),
    $landing = $('#landing'),
    $landingContent = $landing.find('.landing-content').children(),
    $landingTogglers = $landing.find('.landing-tab'),
    $downAnim = $landing.find('.down-anim'),
    $contactImg = $('.contact-img'),
    $contactSub = $('.contact-sub'),
    $contactSubInside = $contactSub.find('.contact-sub-inside'),
    $scrollTo = $('.scroll-to'),
    $floatFold = $('.float-fold'),
    $photosSect = $('#photos'),
    $videoBtn = $('.video-btn'),
    $videos = $('.video');

var floatFoldImgRegex = /background-image: url\(\)/g;

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
      console.log(this);
      $($(this).data("scrollTo")).ScrollTo({
        duration: 1000,
        offsetTop: titleHeight + ($(this).data("scrollTo") === '#videos' ? titleHeight : 3)
      });
    });

    if(true) { //$window.width() > 550
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
      		imgPath	= $this.attr('src'),
          imgClasses = $this.attr('class');

          $this.replaceWith($('<div class="' + imgClasses + ' float-fold-' + i + ' float-fold-total-' + $floatFold.length + '"></div>')
               .append($(struct.replace(floatFoldImgRegex, 'background-image: url('+ imgPath +')' ))));
      });
    }

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
                if ($(this).hasClass('tab-2')) {
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

    $downAnim.click(function() {
        $('html, body').animate({
            scrollTop: titleTop
        }, titleTop - $(window).scrollTop() * 0.8);
    });

    // set initial contact sub width, adjusted because loaded font is skinnier
    $contactSub.innerWidth($contactSubInside.width() * 0.95);

    // update contact sub width
    $contactImg.mouseenter(function() {
        var selected = $(this).attr('class').split(' ')[1];
        if ($contactSubInside.text() !== contact[selected].text) {
            $contactSub.attr('href', contact[selected].link);
            if (!!contact[selected].link === $contactSub.hasClass('disable-link')) $contactSub.toggleClass('disable-link');  // check if there's a link for the contact button toggled
            slideSwitchText(contact[selected].text);
        }
    });

    // disable following link on tablet and phone
    $contactImg.click(function(){
      if($window.width() < 768) return false;
    });

    // Add scroll and resize listeners
    listeners();

    //////////////////////////////////////////////////////////
    $videos.each(function(){
      initBufferVideo($(this));
    });

    $videoBtn.click(function(){
      var thisVideoBtn = $(this).addClass('bring-backward'); // remove link
      playVideo(thisVideoBtn.siblings('.picture').children('.video'));  // play video
      thisVideoBtn.siblings('.picture').addClass('bring-video-forward');  // fade in video
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

// Resize and Scroll listeners
function listeners() {
  // initial sync of state with HTML elements
  calcTriggerPoints();

  // update state and recalculate trigger points when screen is resized
  $window.resize(calcTriggerPoints);

  // update state based on scroll position
  $window.scroll(landingScroll);
}


// Store trigger points for state changes
function calcTriggerPoints() {
    // Calculate scroll values
    titleTop = Math.ceil($title.offset().top) + 1;
    titleHeight = Math.ceil($title.height());
    landingHeadFixPoint = titleTop - Math.ceil($landingHead.position().top) + 1;
    contactTop = Math.ceil($contact.offset().top) * 0.92;
    downAnimReached = Math.ceil(titleTop * 0.395 + 4.5); //when page position is such that the centered landing header is right above the down arrow;
    photosSectTop = Math.ceil($photosSect.offset().top * 0.82);

    // console.log('titleTop', titleTop);
    // console.log('titleHeight', titleHeight);
    // console.log('landingHeadFixPoint', landingHeadFixPoint);
    // console.log('contactTop', contactTop);
    // console.log('downAnimReached', downAnimReached);
    // console.log('photosSectTop', photosSectTop);

    // Check if any changes in DOM occur as a result of these calculations
    landingScroll();
}


// Check for DOM updates on scroll
function landingScroll() {
    //calculates current vertical scroll position
    pagePos = window.pageYOffset;

    //fixes title header to proper position
    if (!landingTogglerClicked && (pagePos >= landingHeadFixPoint && !landingHeadFixed || pagePos < landingHeadFixPoint && landingHeadFixed)) {
        $landingHead.toggleClass('hide');
        $title.toggleClass('show-logo');
        landingHeadFixed = !landingHeadFixed;
    }
    //fades all but title with scroll
    if (pagePos < downAnimReached && !topTextShowing) topTextShowing = true;
    if (pagePos === 0) $landingContent.add($downAnim).css('opacity', 1);
    else if (pagePos >= downAnimReached && topTextShowing) $landingContent.add($downAnim).css('opacity', +(topTextShowing = false));
    else if (pagePos > 0 && pagePos < downAnimReached) $landingContent.add($downAnim).css('opacity', 1 - pagePos / downAnimReached);

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
