/* 
 * 焦点图轮播插件
 * V1.1
 */
(function ($) {
	var defaults={
		defTab:"none",
		isScrollToNext:true,
		isShowShadow:true
	}
	var Nav = function (el,option) {
		this.element=$(el);
		this.option=$.extend(defaults,option);
		this._adjustHtml()._reBindEvent();
	}
	Nav.prototype={
		/*
		 *绑定事件：
		 *①初始化IScroll函数
		 *②初始化滚到下一条函数
		 *③初始化滑到边界显示阴影函数
		 */
		_reBindEvent: function () {
			var me = this,
				data = this.option;
			me._loadIscroll();
			me._scrollToNext();
			$(window).resize(function(){ me._scrollToNext(); });
			me._setShadow();
			return me;
		},
		/*
		 *调整HTML：
		 *①缓存全部或者单个的导航的DOM
		 *②循环所有选中的导航：
		 *  a.找到滑动包裹层（".ui-navigator-wrapper"）为其添加id；
		 *  b.创建数组，分别追加所有导航下li的累加宽度，并缓存到滑动包裹层（".ui-navigator-wrapper"）上；
		 *  c.读取缓存，设置滑动层ul(".ui-navigator-list")的宽度；
		 *  e.如果设置了defTab参数，初始化on的位置；
		 *③点击的时候设置on的位置；
		 */
		_adjustHtml: function () {
			var me = this,
				data = this.option,
				$navList = me.element.find('li'),
				scrollerSumWidth = [0];
			me.element.each(function(i,ele){
				var wrapper=$(ele).find('.ui-navigator-wrapper'),
					scroller=$(ele).find('ul');
					wrapper.attr("id","ui-navigator-wrapper"+($(ele).index()+1));
					wrapper.find('li').each(function(index){
						if(index==0)  scrollerSumWidth[0]=0;//这里要重置一下，否则从第二个导航开始，初始化位置会偏移，右侧出现空白
						scrollerSumWidth[index] = index ? (scrollerSumWidth[index -1] + this.offsetWidth) :(scrollerSumWidth[index] + this.offsetLeft - scroller[0].offsetLeft + this.offsetWidth);
						$(this).hasClass('on') && (data.defTab = index);
					});
					wrapper.data("data-width",scrollerSumWidth);
				var listWidth=wrapper.data("data-width")[wrapper.find("li").length - 1];
					scroller.width(listWidth);
					if(data.defTab == "none") return;
					scroller.find("li").eq(data.defTab).addClass('on');
			});
			$navList.tap(function(){
				$(this)	.addClass('on').siblings("li").removeClass("on");
				var _href=$(this).attr('data-href');
				if(_href!=undefined){
					location.href=_href;
				}
			});
			return me;
		},
		/*
		 *初始化IScroll：
		 *①循环所有选中的导航：
		 *  a.对所有选中导航分别实例化，并分别缓存到当前滑动包裹层(".ui-navigator-wrapper")上；
		 *  b.如果defTab默认位置超过可视区，自动滚动到默认位置；
		 */
		_loadIscroll:function () {
			var me = this,
				data = this.option;
			me.element.each(function(index,ele){
				var wrapper=$(ele).find(".ui-navigator-wrapper");
				wrapper.data("iScroll",new IScroll("#"+wrapper.get(0).id, {
					probeType:3,
					click:true,
					scrollX: true, 
					scrollY: false,
					scrollbars:false,
				}));
				//滚动到默认位置
				var wrapperWidth=wrapper.width();
				var widthArray=wrapper.data("data-width");
				if(widthArray[data.defTab]>wrapperWidth){
					var pos=wrapperWidth - (widthArray[data.defTab] || widthArray[widthArray.length-1]);
					wrapper.data("iScroll").scrollTo(pos,0,0);
				}
			});
			return me;
		},
		/*
		 *获取点击的位置，在_scrollToNext方法里调用：
		 *①返回first、middle、last三个位置；
		 *②参数wrapper：代表当前点击的滑动包裹层（".ui-navigator-wrapper"），主要用来调用其缓存的iScroll和data-width；
		 *③参数liIndex：代表当前点击的li的索引，主要用来在缓存的data-width数组中取值；
		 */
		_getPos:function (wrapper,liIndex) {
			var me = this,
				data = me.option;
			var movedXDis = Math.abs(wrapper.data("iScroll").x) || 0;
			var widthArray = wrapper.data("data-width");
			var $navList = wrapper.find("li");
			var thisOffsetDis = widthArray[liIndex] - movedXDis;
			var preOffsetDis = widthArray[(liIndex - 1) || 0]  - movedXDis;
			var nextOffsetDis = (widthArray[liIndex + 1] || widthArray[widthArray.length - 1]) - movedXDis;
			var wrapperWidth = wrapper.width();
			return (thisOffsetDis >= wrapperWidth || nextOffsetDis > wrapperWidth) ? 'last' : 	
					(thisOffsetDis <= $navList[liIndex].offsetWidth || preOffsetDis < $navList[liIndex - 1].offsetWidth) ?'first' : 'middle';
		},
		/*
		 *点击边界的li，自动左或右滑动一个位置：
		 *①用户选项isScrollToNext为假时，退出函数；
		 *②li被点击时：
		 *  a.获取当前点击li的滑动包裹层（".ui-navigator-wrapper"）、宽度数组和当前（li本身的索引）；
		 *  b.调用._getPos方法判断点击的li的位置，根据返回值让对应IScroll对象左移或右移；
		 */
		_scrollToNext:function(){
			var me = this,
				data = me.option;
			if(!data.isScrollToNext) return;
			me.element.find("li").tap(function(){
				var wrapper=$(this).parents(".ui-navigator-wrapper");
				var wrapperWidth=wrapper.width();
				var widthArray=wrapper.data("data-width");
				var iScroll=wrapper.data("iScroll");
				var liIndex=$(this).index();
				if(me._getPos(wrapper,liIndex)=="last"){
					var pos=wrapperWidth - (widthArray[liIndex + 1] || widthArray[widthArray.length - 1]);
					iScroll.scrollTo(pos,0,400);
				}else if(me._getPos(wrapper,liIndex)=="first"){
					var pos=-widthArray[liIndex - 2] || 0;
					iScroll.scrollTo(pos,0,400);
				}
				return false;
			});
		},
		/*
		 *滑动到左右边界，显示阴影：
		 *①用户选项isShowShadow为假时，退出函数；
		 *②循环所有选中的导航：
		 *  a.为当前导航滑动包裹层（".ui-navigator-wrapper"）上缓存的iScroll对象绑定scroll事件；
		 *  b.滑动到边界时，为当前导航滑动包裹层（".ui-navigator-wrapper"）添加css3阴影（scroll时间里this为当前iScroll对象）
		 */
		_setShadow:function(){
			var me = this,
				data = me.option;
			if(!data.isShowShadow) return;
			me.element.each(function(index,ele){
				var wrapper=$(ele).find(".ui-navigator-wrapper");
				wrapper.data("iScroll").on("scroll",function(e){
					var rightBoundary=this.x-this.maxScrollX,
						leftBoundary =this.x;
					if(rightBoundary<0){
						if(rightBoundary<-10) rightBoundary=-10;
						wrapper.css({
							"box-shadow":rightBoundary+"px 0 "+Math.abs(rightBoundary)+"px -8px rgba(0,0,0,0.15) inset"	
						});
					}
					if(leftBoundary>0){
						if(leftBoundary>10) leftBoundary=10;
						wrapper.css({
							"box-shadow":leftBoundary+"px 0 "+Math.abs(leftBoundary)+"px -8px rgba(0,0,0,0.15) inset"	
						});
					}
				});
			});
			return me;
		}
	} 
	/*
	 *扩展为插件
	 *①实例化构造函数并传参
	 *  $(this)：目的可以使用其他非“ui-navigator”类进行单独局部调用；
	 *  option ：用户选项
	 */
    $.fn.nav=function(option){
		return new Nav(this,option)
	};
})(jQuery);  
