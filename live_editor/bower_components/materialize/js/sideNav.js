(function ($) {
    // left: 37, up: 38, right: 39, down: 40,
    // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    // var keys = [32, 33, 34, 35, 36, 37, 38, 39, 40];

    // function preventDefault(e) {
    //   e = e || window.event;
    //   if (e.preventDefault)
    //     e.preventDefault();
    //   e.returnValue = false;
    // }

    // function keydown(e) {
    //   for (var i = keys.length; i--;) {
    //     if (e.keyCode === keys[i]) {
    //       preventDefault(e);
    //       return;
    //     }
    //   }
    // }

    // function wheel(e) {
    //   preventDefault(e);
    // }

    // function disable_scroll() {
    //   if (window.addEventListener) {
    //     window.addEventListener('DOMMouseScroll', wheel, false);
    //   }
    //   window.onmousewheel = document.onmousewheel = wheel;
    //   document.onkeydown = keydown;
    //   $('body').css({'overflow-y' : 'hidden'});
    // }

    // function enable_scroll() {
    //   if (window.removeEventListener) {
    //     window.removeEventListener('DOMMouseScroll', wheel, false);
    //   }
    //   window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    //   $('body').css({'overflow-y' : ''});

    // }

  var methods = {
    init : function(options) {
      var defaults = {
        activationWidth: 70,
        edge: 'left'
      }
      options = $.extend(defaults, options);

      $(this).each(function(){
        var $this = $(this);
        var menu_id = $("#"+ $this.attr('data-activates'));
        var menuWidth = 240;

        // Add alignment
        if (options.edge != 'left') {
          menu_id.addClass('right-aligned');
        }

        // Add Touch Area
        $('body').append($('<div class="drag-target"></div>'));
        if (options.edge === 'left') {
          $('.drag-target').css({'left': 0})
        }
        else {
          $('.drag-target').css({'right': 0})
        }

        // Window resize to reset on large screens fixed
        if (menu_id.hasClass('fixed')) {
          $(window).resize( function() {
            if ($(window).width() > 1200) {
              if (menu_id.attr('style')) {
                menu_id.removeAttr('style');
              }
            }
            if ($('#sidenav-overlay').css('opacity') != 0 && menuOut) {
              $('#sidenav-overlay').trigger('click');
            }
          });
        }

        function removeMenu() {
          panning = false;
          menuOut = false;
          $('#sidenav-overlay').velocity({opacity: 0}, {duration: 200, queue: false, easing: 'easeOutQuad',
            complete: function() {
              $(this).remove();
            } });
          if (options.edge === 'left') {
            // Reset phantom div
            $('.drag-target').css({width: '', right: '', left: '0'});
            menu_id.velocity({left: -1 * (menuWidth + 10)}, {duration: 200, queue: false, easing: 'easeOutCubic'});
          }
          else {
            // Reset phantom div
            $('.drag-target').css({width: '', right: '0', left: ''});
            menu_id.velocity({right: -1 * (menuWidth + 10)}, {duration: 200, queue: false, easing: 'easeOutCubic'});
          }

          // enable_scroll();
        }



        // Touch Event
        var panning = false;
        var menuOut = false;

        $('.drag-target').hammer({
          prevent_default: false
        }).bind('tap', function(e) {
          // capture overlay click on drag target
          // if (menuOut && !panning) {
            $('#sidenav-overlay').trigger('click');
          // }
        }).bind('pan', function(e) {

          if (e.gesture.pointerType === "touch") {

            var direction = e.gesture.direction;
            var x = e.gesture.center.x;
            var y = e.gesture.center.y;
            var velocityX = e.gesture.velocityX;

            if (!$('#sidenav-overlay').length) {
              var overlay = $('<div id="sidenav-overlay"></div>');
              overlay.css('opacity', 0).click(function(){ removeMenu(); });
              $('body').append(overlay);
            }

            // Keep within boundaries
            if (options.edge === 'left') {
              if (x > menuWidth) { x = menuWidth; }
              else if (x < 0) { x = 0; }
            }
            else {
              if (x < $(window).width() - menuWidth) { x = $(window).width() - menuWidth; }
            }

            if (options.edge === 'left') {
              // Left Direction
              if (x < (menuWidth / 2)) { menuOut = false; }
              // Right Direction
              else if (x >= (menuWidth / 2)) { menuOut = true; }
            }
            else {
              // Left Direction
              if (x < ($(window).width() - menuWidth / 2)) { menuOut = true; }
              // Right Direction
              else if (x >= ($(window).width() - menuWidth / 2)) { menuOut = false; }
            }


            if (options.edge === 'left') {
              menu_id.css('left', (x - menuWidth));
            }
            else {
              menu_id.css('right', -1 *(x - menuWidth / 2));
            }

            // Percentage overlay
            if (options.edge === 'left') {
              var overlayPerc = x / menuWidth;
              $('#sidenav-overlay').velocity({opacity: overlayPerc }, {duration: 50, queue: false, easing: 'easeOutQuad'});
            }
            else {
              var overlayPerc = Math.abs((x - $(window).width()) / menuWidth);
              $('#sidenav-overlay').velocity({opacity: overlayPerc }, {duration: 50, queue: false, easing: 'easeOutQuad'});
            }
          }
        }).bind('panend', function(e) {
          if (e.gesture.pointerType === "touch") {
            var velocityX = e.gesture.velocityX;
            panning = false;

            if (options.edge === 'left') {
              if (menuOut || velocityX < -0.5) {
                menu_id.velocity({left: 0}, {duration: 300, queue: false, easing: 'easeOutQuad'});
                $('#sidenav-overlay').velocity({opacity: 1 }, {duration: 50, queue: false, easing: 'easeOutQuad'});
                $('.drag-target').css({width: '50%', right: 0, left: ''});
              }
              else if (!menuOut || velocityX > 0.3) {
                menu_id.velocity({left: -240}, {duration: 300, queue: false, easing: 'easeOutQuad'});
                $('#sidenav-overlay').velocity({opacity: 0 }, {duration: 50, queue: false, easing: 'easeOutQuad',
                  complete: function () {
                    $(this).remove();
                  }});
                $('.drag-target').css({width: '10%', right: '', left: 0});
              }
            }
            else {
              if (menuOut || velocityX > 0.5) {
                menu_id.velocity({right: 0}, {duration: 300, queue: false, easing: 'easeOutQuad'});
                $('#sidenav-overlay').velocity({opacity: 1 }, {duration: 50, queue: false, easing: 'easeOutQuad'});
                $('.drag-target').css({width: '50%', right: '', left: 0});
              }
              else if (!menuOut || velocityX < -0.3) {
                menu_id.velocity({right: -240}, {duration: 300, queue: false, easing: 'easeOutQuad'});
                $('#sidenav-overlay').velocity({opacity: 0 }, {duration: 50, queue: false, easing: 'easeOutQuad',
                  complete: function () {
                    $(this).remove();
                  }});
                $('.drag-target').css({width: '10%', right: 0, left: ''});
              }
            }


          }
        });

          $this.click(function() {
            if (menu_id.hasClass('active')) {
              menuOut = false;
              panning = false;
              removeMenu();
            }
            else {
              // disable_scroll();

              if (options.edge === 'left') {
                $('.drag-target').css({width: '50%', right: 0, left: ''});
                menu_id.velocity({left: 0}, {duration: 300, queue: false, easing: 'easeOutQuad'});
              }
              else {
                $('.drag-target').css({width: '50%', right: '', left: 0});
                menu_id.velocity({right: 0}, {duration: 300, queue: false, easing: 'easeOutQuad'});
              }

              var overlay = $('<div id="sidenav-overlay"></div>');
              overlay.css('opacity', 0)
              .click(function(){
                menuOut = false;
                panning = false;
                removeMenu();
                overlay.animate({opacity: 0}, {duration: 300, queue: false, easing: 'easeOutQuad',
                  complete: function() {
                    $(this).remove();
                  } });

              });
              $('body').append(overlay);
              overlay.animate({opacity: 1}, {duration: 300, queue: false, easing: 'easeOutQuad',
                complete: function () {
                  menuOut = true;
                  panning = false;
                }
              });
            }

            return false;
          });
      });


    },
    show : function() {
      this.trigger('click');
    },
    hide : function() {
      $('#sidenav-overlay').trigger('click');
    }
  };


    $.fn.sideNav = function(methodOrOptions) {
      if ( methods[methodOrOptions] ) {
        return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
        // Default to "init"
        return methods.init.apply( this, arguments );
      } else {
        $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.tooltip' );
      }
    }; // PLugin end
}( jQuery ));