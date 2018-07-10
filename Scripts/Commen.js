$(function(){
	/*
	 *模拟a链接点击跳转
	 */
	$('.ui-header').on("tap",".ui-icon-demo,.ui-icon-home",function(){
		var _href=$(this).attr('data-href');
		if(_href!=undefined){
			location.href=_href;
		}
		return false;
    });
	/*
	 *表单清除内容按钮
	 */
	$(".ui-form-item .ui-icon-delete").tap(function(){
		$(this).prev().val("").focus();
		return false;	
	});
});
(function($){
	$.fn.toAnchor=function(options){
		var opts = $.extend({  
			duration:500,
			easing:	"swing",			
			callback:null 
		}, options);
		var selfs=this;
		selfs.on("click",function(){
			var self = $(this),
				explorer  = navigator.userAgent,
				doc = "",
				target = self.attr("href");
				target = target.replace(/^\s+|\s+$/g,"");
			if(target.length<1 || target.charAt(0)!="#") return false;
			if (explorer.indexOf("MSIE") >= 0 || explorer.indexOf("Firefox") >= 0) {
				doc = "html"
			}else if(explorer.indexOf("Chrome") >= 0 || explorer.indexOf("Safari") >= 0 || explorer.indexOf("Opera") >= 0){
				doc = "body"
			}
			$(doc).animate({
				scrollTop: $(target).offset().top + "px"
			},{
				duration:opts.duration,
				easing:opts.easing,
				complete:function(){
					if(opts.callback != null) opts.callback.call(self); 
				}
			});
			return false;
		});
	}
})(jQuery);