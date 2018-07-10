!function ($) {
	var _private = {};
	_private.cache = {};
	$.tpl = function (str, data, env) {
		// 判断str参数，如str为script标签的id，则取该标签的innerHTML，再递归调用自身
		// 如str为HTML文本，则分析文本并构造渲染函数
		var fn = !/[^\w\-\.:]/.test(str)
			? _private.cache[str] = _private.cache[str] || this.get(document.getElementById(str).innerHTML)
			: function (data, env) {
			var i, variable = [], value = []; // variable数组存放变量名，对应data结构的成员变量；value数组存放各变量的值
			for (i in data) {
				variable.push(i);
				value.push(data[i]);
			}
			return (new Function(variable, fn.code)).apply(env || data, value); // 此处的new Function是由下面fn.code产生的渲染函数；执行后即返回渲染结果HTML
		};

		fn.code = fn.code || "var $parts=[]; $parts.push('"
			+ str
			.replace(/\\/g, '\\\\') // 处理模板中的\转义
			.replace(/[\r\t\n]/g, " ") // 去掉换行符和tab符，将模板合并为一行
			.split("<%").join("\t") // 将模板左标签<%替换为tab，起到分割作用
			.replace(/(^|%>)[^\t]*/g, function(str) { return str.replace(/'/g, "\\'"); }) // 将模板中文本部分的单引号替换为\'
			.replace(/\t=(.*?)%>/g, "',$1,'") // 将模板中<%= %>的直接数据引用（无逻辑代码）与两侧的文本用'和,隔开，同时去掉了左标签产生的tab符
			.split("\t").join("');") // 将tab符（上面替换左标签产生）替换为'); 由于上一步已经把<%=产生的tab符去掉，因此这里实际替换的只有逻辑代码的左标签
			.split("%>").join("$parts.push('") // 把剩下的右标签%>（逻辑代码的）替换为"$parts.push('"
			+ "'); return $parts.join('');"; // 最后得到的就是一段JS代码，保留模板中的逻辑，并依次把模板中的常量和变量压入$parts数组

		return data ? fn(data, env) : fn; // 如果传入了数据，则直接返回渲染结果HTML文本，否则返回一个渲染函数
	};
	$.adaptObject =  function (element, defaults,option,template,plugin,pluginName) {
    	var $this= element;
    	if (typeof option != 'string'){
    		// 获得配置信息
   			var context=$.extend({},defaults,typeof option == 'object' && option);
    		var isFromTpl=false;
    		// 如果传入script标签的选择器
    		if($.isArray($this) && $this.length && $($this)[0].nodeName.toLowerCase()=="script"){
     			// 根据模板获得对象并插入到body中
      			$this=$($.tpl($this[0].innerHTML,context)).appendTo("body");
      			isFromTpl=true;
    		}
    		// 如果传入模板字符串
    		else if($.isArray($this) && $this.length && $this.selector== ""){
      			// 根据模板获得对象并插入到body中
      			$this=$($.tpl($this[0].outerHTML,context)).appendTo("body");
      			isFromTpl=true;
    		}
    		// 如果通过$.dialog()的方式调用
    		else if(!$.isArray($this)){
      			// 根据模板获得对象并插入到body中
      			$this=$($.tpl(template,context)).appendTo("body");
      			isFromTpl=true;
    		}
    	}
    	return $this.each(function() {
            var el = $(this);
            // 读取对象缓存
            var data = el.data('fz.' + pluginName);
            if (!data) el.data('fz.' + pluginName, (data = new plugin(this, $.extend({},defaults,typeof option == 'object' && option), isFromTpl)));
            if (typeof option == 'string') data[option]();
        })
    }
}(jQuery);
/*****************************************************************
 **************************dialog弹窗插件*******************************
 *****************************************************************/
!function($){
	var _dialogTpl= '<div class="ui-dialog">'+
						'<div class="ui-dialog-cnt">'+
							'<header class="ui-dialog-hd ui-border-b">'+
	                            '<h3><%=title%></h3>'+
	                            '<i class="ui-dialog-close" data-role="button"></i>'+
	                        '</header>'+
							'<div class="ui-dialog-bd">'+
								'<div><%=content%></div>'+
							'</div>'+
							'<div class="ui-dialog-ft ui-btn-group">'+
								'<% for (var i = 0; i < button.length; i++) { %>' +
								'<% if (i == select) { %>' +
								'<button type="button" data-role="button"  class="select" id="dialogButton<%=i%>"><%=button[i]%></button>' +
								'<% } else { %>' +
								'<button type="button" data-role="button" id="dialogButton<%=i%>"><%=button[i]%></div>' +
								'<% } %>' +
								'<% } %>' +
							'</div>'+
						'</div>'+        
				    '</div>';
	var defaults={
		title:'',
		content:'',
		button:['确认'],
		select:0,
		allowScroll:false,
		callback:function(){}
	}
	var Dialog  = function (el,option,isFromTpl) {
		this.option=$.extend(defaults,option);
		this.element=$(el);
		this._isFromTpl=isFromTpl;
		this.button=$(el).find('[data-role="button"]');
		this._bindEvent();
		this.toggle();
	}
	Dialog.prototype={
		_bindEvent:function(){
			var self=this;
			self.button.on("tap",function(){
				var index=$(self.button).index($(this));
				var e=$.Event("dialog:action");
				e.index=index;
				self.element.trigger(e);
				//self.show.apply(self);
				self.hide.apply(self);
			});
		},
		toggle:function(){
			if(this.element.hasClass("show")){
				this.hide();
			}else{
				this.show();
			}
		},
		show:function(){
			var self=this;
			self.option.callback("show");
			self.element.trigger($.Event("dialog:show"));
			self.element.addClass("show");
			this.option.allowScroll && self.element.on("touchmove" , _stopScroll);
		},
		hide :function () {
			var self=this;
			self.option.callback("hide");
			self.element.trigger($.Event("dialog:hide"));
			self.element.off("touchmove" , _stopScroll);
			self.element.removeClass("show");
			self._isFromTpl&&self.element.remove();
			self.element.off("dialog:hide");
			self.element.off("dialog:action");
			self.element.off("dialog:show");
		}
	}
	function _stopScroll(){
		return false;
	}
	function Plugin(option) {
		return $.adaptObject(this, defaults, option,_dialogTpl,Dialog,"dialog");
	}
	$.fn.dialog=$.dialog= Plugin;
}(jQuery);
/*****************************************************************
 **************************tips消息提示插件***********************
 *****************************************************************/
!function($){
	var _tipsTpl='<div class="ui-poptips ui-poptips-<%=type%>">'+
					'<div class="ui-poptips-cnt">'+
    				'<i></i><%=content%>'+
					'</div>'+
				'</div>';
	var defaults={
		content:'',
		stayTime:1000,
		type:'info',
		callback:function(){}
	}
	var Tips   = function (el,option,isFromTpl) {
		var self=this;
		this.element=$(el);
		this._isFromTpl=isFromTpl;
		this.elementHeight=$(el).height();
		this.option=$.extend(defaults,option);
		$(el).css({
			"-webkit-transform":"translateY(-"+this.elementHeight+"px)"
		});
		setTimeout(function(){
			$(el).css({
				"-webkit-transition":"all .5s"
			});
			self.show();
		},20);
	}
	Tips.prototype={
		show:function(){
			var self=this;
			self.option.callback("show");
			self.element.trigger($.Event("tips:show"));
			this.element.css({
				"-webkit-transform":"translateY(0px)"
			});
			if(self.option.stayTime>0){
				setTimeout(function(){
					self.hide();
				},self.option.stayTime)
			}
		},
		hide :function () {
			var self=this;
			self.option.callback("hide");
			self.element.trigger($.Event("tips:hide"));
			this.element.css({
				"-webkit-transform":"translateY(-"+this.elementHeight+"px)"
			});
			setTimeout(function(){
				self._isFromTpl&&self.element.remove();
			},500);
		}
	}
	function Plugin(option) {
		return $.adaptObject(this, defaults, option,_tipsTpl,Tips,"tips");
	}
	$.fn.tips=$.tips= Plugin;
}(jQuery);
/*****************************************************************
 **************************loading加载中插件**********************
 *****************************************************************/
 !function($){
	var _loadingTpl='<div class="ui-loading-block show" id="templateLoading">'+
		                '<div class="ui-loading-cnt">'+
		                    '<i class="ui-loading-bright"></i>'+
		                    '<p><%=content%></p>'+
		                '</div>'+
		            '</div>';
	var defaults={
		content:'加载中...',
		width:130,
		height:110,
		noicon:false
	}
	var Loading   = function (el,option,isFromTpl) {
		this.element=$(el);
		this._isFromTpl=isFromTpl;
		this.option=$.extend(defaults,option);
		this.set()
		this.show();
	}
	Loading.prototype={
		set:function(){
			if(this._isFromTpl){
				if(this.option.noicon){
					this.element.find("i").remove();
				}
				this.element.children().css({
					"width":this.option.width,
					"height":this.option.height
				});
			}
		},
		show:function(){
			var e=$.Event('loading:show');
			this.element.trigger(e);
			this.element.addClass("show");
		},
		hide :function () {
			var e=$.Event('loading:hide');
			this.element.trigger(e);
			this.element.removeClass("show");
			this.element.off('loading:hide');
			this.element.off('loading:show');
		},
		remove:function(){
			var e=$.Event('loading:remove');
			this.element.trigger(e);
			this.element.remove();
			this.element.off('loading:remove');
			this.element.off('loading:show');
		}
	}
	function Plugin(option) {
		return $.adaptObject(this, defaults, option,_loadingTpl,Loading,"loading");
	}
	$.fn.loading=$.loading= Plugin;
}(jQuery);
/*****************************************************************
 **************************menu上滑面板***********************
 *****************************************************************/
!function($){
	var defaults={
		allowScroll:false,
		callback:function(){}
	}
	var Menu   = function (el,option) {
		this.element=$(el);
		this.option=$.extend(defaults,option);
		this.button=$(el).find('[data-role="button-close"]');
		this._bindEvent();
	}
	Menu.prototype={
		_bindEvent:function(){
			var self=this;
			self.button.on("tap",function(){
				self.option.callback("action");
				self.element.trigger($.Event("menu:action"));
				self.hide.apply(self);
				self.element.off("menu:action");
			});
		},
		show:function(){
			var self=this;
			self.option.callback("show");
			self.element.trigger($.Event("menu:show"));
			self.element.addClass("show");
			self.option.allowScroll&&self.element.on("touchmove" , _stopScroll);
			self.element.off("menu:show");
		},
		hide :function () {
			var self=this;
			self.option.callback("hide");
			self.element.trigger($.Event("menu:hide"));
			self.element.removeClass("show");
			self.element.off("touchmove" , _stopScroll);
			self.element.off("menu:hide");
		}
	}
	function _stopScroll(){
		return false;
	}
	//缓存对象,防止多次点击重复实例化问题
	$.menuObject =  function (element,defaults,option,plugin,pluginName) {
    	var $this= element;
    	return $this.each(function() {
            var el = $(this);
			//获取data存储的key:fz.menu的值;如果undefined，则实例化菜单构造函数，并赋值给fz.menu和data变量；
            var data = el.data('fz.' + pluginName);
            if (!data) el.data('fz.' + pluginName,(data=new plugin(this,option)));
			//如果传入的参数为方法字符串，则调用相应方法；相当于data.option（）
			if (typeof option == 'string') data[option]();
			//如果传入的参数为空，则直接调用show();
			if (option == undefined) data.show();
			//如果传入的参数为对象，则直接调用show();
			if (typeof option == 'object') {
				data.show();
				data.option.allowScroll=option.allowScroll;
			}
        })
    }
	function Plugin(option) {
		return $.menuObject(this,defaults,option,Menu,"menu");
	}
	$.fn.menu=Plugin;
}(jQuery);