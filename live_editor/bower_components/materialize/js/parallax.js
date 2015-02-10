(function ($) {

    $.fn.parallax = function () {
      var window_width = $(window).width();
      // Parallax Scripts
      return this.each(function(i) {
        var $this = $(this);
        $this.addClass('parallax');

        function updateParallax(initial) {
           var container_height;
          if (window_width < 992) {
            container_height = ($this.height() > 0) ? $this.height() : $this.children("img").height();
          }
          else {
            container_height = ($this.height() > 0) ? $this.height() : 500;
          }
            var img_height = $this.children("img").height();
            var parallax_dist = img_height - container_height;
            var bottom = $this.offset().top + container_height;
            var top = $this.offset().top;
            var scrollTop = $(window).scrollTop();
            var windowHeight = window.innerHeight;
            var windowBottom = scrollTop + windowHeight;
            var percentScrolled = (windowBottom - top) / (container_height + windowHeight);
            var parallax = -1 * parallax_dist * percentScrolled;

            if ((bottom > scrollTop) && (top < (scrollTop + windowHeight))) {
              $this.children("img").first().css('bottom', parallax + "px");
            }
            if (initial) {
              $this.children("img").first().css('display', 'block');
            }
        }
        updateParallax(true);

        $(window).scroll(function() {
          window_width = $(window).width();
          updateParallax(false);
        });

        $(window).resize(function() {
          window_width = $(window).width();
          updateParallax(false);
        });

      });

    };
}( jQuery ));