(function ($) {  
	var defaults={
		position:"left",
		events:"click",
		trigger:".ui-icon-burger"
	}
	var SideNav = function (el,option) {
		this.element=$(el);
		this.option=$.extend(defaults,option);
		this._adjustHtml()._reBindEvent();
	}
	SideNav.prototype={
		 _adjustHtml: function(){
			var me=this,
			    data=this.option; 
			me.element.each(function(index,ele){
				var _side_menu=$(ele).find('.ui-side-menu');
				if(data.position=="left" || data.position==""){
					_side_menu.addClass('menu-left');
				}else if(data.position=="right"){
					_side_menu.addClass('menu-right');
				}
			});
			return me;
		},
		_reBindEvent:function(){
			var me=this,
			    data=this.option;
			me._IScroll_main();
			me.element.each(function(index,ele){
				var _trigger_btn=$(ele).find(data.trigger);
				_trigger_btn.on(data.events, function () {
					if (!$(this).hasClass('open')) {
						me._open();
						me._IScroll_menu();
					} else {
						me._close();
						$(ele).removeData("_IScroll_menu");
					}
				});
			});
		    return me;
		},
		_IScroll_menu:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				var wrapper=$(ele).find(".ui-side-menu");
				$(ele).data("_IScroll_menu",new IScroll("#"+wrapper.get(0).id,{
					probeType:1,
					bounceEasing:"circular",
					mouseWheel:true, 
					click:true
				}));
			});
			return me;
		},
		_IScroll_main:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				var wrapper=$(ele).find(".ui-side-main");
				$(ele).data("_IScroll_main",new IScroll("#"+wrapper.get(0).id,{
					probeType:1,			 //设置为1，提高滚动流畅度
					bounce:true,			 //"边界弹动  ",设置为false，提高滚动流畅度
					bounceEasing:"circular",
					bindToWrapper:true,
					scrollbars:false,		 //"显示滚动条",设置为false，提高滚动流畅度
					fadeScrollbars:false,	 //"滚动条渐隐",设置为false，提高滚动流畅度
					momentum:true,			 //"惯性滚动  ",设置为false，提高滚动流畅度
					mouseWheel:true, 
					click:true
				}));
			});
			return me;
		},
		_open:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				
				if(data.trigger==".ui-icon-burger"){
					var _trigger_btn=$(ele).find(data.trigger),
						_trigger_btn_x=_trigger_btn.find(".x"),
						_trigger_btn_y=_trigger_btn.find(".y"),
						_trigger_btn_z=_trigger_btn.find(".z");
					_trigger_btn.addClass('open');
					_trigger_btn_x.addClass('rotate45');
					_trigger_btn_y.hide();
					_trigger_btn_z.addClass('rotate135');
				}else{
					$(ele).find(data.trigger).addClass('open');
				}
				
				var _side_screen=$(ele).find('.ui-side-screen'),
				    _side_menu=$(ele).find('.ui-side-menu'),
					_side_mask=$(ele).find('.ui-side-mask');
				if(data.position=="left" || data.position==""){
					_side_screen.addClass('screen-right');
					_side_menu.addClass('menu-animate-left');
				}else if(data.position=="right"){
					_side_screen.addClass('screen-left');
					_side_menu.addClass('menu-animate-right');
				}
				if(_side_mask.length==0) _side_screen.append("<div class='ui-side-mask'></div>");
				
			});
			return me;
		},
		_close:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				
				if(data.trigger==".ui-icon-burger"){
					var _trigger_btn=$(ele).find(data.trigger),
						_trigger_btn_x=_trigger_btn.find(".x"),
						_trigger_btn_y=_trigger_btn.find(".y"),
						_trigger_btn_z=_trigger_btn.find(".z");
					_trigger_btn.removeClass('open');
					_trigger_btn_x.removeClass('rotate45');
					_trigger_btn_y.show();
					_trigger_btn_z.removeClass('rotate135');
				}else{
					$(ele).find(data.trigger).removeClass('open');
				}
				
				var _side_screen=$(ele).find('.ui-side-screen'),
				    _side_menu=$(ele).find('.ui-side-menu'),
					_side_mask=$(ele).find('.ui-side-mask');
				if(data.position=="left" || data.position==""){
					_side_screen.removeClass('screen-right');
					_side_menu.removeClass('menu-animate-left');
				}else if(data.position=="right"){
					_side_screen.removeClass('screen-left');
					_side_menu.removeClass('menu-animate-right');
				}
				if(_side_mask.length>0) _side_mask.remove();
				
			});
			return me;
		}
	}
	$.fn.sidenav=function(option){
		return new SideNav(this,option);
	}
})(jQuery); 