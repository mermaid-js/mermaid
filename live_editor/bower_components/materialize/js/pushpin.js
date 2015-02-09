(function ($) {
  $(document).ready(function() {

    // Unique ID
    var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
      };
    })();

    $.fn.pushpin = function (options) {

      var defaults = {
        top: 0,
        bottom: Infinity,
        offset: 0
      }
      options = $.extend(defaults, options);

      $index = 0;
      return this.each(function() {
        var $uniqueId = guid(),
            $this = $(this),
            $original_offset = $(this).offset().top;
        // console.log(options.top, options.bottom, $(this).offset().top);

        function removePinClasses(object) {
          object.removeClass('pin-top');
          object.removeClass('pinned');
          object.removeClass('pin-bottom');
        }

        function updateElements(objects, scrolled) {
          // console.log("OBJECTS", objects);
          objects.each(function () {
            // Add position fixed (because its between top and bottom)
            if (options.top <= scrolled && options.bottom >= scrolled && !$(this).hasClass('pinned')) {
              removePinClasses($(this));
              $(this).css('top', options.offset);
              $(this).addClass('pinned');
              // console.log("Pinned!", $(this));
            }

            // Add pin-top (when scrolled position is above top)
            if (scrolled < options.top && !$(this).hasClass('pin-top')) {
              removePinClasses($(this));
              $(this).css('top', 0);
              $(this).addClass('pin-top');
              // console.log("Pin Top!", $(this));
            }

            // Add pin-bottom (when scrolled position is below bottom)
            if (scrolled > options.bottom && !$(this).hasClass('pin-bottom')) {
              removePinClasses($(this));
              $(this).addClass('pin-bottom');
              $(this).css('top', options.bottom - $original_offset);
              // console.log("Pin Bottom!", $(this));
            }
          });
        }


        
        updateElements($this, $(window).scrollTop());
        $(window).on('scroll.' + $uniqueId, function () {
          var $scrolled = $(window).scrollTop() + options.offset;
          // console.log($(window).scrollTop(), $scrolled);
          updateElements($this, $scrolled);
        });

      }); 



    };

  
  

  });
}( jQuery ));