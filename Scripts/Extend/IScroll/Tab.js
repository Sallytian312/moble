/* 
 * 选项卡插件
 * V1.1
 */
(function ($) {  
	var defaults={
		autoHeight:true,
		autoPlay:true,
		interval:3000,
		scrollEnd:null
	}
	var Tab = function (el,option) {
		this.element=$(el);
		this.option=$.extend(defaults,option);
		this._adjustHtml()._reBindEvent();
	}
	Tab.prototype={
		/*
		 *调整HTML：
		 *①循环所有选中的Tab：
		 *  a.为滑动包裹层（".ui-tab"）动态添加id；
		 *  b.分别设置滑动层（".ui-tab-content"）的宽度；
		 */
		 _adjustHtml: function(){
			var me=this,
			    data=this.option; 
			me.element.each(function(i,ele){
				var $tabWrapper = $(ele).find('.ui-tab-content-wrapper')
					$tabScroller = $(ele).find('.ui-tab-content'),
					$tabScrollerList=$tabScroller.find("li");
				$tabScroller.width($tabScrollerList.length+"00%");
				$tabWrapper.attr("id","ui-tab-content-wrapper"+($(ele).index()+1));
			});
			return me;
		},
		/*
		 *绑定事件：
		 *①初始化IScroll函数
		 *②初始化Tab指示器
		 *③初始化自动适应高度
		 *④初始化自动播放
		 *⑤初始化回调函数
		 */
		_reBindEvent:function(){
			var me=this,
			    data=this.option; 
			me._loadIscroll();
			me._switch();
			me._autoHeight();
			me._autoPlay();
			me._callback();
		    return me;
		},
		/*
		 *初始化IScroll：
		 *①循环所有选中的Tab：
		 *  a.对所有选中的Tab分别实例化，并分别缓存到当前滑动包裹层(".ui-tab")上；
		 */
		_loadIscroll:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				var wrapper=$(ele).find(".ui-tab-content-wrapper");
				$(ele).data("iScroll",new IScroll("#"+wrapper.get(0).id,{
					probeType:3,
					snap: "li",
					momentum: false, 
					disableMouse: false,  
					disablePointer: false,  
					scrollX: true,  
					scrollY: false
				}));
			});
			return me;
		},
		/*
		 *选项卡切换：
		 *①循环所有选中的Tab：
		 *  a.滑动时切换；
		 *  b.点击时切换；
		 *  c.默认点切换；
		 */
		_switch:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				var $tabNavList=$(ele).find('.ui-tab-nav').find("li"),
					$tabScrollerList=$(ele).find('.ui-tab-content').find("li");
				//滑动时切换
				$(ele).data("iScroll").on("scroll",function(){
					var _current_page=Math.abs(this.currentPage.x/$(ele).width());
					$tabNavList.eq(Math.floor(_current_page)).addClass("current").siblings("li").removeClass("current");
					$tabScrollerList.eq(Math.floor(_current_page)).addClass("current").siblings("li").removeClass("current");
				});
				//点击时切换
				$tabNavList.tap(function(){
					var i=$(this).index();
					$(this).addClass("current").siblings("li").removeClass("current");	
					$(ele).data("iScroll").goToPage(i, 0, 300);
				});
				//默认点切换
				$tabNavList.each(function(i,e){
					if($(e).hasClass("current")){
						$tabScrollerList.eq(i).addClass("current").siblings("li").removeClass("current");
						$(ele).data("iScroll").goToPage(i, 0, 0);
					}
				});
			});
		},
		/*
		 *自动适应高度：
		 *①循环所有选中的Tab：
		 *  a.设置默认点的高度，当前auto，其他为0；
		 *  b.设置滑动时的高度，当前auto，其他为0；
		 */
		_autoHeight:function(){
			var me = this,
                data = this.option;
			if (data.autoHeight) {
				me.element.each(function(index,ele){
					var $tabScrollerList=$(ele).find('.ui-tab-content').find("li");
					$tabScrollerList.each(function(i,e){
						if($(e).hasClass("current")){
							$(e).height('auto');
							$(e).siblings("li").height(0);
						}
					});
					$(ele).data("iScroll").on("scroll",function(){
						var _current_page=Math.abs(this.currentPage.x/$(ele).width());
						$tabScrollerList.eq(Math.floor(_current_page)).height('auto');
						$tabScrollerList.eq(Math.floor(_current_page)).siblings("li").height(0);
					});
				});
			}
		},
		/*
		 *是否自动播放：
		 *①定义一个定时器，每隔一段时间运行一次startScroll函数：
		 *②startScroll函数中，循环所有选中的Tab：
		 *  a.得到滑动停留的当前页；
		 *  b.当滚动到最后一张，回到第一张,否则滚到下一页；
		 */
		_autoPlay:function(){
			var me = this,
                data = this.option;
			if (data.autoPlay) {
				var timer = setInterval(startScroll, data.interval); 
				function startScroll() { 
					me.element.each(function(index,ele){
						var $sliderScroller = $(ele).find('.ui-tab-content'),
							$sliderList = $sliderScroller.find("li"),
							currentPage = Math.abs($(ele).data("iScroll").currentPage.x/$(ele).width());
						if (currentPage == $sliderList.length-1){
							$(ele).data("iScroll").goToPage(0, 0, 300);  //当滚动到最后一张，回到第一张  
						} else {  
							$(ele).data("iScroll").next();               //滚到下一页  
						}
					});
				}  
			}
			return me;
		},
		/*
		 *回调函数：
		 *①循环所有选中的Tab：
		 *  a.滑动结束后冒充执行回调函数；
		 *  b.为回调函数传参，第一个参数将this指向当前Tab对象，第二个参数为当前页码；
		 */
		_callback:function(){
			var me = this,
                data = this.option;
			if(data.scrollEnd!=null){
				me.element.each(function(index,ele){
					$(ele).data("iScroll").on("scrollEnd",function(){
						var _current_page=Math.abs(this.currentPage.x/$(ele).width());
						data.scrollEnd.call($(ele),Math.floor(_current_page)+1);
					});	
				});	
			}
			return me;
		}
	}
	$.fn.tab=function(option){
		return new Tab(this,option);
	}
})(jQuery);  
