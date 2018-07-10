/* 
 * 焦点图轮播插件
 * V1.1
 */
(function ($) {  
	var defaults={
		indicator:true,
		indicatorPos:"right",
		autoPlay:true,
		interval:3000,
		scrollEnd:null
	}
	var Slider = function (el,option) {
		this.element=$(el);
		this.option=$.extend(defaults,option);
		this._adjustHtml()._reBindEvent();
	}
	Slider.prototype={
		/*
		 *调整HTML：
		 *①循环所有选中的轮播：
		 *  a.为滑动包裹层（".ui-slider"）动态添加id；
		 *  b.分别设置滑动层ui-slider-content的宽度；
		 */
		 _adjustHtml: function(){
			var me=this,
			    data=this.option; 
			me.element.each(function(i,ele){
				var $sliderScroller = $(ele).find('.ui-slider-content'),
					$sliderList = $sliderScroller.find("li");
				$(ele).attr("id","ui-slider-wrapper"+($(ele).index()+1));
				$sliderScroller.width($sliderList.length+"00%");
			});
			return me;
		},
		/*
		 *绑定事件：
		 *①初始化IScroll函数
		 *②初始化圆点指示器函数
		 *③初始化自动播放函数
		 *④初始化回调函数
		 */
		_reBindEvent:function(){
			var me=this, 
			    data=this.option; 
			me._loadIscroll();
			me._showIndicator();
			me._autoPlay();
			me._callback();
		    return me;
		},
		/*
		 *初始化IScroll：
		 *①循环所有选中的轮播：
		 *  a.对所有选中的轮播分别实例化，并分别缓存到当前滑动包裹层(".ui-slider")上；
		 */
		_loadIscroll:function(){
			var me = this,
                data = this.option;
			me.element.each(function(index,ele){
				$(ele).data("iScroll",new IScroll("#"+$(ele).get(0).id,{
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
		 *是否显示圆点指示器：
		 *①循环所有选中的轮播：
		 *  a.为每个轮播创建指示器HTML DOM；
		 *  b.根据传参设置指示器位置；
		 *  c.滑动时切换指示器位置；
		 */
		_showIndicator:function(){
			var me = this,
                data = this.option;
			if (data.indicator) {
				me.element.each(function(index,ele){
					var $sliderScroller = $(ele).find('.ui-slider-content'),
						$sliderList = $sliderScroller.find("li");

					var temp = '<ul class="ui-slider-indicators">';
					for (var j=1; j<=$sliderList.length; j++) {
						if (j===1) {
							temp += '<li class="current">'+j+'</li>';
						}
						else {
							temp += '<li>'+j+'</li>';
						}
					}
					temp += '</ul>';
					$(ele).append(temp);
					
					var indicators=$(ele).find(".ui-slider-indicators");
					var indicatorsList=indicators.find("li");
					switch(data.indicatorPos){
						case "left":
							indicators.addClass("ui-slider-indicators-start");
						break;
						case "center":
							indicators.addClass("ui-slider-indicators-center");
						break;
						case "right":
							indicators.addClass("ui-slider-indicators-end");
						break;
					}
					$(ele).data("iScroll").on("scroll",function(){
						var _current_page=Math.abs(this.currentPage.x/$(ele).width());
						indicatorsList.eq(Math.floor(_current_page)).addClass("current").siblings("li").removeClass("current"); 
					});
				});
			}
			return me;
		},
		/*
		 *是否自动播放：
		 *①定义一个定时器，每隔一段时间运行一次startScroll函数：
		 *②startScroll函数中，循环所有选中的轮播：
		 *  a.得到滑动停留的当前页；
		 *  b.当滚动到最后一张，回到第一张,否则滚到下一页；
		 */
		_autoPlay:function(){
			var me = this,
                data = this.option;
		  	if (data.autoPlay) {
				timer = setInterval(startScroll, data.interval); 
				function startScroll(){
					me.element.each(function(index,ele){
						var $sliderScroller = $(ele).find('.ui-slider-content'),
							$sliderList = $sliderScroller.find("li"),
							currentPage = Math.abs($(ele).data("iScroll").currentPage.x/$(ele).width());
						if (Math.floor(currentPage) == $sliderList.length-1){
							$sliderList.eq(0).addClass("current").siblings("li").removeClass("current");
							$(ele).data("iScroll").goToPage(0, 0, 300);        //当滚动到最后一张，回到第一张 
						} else { 
							$sliderList.eq(Math.ceil(currentPage)+1).addClass("current").siblings("li").removeClass("current");
							$(ele).data("iScroll").next();                     //滚到下一页  
						}
					});
				}
			}
			return me;
		},
		/*
		 *回调函数：
		 *①循环所有选中的轮播：
		 *  a.滑动结束后冒充执行回调函数；
		 *  b.为回调函数传参，第一个参数将this指向当前轮播对象，第二个参数为当前页码；
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
				})
			}
			return me;
		}
	}
	$.fn.slider=function(option){
		return new Slider(this,option);
	}
})(jQuery);  
