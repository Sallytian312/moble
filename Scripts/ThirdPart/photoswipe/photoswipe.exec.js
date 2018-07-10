var initPhotoSwipeFromDOM = function(gallerySelector) {
    /*
	 *创建列表项对象函数:
	 *①参数el代表，“缩略图点击函数”中的“clickedGallery”变量（ul）；
	 *②函数parseThumbnailElements返回items数组（存储item对象）；
	 *③item对象存储html中获取的图片信息
	 */
    var parseThumbnailElements = function(clickedGallery) {
		var a_link=$(clickedGallery).find("a"),
			 a_link_len=a_link.length;
        var thumbElements = $(clickedGallery).find("a"),
        	 numNodes = thumbElements.length,
         	 items = [],
        	 el,
        	 childElements,
        	 size,
        	 item;
        for (var i = 0; i < numNodes; i++) {
            el = thumbElements[i];
            if (el.nodeType !== 1) {
                continue;
            };
            //列表项对象:获取html存储的大图信息，并存储到item对象中；
            size = el.getAttribute('data-size').split('x');
            item = {
                src: el.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10),
                author: el.getAttribute('data-author')
            };
            item.el = el;
            //列表项对象:获取IMG标签的缩略图地址和figure标签的标题内容，并存储到item对象中；
            childElements = el.children;
            if (childElements.length > 0) {
                item.msrc = childElements[0].getAttribute('src');
                if (childElements.length > 1) {
                    item.title = childElements[1].innerHTML;
                }
            };
            //列表项对象:获取html存储的中图信息，并存储到item对象中；
            var mediumSrc = el.getAttribute('data-med');
            if (mediumSrc) {
                size = el.getAttribute('data-med-size').split('x');
                item.m = {
                    src: mediumSrc,
                    w: parseInt(size[0], 10),
                    h: parseInt(size[1], 10)
                }
            };
			//列表项对象:往列表项对象添加初始化图片
            item.o = {
                src: item.src,
                w: item.w,
                h: item.h
            };
            items.push(item);
        }
        return items;
    };
    /*
	 *递归函数：找到最近父元素，遇a停止寻找
	 */
    var closest = function closest(el, fn) {
        return el && (fn(el) ? el: closest(el.parentNode, fn));
    };
    /*
	 *缩略图点击函数：
	 *①阻止默认行为；
	 *②closest递归函数，查找缩略图是否被a包裹：
	 *  a.不是则就跳出函数；
	 *  b.是则执行第③步；
	 *③a.获取li的数量；
	 *  b.添加触发元素的index索引；
	 *  c.调用openPhotoSwipe，传入动态索引，和图片集父元素；
	 */
    var onThumbnailsClick = function(e) {
        //阻止默认行为
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        //检测图片是否被a包含
        var eTarget = e.target || e.srcElement;
        var clickedListItem = closest(eTarget,function(el) {
            return el.tagName === 'A';
        });
        if (!clickedListItem) {
            return;
        }
		//添加索引，调用openPhotoSwipe；
		//nodeType:1（元素），2（属性），3（文本）；
        var clickedGallery = clickedListItem.parentNode.parentNode;
        var childLiNodes = clickedGallery.childNodes,
        NumLiNodes = childLiNodes.length,
        nodeIndex = 0,
        index;
        for (var i = 0; i < NumLiNodes; i++) {
            if (childLiNodes[i].nodeType !== 1) {
                continue;
            }
            nodeIndex++;
            if (childLiNodes[i].children[0] === clickedListItem) {
                index = nodeIndex;
                break;
            }
        }
        if (index >= 0) {
            openPhotoSwipe(index-1, clickedGallery,false,false);
        }
        return false;
    };
    /*
	 *分解哈希值函数：
	 *①获取链接中的哈希值；
	 *②将哈希值分解为对象形式；
	 *③gid为图片组的索引，pid为每个图片组里的图片的索引；
	 */
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};
        //如果hash值的长度小于5(pid=1)，则证明没有链接中没有hash值，返回空params，并跳出函数
        if (hash.length < 5) return params;
        //分解hash（pid=1&gid=2）值，使之成为键值对的形式，存储在params对象中({pid:1,gid:2})
        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if (!vars[i]) continue;
            var pair = vars[i].split('=');
            if (pair.length < 2) continue;
            params[pair[0]] = pair[1];
        }
        //判断hash值gid是否存在，存在则转换为十进制整数
        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }
        return params;
    };
    /*
	 *图片浏览插件函数：
	 *①参数index：点击时图片的索引；
	 *  参数clickedGallery：点击的图片组父元素（"ul"）;
	 *  参数disableAnimation：是否有动画效果;
	 *  
	 *②配置插件选项；
	 */
    var openPhotoSwipe = function(index, clickedGallery, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
        gallery,
        options,
        items;
        //创建items数组：里面为存储了图片信息的item对象
        items = parseThumbnailElements(clickedGallery);
        //创建options选项：
		//galleryUID，用来创建gid；
		//getThumbBoundsFn，效果函数，插件内置；
		//addCaptionHTMLFn，
        options = {
            galleryUID: clickedGallery.parentNode.getAttribute('data-pswp-uid'),
			galleryPIDs:false,
            getThumbBoundsFn: function(index) {
                var thumbnail = items[index].el.children[0],
                pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                rect = thumbnail.getBoundingClientRect();
                return {
                    x: rect.left,
                    y: rect.top + pageYScroll,
                    w: rect.width
                };
            },
            addCaptionHTMLFn: function(item, captionEl, isFake) {
                if (!item.title) {
                    captionEl.children[0].innerText = '';
                    return false;
                }
                captionEl.children[0].innerHTML = item.title/* + '<br/><small>Photo: ' + item.author + '</small>'*/;
                return true;
            }
        };
        //自定义pid，gid的值的形式
        if (fromURL) {
            if (options.galleryPIDs) {
                for (var j = 0; j < items.length; j++) {
                    if (items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }
        if (isNaN(options.index)) {
            return;
        }
        //如果参数disableAnimation存在，则在options配置动画时间
        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }
        //初始实例化插件并传进设置好的参数
        gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        //监听beforeResize事件，使图片可以自适应大小
        var realViewportWidth, useLargeImages = false,
        firstResize = true,
        imageSrcWillChange;
        gallery.listen('beforeResize',function() {
            //通过设备像素比的转换获取视口实际宽度
            var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio: 1;
            dpiRatio = Math.min(dpiRatio, 2.5);
            realViewportWidth = gallery.viewportSize.x * dpiRatio;
            //如果是宽屏则使用大图，小屏则使用小图
            if (realViewportWidth >= 1200 || (!gallery.likelyTouchDevice && realViewportWidth > 800) || screen.width > 1200) {
                if (!useLargeImages) {
                    useLargeImages = true;
                    imageSrcWillChange = true;
                }
            } else {
                if (useLargeImages) {
                    useLargeImages = false;
                    imageSrcWillChange = true;
                }
            }
            if (imageSrcWillChange && !firstResize) {
                gallery.invalidateCurrItems();
            }
            if (firstResize) {
                firstResize = false;
            }
            imageSrcWillChange = false;
        });
        gallery.listen('gettingData',function(index, item) {
            if (useLargeImages) {
                item.src = item.o.src;
                item.w = item.o.w;
                item.h = item.o.h;
            } else {
                item.src = item.m.src;
                item.w = item.m.w;
                item.h = item.m.h;
            }
        });
        gallery.init();
    };
    /*
	 *绑定触发元素
	 */
    var galleryElements = document.querySelectorAll(gallerySelector);
    for (var i = 0,l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
    };
    //根据链接里的哈希值pid和gid--打开插件并定位到相应图片组里的某一张图片
    var hashData = photoswipeParseHash();
    if (hashData.pid && hashData.gid) {
        openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
    };
}