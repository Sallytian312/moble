(function ( root, doc, factory ){
	if ( typeof define === "function" && define.amd ) {
		define( [ "jquery" ], function ( $ ) {
			factory( $, root, doc );
			return $.mobile;
		});
	} else {
		factory( root.jQuery, root, doc );
	}
}(this,document,function (jQuery,window,document,undefined ){
	(function( $, window, document, undefined ){
	var dataPropertyName = "virtualMouseBindings",
		touchTargetPropertyName = "virtualTouchID",
		virtualEventNames = "vmouseover vmousedown vmousemove vmouseup vclick vmouseout vmousecancel".split( " " ),
		touchEventProps = "clientX clientY pageX pageY screenX screenY".split( " " ),
		mouseHookProps = $.event.mouseHooks ? $.event.mouseHooks.props : [],
		mouseEventProps = $.event.props.concat( mouseHookProps ),
		activeDocHandlers = {},
		resetTimerID = 0,
		startX = 0,
		startY = 0,
		didScroll = false,
		clickBlockList = [],
		blockMouseTriggers = false,
		blockTouchTriggers = false,
		eventCaptureSupported = "addEventListener" in document,
		$document = $( document ),
		nextTouchID = 1,
		lastTouchID = 0, threshold,
		i;
	$.vmouse = {
		moveDistanceThreshold: 10,
		clickDistanceThreshold: 10,
		resetTimerDuration: 1500
	};
	function getNativeEvent( event ) {
		while ( event && typeof event.originalEvent !== "undefined" ) {
			event = event.originalEvent;
		}
		return event;
	}
	function createVirtualEvent( event, eventType ) {
		var t = event.type,
			oe, props, ne, prop, ct, touch, i, j, len;
		event = $.Event( event );
		event.type = eventType;
		oe = event.originalEvent;
		props = $.event.props;
		if ( t.search( /^(mouse|click)/ ) > -1 ) {
			props = mouseEventProps;
		}
		if ( oe ) {
			for ( i = props.length, prop; i; ) {
				prop = props[ --i ];
				event[ prop ] = oe[ prop ];
			}
		}
		if ( t.search(/mouse(down|up)|click/) > -1 && !event.which ) {
			event.which = 1;
		}
		if ( t.search(/^touch/) !== -1 ) {
			ne = getNativeEvent( oe );
			t = ne.touches;
			ct = ne.changedTouches;
			touch = ( t && t.length ) ? t[0] : ( ( ct && ct.length ) ? ct[ 0 ] : undefined );
			if ( touch ) {
				for ( j = 0, len = touchEventProps.length; j < len; j++) {
					prop = touchEventProps[ j ];
					event[ prop ] = touch[ prop ];
				}
			}
		}
		return event;
	}
	function getVirtualBindingFlags( element ) {
		var flags = {},
			b, k;
		while ( element ) {
			b = $.data( element, dataPropertyName );
			for (  k in b ) {
				if ( b[ k ] ) {
					flags[ k ] = flags.hasVirtualBinding = true;
				}
			}
			element = element.parentNode;
		}
		return flags;
	}
	function getClosestElementWithVirtualBinding( element, eventType ) {
		var b;
		while ( element ) {
	
			b = $.data( element, dataPropertyName );
	
			if ( b && ( !eventType || b[ eventType ] ) ) {
				return element;
			}
			element = element.parentNode;
		}
		return null;
	}
	function enableTouchBindings() {
		blockTouchTriggers = false;
	}
	function disableTouchBindings() {
		blockTouchTriggers = true;
	}
	function enableMouseBindings() {
		lastTouchID = 0;
		clickBlockList.length = 0;
		blockMouseTriggers = false;
		disableTouchBindings();
	}
	function disableMouseBindings() {
		enableTouchBindings();
	}
	function startResetTimer() {
		clearResetTimer();
		resetTimerID = setTimeout( function() {
			resetTimerID = 0;
			enableMouseBindings();
		}, $.vmouse.resetTimerDuration );
	}
	function clearResetTimer() {
		if ( resetTimerID ) {
			clearTimeout( resetTimerID );
			resetTimerID = 0;
		}
	}
	function triggerVirtualEvent( eventType, event, flags ) {
		var ve;
		if ( ( flags && flags[ eventType ] ) ||( !flags && getClosestElementWithVirtualBinding( event.target, eventType ) ) ){
			ve = createVirtualEvent( event, eventType );
			$( event.target).trigger( ve );
		}
		return ve;
	}
	function mouseEventCallback( event ) {
		var touchID = $.data( event.target, touchTargetPropertyName ),
			ve;
		if ( !blockMouseTriggers && ( !lastTouchID || lastTouchID !== touchID ) ) {
			ve = triggerVirtualEvent( "v" + event.type, event );
			if ( ve ) {
				if ( ve.isDefaultPrevented() ) {
					event.preventDefault();
				}
				if ( ve.isPropagationStopped() ) {
					event.stopPropagation();
				}
				if ( ve.isImmediatePropagationStopped() ) {
					event.stopImmediatePropagation();
				}
			}
		}
	}
	function handleTouchStart( event ) {
		var touches = getNativeEvent( event ).touches,
			target, flags, t;
		if ( touches && touches.length === 1 ) {
			target = event.target;
			flags = getVirtualBindingFlags( target );
			if ( flags.hasVirtualBinding ) {
				lastTouchID = nextTouchID++;
				$.data( target, touchTargetPropertyName, lastTouchID );
				clearResetTimer();
				disableMouseBindings();
				didScroll = false;
				t = getNativeEvent( event ).touches[ 0 ];
				startX = t.pageX;
				startY = t.pageY;
				triggerVirtualEvent( "vmouseover", event, flags );
				triggerVirtualEvent( "vmousedown", event, flags );
			}
		}
	}
	function handleScroll( event ) {
		if ( blockTouchTriggers ) {
			return;
		}
		if ( !didScroll ) {
			triggerVirtualEvent( "vmousecancel", event, getVirtualBindingFlags( event.target ) );
		}
		didScroll = true;
		startResetTimer();
	}
	function handleTouchMove( event ) {
		if ( blockTouchTriggers ) {
			return;
		}
		var t = getNativeEvent( event ).touches[ 0 ],
			didCancel = didScroll,
			moveThreshold = $.vmouse.moveDistanceThreshold,
			flags = getVirtualBindingFlags( event.target );
			didScroll = didScroll ||
				( Math.abs( t.pageX - startX ) > moveThreshold ||
					Math.abs( t.pageY - startY ) > moveThreshold );
		if ( didScroll && !didCancel ) {
			triggerVirtualEvent( "vmousecancel", event, flags );
		}
		triggerVirtualEvent( "vmousemove", event, flags );
		startResetTimer();
	}
	function handleTouchEnd( event ) {
		if ( blockTouchTriggers ) {
			return;
		}
		disableTouchBindings();
		var flags = getVirtualBindingFlags( event.target ),
			ve, t;
		triggerVirtualEvent( "vmouseup", event, flags );
		if ( !didScroll ) {
			ve = triggerVirtualEvent( "vclick", event, flags );
			if ( ve && ve.isDefaultPrevented() ) {
				t = getNativeEvent( event ).changedTouches[ 0 ];
				clickBlockList.push({
					touchID: lastTouchID,
					x: t.clientX,
					y: t.clientY
				});
				blockMouseTriggers = true;
			}
		}
		triggerVirtualEvent( "vmouseout", event, flags);
		didScroll = false;
		startResetTimer();
	}
	function hasVirtualBindings( ele ) {
		var bindings = $.data( ele, dataPropertyName ),
			k;
		if ( bindings ) {
			for ( k in bindings ) {
				if ( bindings[ k ] ) {
					return true;
				}
			}
		}
		return false;
	}
	function dummyMouseHandler() {}
	function getSpecialEventObject( eventType ) {
		var realType = eventType.substr( 1 );
		return {
			setup: function(/* data, namespace */) {
				if ( !hasVirtualBindings( this ) ) {
					$.data( this, dataPropertyName, {} );
				}
				var bindings = $.data( this, dataPropertyName );
				bindings[ eventType ] = true;
				activeDocHandlers[ eventType ] = ( activeDocHandlers[ eventType ] || 0 ) + 1;
				if ( activeDocHandlers[ eventType ] === 1 ) {
					$document.bind( realType, mouseEventCallback );
				}
				$( this ).bind( realType, dummyMouseHandler );
				if ( eventCaptureSupported ) {
					activeDocHandlers[ "touchstart" ] = ( activeDocHandlers[ "touchstart" ] || 0) + 1;
					if ( activeDocHandlers[ "touchstart" ] === 1 ) {
						$document.bind( "touchstart", handleTouchStart )
							.bind( "touchend", handleTouchEnd )
							.bind( "touchmove", handleTouchMove )
							.bind( "scroll", handleScroll );
					}
				}
			},
			teardown: function(/* data, namespace */) {
				--activeDocHandlers[ eventType ];
				if ( !activeDocHandlers[ eventType ] ) {
					$document.unbind( realType, mouseEventCallback );
				}
				if ( eventCaptureSupported ) {
					--activeDocHandlers[ "touchstart" ];
					if ( !activeDocHandlers[ "touchstart" ] ) {
						$document.unbind( "touchstart", handleTouchStart )
							.unbind( "touchmove", handleTouchMove )
							.unbind( "touchend", handleTouchEnd )
							.unbind( "scroll", handleScroll );
					}
				}
				var $this = $( this ),
					bindings = $.data( this, dataPropertyName );
				if ( bindings ) {
					bindings[ eventType ] = false;
				}
				$this.unbind( realType, dummyMouseHandler );
				if ( !hasVirtualBindings( this ) ) {
					$this.removeData( dataPropertyName );
				}
			}
		};
	}
	for ( i = 0; i < virtualEventNames.length; i++ ) {
		$.event.special[ virtualEventNames[ i ] ] = getSpecialEventObject( virtualEventNames[ i ] );
	}
	if ( eventCaptureSupported ) {
		document.addEventListener( "click", function( e ) {
			var cnt = clickBlockList.length,
				target = e.target,
				x, y, ele, i, o, touchID;
			if ( cnt ) {
				x = e.clientX;
				y = e.clientY;
				threshold = $.vmouse.clickDistanceThreshold;
				ele = target;
				while ( ele ) {
					for ( i = 0; i < cnt; i++ ) {
						o = clickBlockList[ i ];
						touchID = 0;
						if ( ( ele === target && Math.abs( o.x - x ) < threshold && Math.abs( o.y - y ) < threshold ) ||$.data( ele, touchTargetPropertyName ) === o.touchID ) {
							e.preventDefault();
							e.stopPropagation();
							return;
						}
					}
					ele = ele.parentNode;
				}
			}
		}, true);
	}
})( jQuery, window, document );

(function($){$.mobile = {};}( jQuery ));
(function( $, undefined ) {
	var support = {
		touch: "ontouchend" in document
	};
	$.mobile.support = $.mobile.support || {};
	$.extend( $.support, support );
	$.extend( $.mobile.support, support );
}( jQuery ));
(function( $, window, undefined ) {
	var $document = $( document ),
		supportTouch = $.mobile.support.touch,
		scrollEvent = "touchmove scroll",
		touchStartEvent = supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
	$.each( ( "touchstart touchmove touchend " +
		"tap taphold " +
		"swipe swipeleft swiperight " +
		"scrollstart scrollstop" ).split( " " ), function( i, name ) {
		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});
	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}
	$.event.special.scrollstart = {
		enabled: true,
		setup: function() {
			var thisObject = this,
				$this = $( thisObject ),
				scrolling,
				timer;
			function trigger( event, state ) {
				scrolling = state;
				triggerCustomEvent( thisObject, scrolling ? "scrollstart" : "scrollstop", event );
			}
			$this.bind( scrollEvent, function( event ) {
				if ( !$.event.special.scrollstart.enabled ) {
					return;
				}
				if ( !scrolling ) {
					trigger( event, true );
				}
				clearTimeout( timer );
				timer = setTimeout( function() {
					trigger( event, false );
				}, 50 );
			});
		},
		teardown: function() {
			$( this ).unbind( scrollEvent );
		}
	};
	$.event.special.tap = {
		tapholdThreshold: 750,
		emitTapOnTaphold: true,
		setup: function() {
			var thisObject = this,
				$this = $( thisObject ),
				isTaphold = false;
			$this.bind( "vmousedown", function( event ) {
				isTaphold = false;
				if ( event.which && event.which !== 1 ) {
					return false;
				}
				var origTarget = event.target,
					timer;
				function clearTapTimer() {
					clearTimeout( timer );
				}
				function clearTapHandlers() {
					clearTapTimer();
					$this.unbind( "vclick", clickHandler )
						.unbind( "vmouseup", clearTapTimer );
					$document.unbind( "vmousecancel", clearTapHandlers );
				}
				function clickHandler( event ) {
					clearTapHandlers();
					if ( !isTaphold && origTarget === event.target ) {
						triggerCustomEvent( thisObject, "tap", event );
					} else if ( isTaphold ) {
						event.preventDefault();
					}
				}
				$this.bind( "vmouseup", clearTapTimer )
					.bind( "vclick", clickHandler );
				$document.bind( "vmousecancel", clearTapHandlers );
				timer = setTimeout( function() {
					if ( !$.event.special.tap.emitTapOnTaphold ) {
						isTaphold = true;
					}
					triggerCustomEvent( thisObject, "taphold", $.Event( "taphold", { target: origTarget } ) );
				}, $.event.special.tap.tapholdThreshold );
			});
		},
		teardown: function() {
			$( this ).unbind( "vmousedown" ).unbind( "vclick" ).unbind( "vmouseup" );
			$document.unbind( "vmousecancel" );
		}
	};
	$.event.special.swipe = {
		scrollSupressionThreshold: 30,
		durationThreshold: 1000,
		horizontalDistanceThreshold: 30,
		verticalDistanceThreshold: 30,
		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;
			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}
			return {
				x: x,
				y: y
			};
		},
		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},
		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},
		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},
		eventInProgress: false,
		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;
			context.start = function( event ) {
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;
				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;
				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}
					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {
							$.event.special.swipe.eventInProgress = false;
						}
					}
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};
				context.stop = function() {
						emitted = true;
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};
				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},
		teardown: function() {
			var events, context;
			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}
			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		scrollstop: "scrollstart",
		taphold: "tap",
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {
		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );

}));
