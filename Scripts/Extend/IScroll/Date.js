/* 
 * 日期插件
 * 滑动选取日期（年，月，日）
 * V1.1
 */
(function ($) {      
    $.fn.date = function (options,Ycallback,Ncallback) {   
        /*
		 *插件默认选项
		 */
        var that = $(this);
        var docType = $(this).is('input');
        var datetime = false;
        var nowdate = new Date();
        var indexY=1,indexM=1,indexD=1;
        var indexH=1,indexI=1,indexS=0;
        var initY=parseInt((nowdate.getYear()+"").substr(1,2));
        var initM=parseInt(nowdate.getMonth()+"")+1;
        var initD=parseInt(nowdate.getDate()+"");
        var initH=parseInt(nowdate.getHours());
        var initI=parseInt(nowdate.getMinutes());
        var initS=parseInt(nowdate.getYear());
        var yearScroll=null,monthScroll=null,dayScroll=null;
        var HourScroll=null,MinuteScroll=null,SecondScroll=null;
        $.fn.date.defaultOptions = {
            beginyear:2000,                 
            endyear:2020,                   
            beginmonth:1,                   
            endmonth:12,                    
            beginday:1,                     
            endday:31,                      
            beginhour:1,
            endhour:12,
            beginminute:00,
            endminute:59,
            theme:"date",   //控件样式（1：date日期，2：datetime日期+时间）
            mode:null,		//操作模式（滑动模式）
            event:"click",	//打开日期插件默认方式为点击后后弹出日期 
            show:true
        }
        /*
		 *用户选项覆盖插件默认选项   
		 */
        var opts = $.extend( true, {}, $.fn.date.defaultOptions, options );
		/*
		 *绑定表单获取焦点事件，初始化并显示日期弹窗
		 */
        if(opts.theme === "datetime"){datetime = true;}
        if(!opts.show){
            that.off('click');
        }else{
            that.on(opts.event,function () {
                CreateDateUI();                               //动态插入日期框
				$("#yearwrapper ul").html(createYEAR_UL());	  //计算并插入年份列表
				$("#monthwrapper ul").html(createMONTH_UL());//计算并插入月份列表
				$("#daywrapper ul").html(createDAY_UL());    //计算并插入日份列表
                init_iScrll();  						      //初始化IScroll年月日滑动
                extendOptions(); 							  //显示时间弹窗和阴影
                that.blur();
                if(datetime){								  //如果datetime为true，初始化时分秒滚动
					$("#datescroll_datetime").show(); 
					$("#Hourwrapper ul").html(createHOURS_UL());
					$("#Minutewrapper ul").html(createMINUTE_UL());
					$("#Secondwrapper ul").html(createSECOND_UL());
					init_iScroll_datetime();
					addTimeStyle();
                    refreshTime();
                }
                refreshDate();
                bindButton();
            });
        };
        function refreshDate(){
            yearScroll.refresh();
            monthScroll.refresh();
            dayScroll.refresh();

            resetInitDate();
			
            yearScroll.scrollTo(0, -initY*40, 100, IScroll.utils.ease.elastic);
            monthScroll.scrollTo(0, -(initM*40-40), 200, IScroll.utils.ease.elastic);
            dayScroll.scrollTo(0, -(initD*40-40), 300, IScroll.utils.ease.elastic); 
        }
		function resetInitDate(){
			if(that.val()===""){return false;}
            initY = parseInt(that.val().substr(2,2));
            initM = parseInt(that.val().substr(5,2));
            initD = parseInt(that.val().substr(8,2));
        }
        function refreshTime(){
            HourScroll.refresh();
            MinuteScroll.refresh();
            SecondScroll.refresh();
            if(initH>12){    																//initH大于12说明是下午
                 SecondScroll.scrollTo(0, -indexS*40-40,100, IScroll.utils.ease.elastic);   //滚动显示到“下午”
                 initH=initH-12;
            }
            HourScroll.scrollTo(0, -initH*40+40, 100, IScroll.utils.ease.elastic);
            MinuteScroll.scrollTo(0, -initI*40, 100, IScroll.utils.ease.elastic);   
            initH=parseInt(nowdate.getHours());
        }
		/*
		 *绑定弹窗按钮点击事件，关闭弹窗或确定取值
		 */
        function bindButton(){
            resetIndex();
            $("#dateconfirm").off('click').click(function () {
            	var datestr = $("#yearwrapper ul li:eq("+indexY+")").html().substr(0,$("#yearwrapper ul li:eq("+indexY+")").html().length-1)+"-"+
                          	  $("#monthwrapper ul li:eq("+indexM+")").html().substr(0,$("#monthwrapper ul li:eq("+indexM+")").html().length-1)+"-"+
			  				  $("#daywrapper ul li:eq("+Math.round(indexD)+")").html().substr(0,$("#daywrapper ul li:eq("+Math.round(indexD)+")").html().length-1);
                if(datetime){
                     if(Math.round(indexS)===1){//下午
                        $("#Hourwrapper ul li:eq("+indexH+")").html(parseInt($("#Hourwrapper ul li:eq("+indexH+")").html().substr(0,$("#Hourwrapper ul li:eq("+indexH+")").html().length-1))+12)
                     }else{
                        $("#Hourwrapper ul li:eq("+indexH+")").html(parseInt($("#Hourwrapper ul li:eq("+indexH+")").html().substr(0,$("#Hourwrapper ul li:eq("+indexH+")").html().length-1)))
                     }
                     datestr+=" "+$("#Hourwrapper ul li:eq("+indexH+")").html().substr(0,$("#Minutewrapper ul li:eq("+indexH+")").html().length-1)+":"+
                                  $("#Minutewrapper ul li:eq("+indexI+")").html().substr(0,$("#Minutewrapper ul li:eq("+indexI+")").html().length-1);
                     indexS=0;
                }
				
				if(docType){that.val(datestr);}else{that.html(datestr);}
                $("#datePage").hide(); 
                $("#dateshadow").hide();
                if(Ycallback != undefined) Ycallback(datestr);
            });
            $("#datecancle").click(function () {
                $("#datePage").hide(); 
				$("#dateshadow").hide();
				if(Ycallback!=undefined) Ncallback(false);
            });
        }
		function resetIndex(){
            indexY=1;
            indexM=1;
            indexD=1;
        }
		/*
		 *显示 -- 时间弹窗
		 *显示 -- 遮罩层
		 */
        function extendOptions(){
            $("#datePage").show(); 
            $("#dateshadow").show();
        }
        /*
		 *初始化年月日滑动
		 *年：①滑动结束得到当前年份li的索引，根据索引取得当前年份li的内容“2016年”，并截取“2016”；
		 *    ②重置当前月份的结束日期，并重新计算填充日期列表；
		 *    ③重新滚动日期列表到指定位置；
		 *月：①滑动结束得到当前月份li的索引，根据索引取得当前月份li的内容“07月”，并截取“07”；
		 *    ②重置当前月份的结束日期，并重新计算填充日期列表；
		 *    ③重新滚动日期列表到指定位置；
		 *日：①滑动结束得到当前日期li的索引；
		 */
        function init_iScrll() { 
			var strY='20'+initY;
			var strM='0' +initM;
			yearScroll = new IScroll("#yearwrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			});
			yearScroll.on("scrollEnd",function () {
				indexY = (this.y/40)*(-1)+1;
				strY = $("#yearwrapper ul li:eq("+indexY+")").html().substr(0,$("#yearwrapper ul li:eq("+indexY+")").html().length-1);
				opts.endday = checkdays(strY,strM);
				$("#daywrapper ul").html(createDAY_UL());
				dayScroll.scrollTo(0, -(initD*40-40), 300, IScroll.utils.ease.elastic); 
			});
			monthScroll = new IScroll("#monthwrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			});
			monthScroll.on("scrollEnd",function () {
				indexM = (this.y/40)*(-1)+1;
				strM =$("#monthwrapper ul li:eq("+indexM+")").html().substr(0,$("#monthwrapper ul li:eq("+indexM+")").html().length-1);
				opts.endday = checkdays(strY,strM);
				$("#daywrapper ul").html(createDAY_UL());
				dayScroll.scrollTo(0, -(initD*40-40), 300, IScroll.utils.ease.elastic); 
			});
			dayScroll = new IScroll("#daywrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			});
			dayScroll.on("scrollEnd",function () {
				indexD = (this.y/40)*(-1)+1;
			});
        }
        /*
		 *初始化时分秒滑动
		 *时：①滑动结束得到当前时li的索引；
		 *分：①滑动结束得到当前分li的索引；
		 *秒：①滑动结束得到当前秒li的索引；
		 */
        function init_iScroll_datetime(){
			HourScroll = new IScroll("#Hourwrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			})
			HourScroll.on("scrollEnd",function () {
				indexH = Math.round((this.y/40)*(-1))+1;
			});
            MinuteScroll = new IScroll("#Minutewrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			})
			MinuteScroll.on("scrollEnd",function () {
				indexI = Math.round((this.y/40)*(-1))+1;
			});
            SecondScroll = new IScroll("#Secondwrapper",{
				snap:"li",
				scrollbars:false,
				resizeRefresh:false
			})
			SecondScroll.on("scrollEnd",function () {
				indexS = Math.round((this.y/40)*(-1));
			});
        } 
		/*
		 *取得当前月的最后一天的日期
		 *①取当年下个月中的第一天代表的时间戳；
		 *②将当年下个月中的第一天的时间戳减去一天（1000*60*60*24），转化为日期，即为当月最后一天
		 */
        function checkdays (year,month){
            var new_year = year;    
            var new_month = month++;
            if(month>12)			
            {        
                new_month -=12;       
                new_year++;    
            }        
            var new_date = new Date(new_year,new_month,1);                 //取当年下月中的第一天  
            return (new Date(new_date.getTime()-1000*60*60*24)).getDate();//获取当月最后一天日期    
        }
		/*
		 *创建 --弹窗-- 结构
		 */
        function CreateDateUI(){
            var str = ''+
                '<div id="dateshadow"></div>'+
                '<div id="datePage" class="page">'+
                    '<section>'+
                        '<div id="datetitle"><h1>请选择日期</h1></div>'+
                        '<div id="datemark"><a id="markyear"></a><a id="markmonth"></a><a id="markday"></a></div>'+
                        '<div id="timemark"><a id="markhour"></a><a id="markminut"></a><a id="marksecond"></a></div>'+
                        '<div id="datescroll">'+
                            '<div id="yearwrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                            '<div id="monthwrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                            '<div id="daywrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                        '</div>'+
                        '<div id="datescroll_datetime">'+
                            '<div id="Hourwrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                            '<div id="Minutewrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                            '<div id="Secondwrapper">'+
                                '<ul></ul>'+
                            '</div>'+
                        '</div>'+
                    '</section>'+
                    '<footer id="dateFooter">'+
                        '<div id="setcancle">'+
                            '<ul>'+
                                '<li id="dateconfirm">确定</li>'+
                                '<li id="datecancle">取消</li>'+
                            '</ul>'+
                        '</div>'+
                    '</footer>'+
                '</div>'
            $("#datePlugin").html(str);
        }
		/*
		 *当显示时分秒时，重置弹窗样式
		 */
        function addTimeStyle(){
            $("#datePage").css("height","380px");
			$("#datePage").css("margin-top","-190px");
            $("#yearwrapper").css("position","absolute");
            $("#yearwrapper").css("bottom","200px");
            $("#monthwrapper").css("position","absolute");
            $("#monthwrapper").css("bottom","200px");
            $("#daywrapper").css("position","absolute");
            $("#daywrapper").css("bottom","200px");
        }
		/*
		 *创建 --年-- 列表
		 */
        function createYEAR_UL(){
            var str="<li>&nbsp;</li>";
            for(var i=opts.beginyear; i<=opts.endyear;i++){
                str+='<li>'+i+'年</li>'
            }
            return str+"<li>&nbsp;</li>";;
        }
		/*
		 *创建 --月-- 列表
		 */
        function createMONTH_UL(){
            var str="<li>&nbsp;</li>";
            for(var i=opts.beginmonth;i<=opts.endmonth;i++){
                if(i<10){
                    i="0"+i
                }
                str+='<li>'+i+'月</li>'
            }
            return str+"<li>&nbsp;</li>";;
        }
		/*
		 *创建 --日-- 列表
		 */
        function createDAY_UL(){
              $("#daywrapper ul").html("");
			  var str="<li>&nbsp;</li>";
				  for(var i=opts.beginday;i<=opts.endday;i++){
				  str+='<li>'+i+'日</li>'
			  }
			  return str+"<li>&nbsp;</li>";;                     
        }
		/*
		 *创建 --时-- 列表
		 */
        function createHOURS_UL(){
            var str="<li>&nbsp;</li>";
            for(var i=opts.beginhour;i<=opts.endhour;i++){
                str+='<li>'+i+'时</li>'
            }
            return str+"<li>&nbsp;</li>";;
        }
		/*
		 *创建 --分-- 列表
		 */
        function createMINUTE_UL(){
            var str="<li>&nbsp;</li>";
            for(var i=opts.beginminute;i<=opts.endminute;i++){
                if(i<10){
                    i="0"+i
                }
                str+='<li>'+i+'分</li>'
            }
            return str+"<li>&nbsp;</li>";;
        }
        //创建 --上下午-- 列表
        function createSECOND_UL(){
            var str="<li>&nbsp;</li>";
            str+="<li>上午</li><li>下午</li>"
            return str+"<li>&nbsp;</li>";;
        }
    }
})(jQuery);  
