// Create static jQuery selector vars
var $window = $(window),
    $purchaseToggle = $('.purchase-toggle'),
    $coffeeInd = $('.coffee-ind'),
    $buyBtn = $('.buy-btn'),
    $coffeePrice = $('.coffee-price'),
    $merchIndBack = $('.merch-ind .back'),
    $size = $merchIndBack.children('.size'),
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
    $backToTop = $('.back-to-top'),
    $paperResumeWrapper = $('.paper-resume-wrapper');

var floatFoldImgRegex = /background-image: url\(\)/g;

// Getting back end data
var coffee = [],
    merch = [],
    contact = {};

$.get('/api/info', function(data) {
    coffee = data.coffee.product;
    merch = data.merch;
    contact = data.contact;
});

// UI Functionality
var landingTogglerClicked = false;

var main = function() {
    //// Setting up scrollTo animation
    $scrollTo.click(function(){
      $($(this).data("scrollTo")).ScrollTo({
        duration: 1000,
        offsetTop: titleHeight - 16
      });
    });

    if($window.width() > 550) {
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

    // set initial contact sub width
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

    // Add scroll and resize listeners
    listeners();
};

// Store trigger points for state changes
var titleTop,
    titleHeight,
    landingHeadFixPoint,
    contactTop,
    downAnimReached;

// State booleans
var pagePos = 0,
    titleFixed = false,
    landingHeadFixed = false,
    topTextShowing = true,
    contactPopped = false;

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
    landingHeadFixPoint = titleTop - Math.ceil($landingHead.position().top);
    contactTop = Math.ceil($contact.offset().top) * 0.92;
    downAnimReached = titleTop * 0.395 + 4.5; //when page position is such that the centered landing header is right above the down arrow;

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

    //make contact pop
    if (pagePos >= contactTop && !contactPopped || pagePos < contactTop && contactPopped) {
        $contact.toggleClass('poppin');
        contactPopped = !contactPopped;
    }
}

$(document).ready(main);
