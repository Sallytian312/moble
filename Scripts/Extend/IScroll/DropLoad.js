/* 
 * Ajax滑动刷新
 * 滑动加载数据
 * V1.1
 */
(function ($) {
	$.fn.dropload=function(options){
		var defaults={
			downFresh:false,
			cache:false,
			cacheName:"",
			listWrap:"",
			type:'GET',
			url:'',
			data: null,
			dataType:"json",
			success:null
		}
		var opts = $.extend(defaults,options);
		var $this=$(this),
			$hiddenInput =$this.find("input[type='hidden']");
		/*
		 *调整HTML：
		 *  a.在滑动层（".ui-drop-scroller"）底部动态追加上拉DOM；
		 *  b.在滑动层（".ui-drop-scroller"）顶部动态追加下滑DOM；
		 */
		var $dropScroller =  $this.find(".ui-drop-scroller");
		if($dropScroller.find(".ui-scroller-pullUp").length<=0){
			$dropScroller.append("<div class='ui-scroller-pullUp'>"+
								 	"<div class='loading-more loading-status'>"+
										"<span id='up-icon' class='pull-up-icon'><i class='ui-icon-arrow-pull'></i></span>"+
										"<span id='pullUp-msg' class='pull-up-msg'>上拉加载更多...</span>"+
									"</div>"+
								 "</div>");
		}
		if($dropScroller.find(".ui-scroller-pullDown").length<=0){
			$dropScroller.prepend("<div class='ui-scroller-pullDown'>"+
										"<div class='ui-circle'>"+
											"<div class='ui-pie-left'><div class='ui-circle-left'></div></div>"+
											"<div class='ui-pie-right'><div class='ui-circle-right'></div></div>"+
										"</div>"+
										"<span id='pullUp-msg' class='pull-up-msg'>下拉刷新...</span>"+
									"</div>");
		}
		var $scrollerPull=$this.find(".ui-scroller-pullUp"),
			$scrollerPullIcon=$scrollerPull.find(".pull-up-icon"),
			$scrollerDown=$this.find(".ui-scroller-pullDown"),
			$scrollerDownIconL=$scrollerDown.find('.ui-circle-left'),
			$scrollerDownIconR=$scrollerDown.find('.ui-circle-right');
		/*
		 *初始化IScroll：
		 */
		var iScroll=new IScroll("#"+$this.get(0).id,{
			probeType:3,
			bounceEasing:"circular",
			mouseWheel:true, 
			click:true
		});
		/*
		 *IScroll滑动中：
		 *①超出下边界，显示箭头翻转动画效果；
		 *②超出上边界，显示圆形进度动画效果；
		 */
		iScroll.on("scroll",function(){
			//下边界箭头翻转动画
			var y = this.y,
				maxY = this.maxScrollY - y,
				upHasClass = $scrollerPullIcon.hasClass("reverse_icon");
			if(maxY >= 50){
				!upHasClass && $scrollerPullIcon.addClass("reverse_icon");
				return "";
			}else if(maxY < 50 && maxY >=0){
				upHasClass && $scrollerPullIcon.removeClass("reverse_icon");
				return "";
			};
			//上边界圆形进度动画
			if(opts.downFresh){
				var pie = parseInt((this.y/50)*360);
				if(pie <180){
					if(pie<0) pie=0;
					$scrollerDownIconR.css('transform', "rotate(" + (45+pie) + "deg)");
					$scrollerDownIconL.css('transform', "rotate(45deg)");
				}else if(pie >=180){
					if(pie>360) pie=360;
					$scrollerDownIconR.css('transform', "rotate(225deg)");
					$scrollerDownIconL.css('transform', "rotate(" + (pie - 135) + "deg)");
				}
			//锁定下拉滑动
			}else{
				if(this.directionY==-1||this.directionY==0){
					this.refresh();
				}
			}
		});
		/*
		 *IScroll滑动结束：重置箭头翻转动画效果；
		 */
		iScroll.on("scrollEnd",function(){
			$scrollerPullIcon.removeClass("reverse_icon");
		});
		/*
		 *向上滑动超过边界50像素：
		 *①执行ajax函数,参数false代表在原列表上追加；
		 */
		iScroll.on("slideUp",function(){
			if(this.maxScrollY - this.y > 50){
				ajaxAction(false);//false在原列表上追加
				$scrollerPullIcon.removeClass("reverse_icon");
			}
			this.refresh();
		});
		/*
		 *向下滑动超过边界50像素：
		 *①重置隐藏input值为1；
		 *②重置opts.data参数；
		 *③执行ajax函数,参数true代表覆盖原列表；
		 */
		iScroll.on("slideDown",function(){
			if(opts.downFresh){
				if(this.directionY==-1&&this.y>50) {
					$hiddenInput.val(1);
					opts.data=$.extend(opts.data,{ currentPage:$hiddenInput.val()});
					ajaxAction(true);//true覆盖原列表
				};
				this.refresh();
			}
		});
		/*
		 *页面加载初始化列表(只执行一次):
		 *①如果隐藏input的value值为1，说明是第一次加载该列表，执行ajax从服务器读取列表；
		 *②如果隐藏input的value值不为1（后退按钮）,并且缓存不为空（允许缓存）：
		 *  此时则从缓存读取列表内容（刷新页面或通过其他链接进入该页面，会清空缓存，重新加载）；
		 *③如果隐藏input的value值不为1（后退按钮）,并且缓存为空（禁止缓存）：
		 *  此时则重置input值和opts.data参数，执行ajax函数；
		 */
		var session=sessionStorage.getItem(opts.cacheName);
		if($hiddenInput.val()==1){
			ajaxAction(true);//true覆盖原列表
		}else if(session!=null){
			$this.find(opts.listWrap).html(session);
			iScroll.refresh();
			iScroll.scrollTo(0,iScroll.maxScrollY,0);
		}else{
			$hiddenInput.val(1);
			opts.data=$.extend(opts.data,{ currentPage:$hiddenInput.val()});
			ajaxAction(true);	
		};
		/*
		 *执行ajax函数:
		 *①ajax执行之前，底部上拉DOM显示“正在加载中...”；
		 *②ajax执行成功：
		 *  a.获取当前页，设置隐藏input的value值为当前页面数加1，并重置opts.data参数；
		 *  b.如果ajax返回有数据：
		 *    执行回调（返回列表DOM）；
		 *    如果不是最后一页，底部上拉DOM显示“上拉加载更多...”，根据down参数选择列表是追加还是覆盖，最后缓存所有的列表DOM；
		 *    如果是最后一页，底部上拉DOM显示“内容加载完毕...”；
		 *  c.如果ajax返回无数据：底部上拉DOM显示“暂无数据...”；
		 *③ajax执行失败：底部上拉DOM显示“数据加载错误...”
		 */
		function ajaxAction(down){
			$scrollerPull.html("<div class='loading loading-status'><i></i><p>正在加载中...</p></div>");
			$.ajax({
			   type:opts.type,
			   url:opts.url,
			   data:opts.data,
			   dataType:opts.dataType,
			   success: function(data_back){
				   
				   var currentPage = parseInt($hiddenInput.val());
				   $hiddenInput.val(currentPage+1);
				   opts.data=$.extend(opts.data,{ currentPage:$hiddenInput.val()});
				   
				   if(data_back.code==0){
					   var inHtml=opts.success(data_back);
					   if ((data_back.item.totalCount >= data_back.item.numPerPage * currentPage) || (data_back.item.totalCount > data_back.item.numPerPage * (currentPage - 1))){
						   $scrollerPull.html("<div class='loading-more loading-status'>"+
														"<span id='up-icon' class='pull-up-icon'><i class='ui-icon-arrow-pull'></i></span>"+
														"<span id='pullUp-msg' class='pull-up-msg'>上拉加载更多...</span>"+
											  "</div>");
						   $scrollerPullIcon=$scrollerPull.find(".pull-up-icon");
						   down ? $this.find(opts.listWrap).html(inHtml) : $this.find(opts.listWrap).append(inHtml);
						   if(opts.cache) sessionStorage.setItem(opts.cacheName, $this.find(opts.listWrap).html());
					   }else{
						   $scrollerPull.html("<div class='loading-complete loading-status'><i class='ui-icon-complete'></i><p>内容加载完毕...</p></div>");
					   }
				   }
				   
				   if (data_back.code == "1"){
					   $scrollerPull.html("<div class='loading-none loading-status'><i class='ui-icon-nothing'></i><p>暂无数据...</p></div>");
				   }
				   
				   iScroll.refresh();
			   },
			   error: function(xhr,errText,errType){
				   $scrollerPull.html("<div class='loading-error loading-status'><i class='ui-icon-error'></i><p>数据加载错误...</p></div>");
			   }
			});
		} 
		 
	}
})(jQuery);  
