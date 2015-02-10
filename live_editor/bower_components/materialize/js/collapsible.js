(function ($) {
  $.fn.collapsible = function(options) {
    var defaults = {
        accordion: undefined
    };

    options = $.extend(defaults, options);


    return this.each(function() {

      var $this = $(this);

      var $panel_headers = $(this).find('.collapsible-header');

      var collapsible_type = $this.data("collapsible");

      // Turn off any existing event handlers
       $this.off();
       $this.children().off();


       /****************
       Helper Functions
       ****************/

      // Accordion Open
      function accordionOpen(object) {
        $panel_headers = $this.find('.collapsible-header');
        object.parent().toggleClass('active');
        if (object.parent().hasClass('active')){
          object.siblings('.collapsible-body').stop(true,false).slideDown({ duration: 350, easing: "easeOutQuart", queue: false});
        }
        else{
          object.siblings('.collapsible-body').stop(true,false).slideUp({ duration: 350, easing: "easeOutQuart", queue: false});
        }
        $panel_headers.not(object).parent().removeClass('active');
        $panel_headers.not(object).parent().children('.collapsible-body').stop(true,false).slideUp({ duration: 350, easing: "easeOutQuart", queue: false});
      }
      // Collapsible Open
      function collapsibleOpen(object) {
        object.parent().toggleClass('active');
        if (object.parent().hasClass('active')){
          object.siblings('.collapsible-body').stop(true,false).slideDown({ duration: 350, easing: "easeOutQuart", queue: false});
        }
        else{
          object.siblings('.collapsible-body').stop(true,false).slideUp({ duration: 350, easing: "easeOutQuart", queue: false});
        }
      }

      /*****  End Helper Functions  *****/



      if (options.accordion || collapsible_type == "accordion" || collapsible_type == undefined) { // Handle Accordion

        // Event delegation to open collapsible section
        $this.on('click', '.collapsible-header', function (e) {
          accordionOpen($(e.currentTarget));
        });

        // Open first active
        accordionOpen($panel_headers.filter('.active').first());
      }
      else { // Handle Expandables
        $panel_headers.each(function () {

          // Event delegation to open collapsible section
          $this.on('click', '.collapsible-header', function (e) {
            collapsibleOpen($(e.currentTarget));
          });

          // Open any bodies that have the active class
          if ($(this).hasClass('active')) {
            collapsibleOpen($(this));
          }

        });
      }

    });
  };

  $(document).ready(function(){
    $('.collapsible').collapsible();
  });
}( jQuery ));