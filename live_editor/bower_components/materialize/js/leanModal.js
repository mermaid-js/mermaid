(function($) {
  $.fn.extend({
    openModal: function(options) {
      var modal = this;
      var overlay = $('<div id="lean-overlay"></div>');
      $("body").append(overlay);

      var defaults = {
        opacity: 0.5,
        in_duration: 300,
        out_duration: 200,
        ready: undefined,
        complete: undefined,
        dismissible: true
      }

      // Override defaults
      options = $.extend(defaults, options);

      if (options.dismissible) {
        $("#lean-overlay").click(function() {
          $(modal).closeModal(options);
        });
        // Return on ESC
        $(document).keyup(function(e) {
          if (e.keyCode === 27) {   // ESC key
            $(modal).closeModal(options);
            $(this).off();
          }
        });
      }

      $(modal).find(".modal-close").click(function(e) {
        e.preventDefault();
        $(modal).closeModal(options);
      });

      $("#lean-overlay").css({ display : "block", opacity : 0 });

      $(modal).css({
        display : "block",
        top: "4%",
        opacity: 0
      });

      $("#lean-overlay").velocity({opacity: options.opacity}, {duration: options.in_duration, queue: false, ease: "easeOutCubic"});

      $(modal).velocity({top: "10%", opacity: 1}, {
        duration: options.in_duration,
        queue: false,
        ease: "easeOutCubic",
        // Handle modal ready callback
        complete: function() {
          if (typeof(options.ready) === "function") {
            options.ready();
          }
        }
      });
    }
  });

  $.fn.extend({
    closeModal: function(options) {
      var defaults = {
        out_duration: 200,
        complete: undefined
      }
      var options = $.extend(defaults, options);

      $("#lean-overlay").velocity( { opacity: 0}, {duration: options.out_duration, queue: false, ease: "easeOutQuart"});
      $(this).fadeOut(options.out_duration, function() {
        $(this).css({ top: 0});
        $("#lean-overlay").css({display:"none"});

        // Call complete callback
        if (typeof(options.complete) === "function") {
          options.complete();
        }
        $('#lean-overlay').remove();
      });
    }
  })

  $.fn.extend({
    leanModal: function(options) {
      return this.each(function() {
        // Close Handlers
        $(this).click(function(e) {
          var modal_id = $(this).attr("href");
          $(modal_id).openModal(options);
          e.preventDefault();
        }); // done set on click
      }); // done return
    }
  });
})(jQuery);
