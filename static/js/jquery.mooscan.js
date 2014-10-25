(function($) {
    
    var methods = {

	init : function(options) {

	    return this.each(function() {
		var cache = [];
		var $this = $(this), data = $this.data("globals");

		$.each(options.images, function(index, record) {
		    var cacheImage = document.createElement('img');
		    cacheImage.src = record;
		    cache.push(cacheImage);
		});

		options.images = [];

		$this.data("globals", {cache : cache, ix : options.imgx, iy : options.imgy, niw : options.niw, nih : options.nih, winwidth : options.winwidth, winheight : options.winheight, oiw : options.oiw, oih : options.oih, nextIndex : 0, ctx : this.getContext("2d")});

		$(this).data("globals").ctx.font="15px Verdana";

		$(document).keydown({t:$(this)}, methods.handleMouseZoomPan);
		$(document).keyup({t:$(this)},methods.handleResetKey);
		$(this).bind("click", methods.handleMouseClick);
		$(this).bind("mousedown", methods.handleMouseDown);
		$(this).bind("mouseup", methods.handleMouseUp);
		$(this).bind("touchstart", methods.handleStart);
		$(this).bind("touchend", methods.handleEnd);
    		$(this).bind("touchmove", methods.handleMove);
		$(this).bind("gesturestart", methods.handleGestureStart);
		$(this).bind("gesturechange", methods.handleGestureChange);
		$(this).bind("gestureend", methods.handleGestureEnd);
		$(this).bind("mousewheel", methods.handleMouseWheel);
		
		window.addEventListener('resize', methods.resizeMooCanvas, false); // keep resize control in submit for now
	    });	    
	},

	handleMouseWheel : function(e) {
	    e.originalEvent.preventDefault();
	    
	    if (!$(this).data('flag')) {
		var self = this;

		$(this).data('timeout', window.setTimeout(function() { $(self).data('flag', false); }, 25));
		
		var $this = $(this), data = $this.data("globals");
		var delta = Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail)));
		
		if (delta > 0) {
		    data.nextIndex = data.nextIndex - 1;
		} else {
		    data.nextIndex = data.nextIndex + 1;
		}
		
		//nextIndex = nextIndex + 1;
		if (data.nextIndex < 0) {
		    data.nextIndex = data.cache.length - 1;// - Math.abs(nextIndex);
		} else {
		    data.nextIndex = data.nextIndex % data.cache.length;		    
		}

		methods.drawStuff($(this),this); // for some reason direct call of methods like this don't have the global element $(this), need to pass that as well as the DOM element canvas

		$(this).data('flag', true);
	    }
	},

	handleMouseZoomPan : function(e) {
	    e.preventDefault();

	    var $this = e.data.t, data = $this.data("globals");
	    
	    keyPressed = 1;

	    if (e.which == 90) {
		$this.bind("mousemove", methods.handleMouseZoom);
	    } else if (e.which == 32) {
		$this.bind("mousemove", methods.handleMousePan);
	    }
	},

	handleMousePan : function(e) {
	    e.preventDefault();
	    var $this = $(this), data = $this.data("globals");
	    
	    var x = e.pageX;
	    var y = e.pageY;
	    
	    var dx = x - startX;
	    var dy = y - startY;

	    if ((Math.abs(dy) >= 150) || (Math.abs(dx) >= 150)) { // this is a substitute for getting the initial mouse position

		startX = x;
		startY = y;
		
	    } else if ((Math.abs(dy) >= 1) || (Math.abs(dx) >= 1)) {
		
		startX = x;
		startY = y;
		
		data.ix = data.ix+dx;
		data.iy = data.iy+dy;

		var picture = data.cache[data.nextIndex];
		
		var chk_iw = picture.width;
		var chk_ih = picture.height;
		
		if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
		    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		    $(this).data("globals").ctx.fillStyle="#FFFFFF";
		    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		    $(this).data("globals").ctx.fillStyle="#000000";
		}
	    }
	},

	handleResetKey : function(e) {
	    e.preventDefault();
	    
	    var $this = e.data.t, data = $this.data("globals");

	    keyPressed = 0;

	    if (e.which == 90) {
		$this.unbind("mousemove", methods.handleMouseZoom);
	    } else if (e.which == 32) {
		$this.unbind("mousemove", methods.handleMousePan);
	    }
	},

	handleMouseDown : function(e) {
	    if (keyPressed == 0) {
		e.preventDefault();
	    
		startX = e.pageX;
		startY = e.pageY;

		$(this).bind("mousemove", methods.handleDrag);
		cancelClick = 0;
	    } 
	},

	handleMouseUp : function(e) {
	    e.preventDefault();

	    if (keyPressed == 0) {
		$(this).unbind("mousemove", methods.handleDrag);
	    } 
	},

	handleMouseClick : function(e) {
	    if (keyPressed == 0) {
		e.preventDefault();

		var $this = $(this), data = $this.data("globals");
		
		var click_x = e.pageX;
		var click_y = e.pageY;
		
		var leftright = click_x/data.winwidth;		
		
		now = new Date().getTime();
		
		var delta = now - clickendtime;
		
		if (delta > 50) { // lock out a ghost touch end event by only executing if this was a human touch
		    if(!cancelClick) {
			if(zoomSearchMode == 1) {
			    methods.handleZoomSearch($(this));
			} else {
			    if(leftright > 0.5) {
				data.nextIndex = data.nextIndex + 1;
			    } else {
				data.nextIndex = data.nextIndex - 1;
			    }
			    
			    if (data.nextIndex < 0) {
				data.nextIndex = data.cache.length - 1;
			    } else {
				data.nextIndex = data.nextIndex % data.cache.length;		    
			    }
			    var picture = data.cache[data.nextIndex];
			    
			    var chk_iw = picture.width;
			    var chk_ih = picture.height;
			    
			    if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
				//$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
				$(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
				$(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
				$(this).data("globals").ctx.fillStyle="#FFFFFF";
				$(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
				$(this).data("globals").ctx.fillStyle="#000000";
			    }
			}
		    }
		}
		clickendtime = new Date().getTime();
	    }
	},
		
	handleMouseZoom : function(e) {
	    e.preventDefault();

	    var $this = $(this), data = $this.data("globals");

	    var drag_x = e.pageX;
	    var drag_y = e.pageY;
	    
	    var drag_dx = startX - drag_x;
	    var drag_dy = startY - drag_y;

	    var scaled = 1;

	    if (Math.abs(drag_dy) >= 1) {

		if (drag_dy < 0) {
		    scaled = 0.98;
		} else {
		    scaled = 1.02;
		}

		startY = drag_y;
		startX = drag_x;

		// New

		data.niw = (data.niw)*scaled;
		data.nih = (data.nih)*scaled;

		data.ix = data.ix + (data.oiw - data.niw)/2;
		data.iy = data.iy + (data.oih - data.nih)/2;

		data.oih = data.nih;
		data.oiw = data.niw;

		// Old
		/*data.ix = data.ix + (startX - data.ix)*(1-scaled);
		data.iy = data.iy + (startY - data.iy)*(1-scaled);

		data.niw = (data.niw)*scaled;
		data.nih = (data.nih)*scaled;

		data.oih = data.nih;
		data.oiw = data.niw;*/

		var picture = data.cache[data.nextIndex];
		
		var chk_iw = picture.width;
		var chk_ih = picture.height;
		
		if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
		    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		    $(this).data("globals").ctx.fillStyle="#FFFFFF";
		    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		    $(this).data("globals").ctx.fillStyle="#000000";
		}
	    }
	},

	handleDrag : function(e) {
	    e.preventDefault();

	    var $this = $(this), data = $this.data("globals");
	    cancelClick = 1;

	    var drag_x = e.pageX;
	    var drag_y = e.pageY;
	    
	    var drag_dx = startX - drag_x;
	    var drag_dy = startY - drag_y;
	    
	    if (Math.abs(drag_dy) >= 1) {
		
		startY = drag_y;
		startX = drag_x;

		if (drag_dy < 0) {
		    data.nextIndex = data.nextIndex + 1;
		} else {
		    data.nextIndex = data.nextIndex - 1;
		}

		if (data.nextIndex < 0) {
		    data.nextIndex = data.cache.length - 1;// - Math.abs(nextIndex);
		} else {
		    data.nextIndex = data.nextIndex % data.cache.length;		    
		}

		var picture = data.cache[data.nextIndex];

		var chk_iw = picture.width;
		var chk_ih = picture.height;

		if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
		    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		    $(this).data("globals").ctx.fillStyle="#FFFFFF";
		    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		    $(this).data("globals").ctx.fillStyle="#000000";
		}
	    }
	},
	
	handleStart : function(e) {
	    e.preventDefault();

    	    startX = e.originalEvent.touches[0].pageX;
    	    startY = e.originalEvent.touches[0].pageY;
	    cancelTap = 0;
	},
	
	handleMove : function(e) {
	    e.preventDefault();

	    var $this = $(this), data = $this.data("globals");

	    now = new Date().getTime();
		
	    var delta = now - touchendtime;

	    if (delta > 50) { // lockout a recent gesture end
	    
		cancelTap = 1;
		
		var x = e.originalEvent.touches[0].pageX;
		var y = e.originalEvent.touches[0].pageY;
		
		var dx = x - startX;
		var dy = y - startY;
		
		//alert("x: "+x+" y: "+y+" dx: "+dx+" dy: "+dy);
		
		//alert("Handle Move");
		
		if (e.originalEvent.touches.length == 2) {
		    
		    touchX1 = e.originalEvent.touches[0].pageX;
		    touchY1 = e.originalEvent.touches[0].pageY;
		    touchX2 = e.originalEvent.touches[1].pageX;
		    touchY2 = e.originalEvent.touches[1].pageY;
		    
		    if ((Math.abs(dy) >= 1) || (Math.abs(dx) >= 1)) {
			
			//alert("Handle two touches move");
			
			startX = x;
			startY = y;
			
			data.ix = data.ix+dx;
			data.iy = data.iy+dy;
			
			var picture = data.cache[data.nextIndex];
			
			var chk_iw = picture.width;
			var chk_ih = picture.height;
			
			if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
			    //alert("context");
			    //alert("OIH: "+$(this).data("globals").oih);
			    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
			    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
			    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
			    $(this).data("globals").ctx.fillStyle="#FFFFFF";
			    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
			    $(this).data("globals").ctx.fillStyle="#000000";
		    }
			//draw(cache[nextIndex]);
		    }
		}
		
		if (e.originalEvent.touches.length == 1) {
		    
		    if (Math.abs(dy) >= 1) { //can try for dy > 10 to get slower scaling
			//alert("Start X:"+startX+" Start Y: "+startY+" x: "+x+" y: "+y+" dx: "+dx+" dy: "+dy);
			//alert("Next Index: "+data.nextIndex);
			startY = y;
			startX = x;
			
			if (dy < 0) {
			    data.nextIndex = data.nextIndex + 1;
			} else {
			    data.nextIndex = data.nextIndex - 1;
			}
			//nextIndex = nextIndex + 1;
			if (data.nextIndex < 0) {
			    data.nextIndex = data.cache.length - 1;// - Math.abs(nextIndex);
			} else {
			    data.nextIndex = data.nextIndex % data.cache.length;		    
			}
			
		    var picture = data.cache[data.nextIndex];
			
			var chk_iw = picture.width;
			var chk_ih = picture.height;
			
			if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
			    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
			    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
			    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
			    $(this).data("globals").ctx.fillStyle="#FFFFFF";
			    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
			    $(this).data("globals").ctx.fillStyle="#000000";
			}
		    }
		}
	    }
	},

	handleZoomSearch : function(th) { // pass in 'this' globals object; o/w we have no access to it

	    var $this = th, data = $this.data("globals");
	    var applicable = false;
	    //alert("NIW: "+data.niw+" NIH: "+data.nih+" WinWidth: "+data.winwidth+" WinHeight: "+data.winheight+" IX: "+data.ix+" IY: "+data.iy);
	    if (data.niw > data.winwidth) {
		applicable = true;
		if (data.ix <= (data.winwidth - data.niw)) { // check for last X-view
		    data.ix = 0;
		    if (data.iy <= (data.winheight - data.nih)) { // check for last Y-view
			data.iy = 0;
		    } else if ((data.iy + data.nih - data.winheight) <= (data.winheight - 100)) { // check for penultimate Y-view
			data.iy = data.winheight - data.nih;
		    } else {
			data.iy = data.iy - (data.winheight - 100);
		    }
		} else if ((data.ix + data.niw - data.winwidth) <= (data.winwidth - 100)) { // check for penultimate X-view
		    data.ix = data.winwidth - data.niw;
		} else {
		    data.ix = data.ix - (data.winwidth - 100);
		}
	    } else if (data.nih > data.winheight) {
		applicable = true;
		if (data.iy <= (data.winheight - data.nih)) { // check for last Y-view
		    data.iy = 0;
		    if (data.ix <= (data.winwidth - data.niw)) { // check for last X-view
			data.ix = 0;
		    } else if ((data.ix + data.niw - data.winwidth) <= (data.winwidth - 100)) { // check for penultimate X-view
			data.ix = data.winwidth - data.niw;
		    } else {
			data.ix = data.ix - (data.winwidth - 100);
		    }
		} else if ((data.iy + data.nih - data.winheight) <= (data.winheight - 100)) { // check for penultimate Y-view
		    data.iy = data.winheight - data.nih;
		} else {
		    data.iy = data.iy - (data.winheight - 100);
		}
	    }

	    if (applicable) {
		var picture = data.cache[data.nextIndex];
		var chk_iw = picture.width;
		var chk_ih = picture.height;
		
		if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		    var shrinkby = 6;
		    var lw = 3;
		    var km_xo = data.winwidth-(data.winwidth/shrinkby + lw*2);
		    var km_yo = 10;
		    var km_w = data.winwidth/shrinkby;
		    var km_h = km_w*data.nih/data.niw;
		    var km_sqw;
		    var km_sqh;

		    if (data.winwidth > data.niw) {
			km_sqw = km_w-lw*2;
		    } else {
			km_sqw = km_w*(data.winwidth/data.niw)-lw*2;
		    }

		    if (data.winheight > data.nih) {
			km_sqh = km_h-lw*2;
		    } else {
			km_sqh = km_h*data.winheight/data.nih-lw*2;
		    }

		    th.data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		    th.data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		    th.data("globals").ctx.drawImage(picture,km_xo,km_yo,km_w,km_h);
		    th.data("globals").ctx.beginPath();
		    th.data("globals").ctx.rect(km_xo,km_yo,km_w,km_h);
		    th.data("globals").ctx.strokeStyle = 'white';
		    th.data("globals").ctx.lineWidth = lw;
		    th.data("globals").ctx.stroke();
		    th.data("globals").ctx.beginPath();
		    th.data("globals").ctx.rect(km_xo-(data.ix/data.niw)*km_w+lw,km_yo-(data.iy/data.nih)*km_h+lw,km_sqw,km_sqh);
		    th.data("globals").ctx.strokeStyle = 'orange';
		    th.data("globals").ctx.lineWidth = 1;
		    th.data("globals").ctx.stroke();
		    th.data("globals").ctx.fillStyle="#FFFFFF";
		    th.data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		    th.data("globals").ctx.fillStyle="#000000";
		}
	    } else {
		alert("You must be zoomed to make use of the Map tool.");
	    }
	},
	
	handleEnd : function(e) {
	    e.preventDefault();

	    var $this = $(this), data = $this.data("globals");
	    
	    var leftright = startX/data.winwidth;		
	    now = new Date().getTime();
	    
	    var delta = now - touchendtime;
	    
	    if (delta > 50) { // lock out a ghost touch end event by only executing if this was a human touch
		if(!cancelTap) {
		    if(zoomSearchMode == 1) {
			methods.handleZoomSearch($(this));
		    } else {		 
			if(leftright > 0.5) {
			    //currScroll += 50;
			    data.nextIndex = data.nextIndex + 1;
			} else {
			    //currScroll -= 50;
			    data.nextIndex = data.nextIndex - 1;
			}
			
			if (data.nextIndex < 0) {
			    data.nextIndex = data.cache.length - 1;
			} else {
			    data.nextIndex = data.nextIndex % data.cache.length;		    
			}
			var picture = data.cache[data.nextIndex];
			
			var chk_iw = picture.width;
			var chk_ih = picture.height;
			
			if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
			    //$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
			    $(this).data("globals").ctx.fillRect(0,0,this.width,this.height);
			    $(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
			    $(this).data("globals").ctx.fillStyle="#FFFFFF";
			    $(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
			    $(this).data("globals").ctx.fillStyle="#000000";
			}
		    }
		}
	    }
	    touchendtime = new Date().getTime();
	},

	handleGestureStart : function(e) {
	    //alert("Gesture Start...");
	},

	handleGestureChange : function(e) {
	    e.preventDefault();

	    var $this = $(this), data = $this.data("globals");

	    //var x1 = e.originalEvent.touches[0].pageX;
	    //var y1 = e.originalEvent.touches[0].pageY;
	    //var x2 = e.originalEvent.touches[1].pageX;
	    //var y2 = e.originalEvent.touches[1].pageY;
	    var xMid = 0; 
	    var yMid = 0; 

	    if (touchX1 > touchX2) {
		xMid = touchX2 + (touchX1-touchX2)/2;
	    } else {
		xMid = touchX1 + (touchX2-touchX1)/2;
	    }

	    if (touchY1 > touchY2) {
		yMid = touchY2 + (touchY1-touchY2)/2;
	    } else {
		yMid = touchY1 + (touchY2-touchY1)/2;
	    }

	    var scaled = 1;

	    if (e.originalEvent.scale > 1) {
		scaled = (1 - e.originalEvent.scale)/50;
	    } else {
		scaled = (1 - e.originalEvent.scale)/15;
	    }

	    //data.ix = data.ix + data.niw*scaled/2;
	    //data.iy = data.iy + data.nih*scaled/2;
	   
	    data.ix = data.ix + (xMid - data.ix)*scaled;
	    data.iy = data.iy + (yMid - data.iy)*scaled;
	    //alert("Scaled: "+scaled);
	    if (e.originalEvent.scale > 1) {
		scaled = 1 + Math.abs(scaled);		    
	    } else {
		scaled = 1 - Math.abs(scaled);
	    }
	    
	    data.niw = (data.niw)*scaled;
	    data.nih = (data.nih)*scaled;
	    data.oih = data.nih;
	    data.oiw = data.niw;
	    //alert("Scaled Abs: "+scaled+" New IX: "+data.ix+" New IY "+data.iy+" New Width "+data.niw+" New Height "+data.nih);
	    //ctx.fillRect(0,0,data.winwidth,data.winheight);
	    
	    var picture = data.cache[data.nextIndex];
		    
	    var chk_iw = picture.width;
	    var chk_ih = picture.height;
	    
	    if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		$(this).data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		$(this).data("globals").ctx.fillStyle="#FFFFFF";
		$(this).data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		$(this).data("globals").ctx.fillStyle="#000000";
	    }
	    
	    //ctx.drawImage(cache[nextIndex],ix,iy,niw,nih);
	    //ctx.fillStyle="#FFFFFF";
	    //ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
	    //ctx.fillStyle="#000000";
	},

	handleGestureEnd : function(e) {
	    touchendtime = new Date().getTime();
	},

	testFunction : function() {
	    alert("Test Function...");
	    var $this = $(this), data = $this.data("globals");
	    alert("Test Function Data Cache: "+data.cache);
	},

	destroy : function() {
	    var $this = $(this), data = $this.data("globals");
	    if (typeof data != "undefined") {
		data.cache = [];
		//alert("Data cache after: "+data.cache.length);
		data.remove();
		$this.removeData("globals");
	    }
	},

	resizeMooCanvas : function () {
            var prev_width = this.width;
            //var new_width = window.innerWidth;
            var new_width = window.innerWidth*0.6;
	    
	    this.width = new_width;
	    this.height = this.width;  // height = width (square) for now
	    //canvas.height = canvas.height * (new_width/prev_width);	

            methods.drawStuff($(this),this); 
	},

	drawStuff : function(th,domelem) {
	    var $this = th, data = $this.data("globals");
	    var picture = data.cache[data.nextIndex];
	    var chk_iw = picture.width;
	    var chk_ih = picture.height;
	    
	    if (chk_iw > 0 && chk_ih > 0) { //only process if the image is loaded
		//$(this).data("globals").ctx.fillRect(0,0,data.winwidth,data.winheight);
		$this.data("globals").ctx.fillRect(0,0,domelem.width,domelem.height);
		$this.data("globals").ctx.drawImage(picture,data.ix,data.iy,data.niw,data.nih);
		$this.data("globals").ctx.fillStyle="#FFFFFF";
		$this.data("globals").ctx.fillText(data.nextIndex+1+"/"+data.cache.length,10,20);
		$this.data("globals").ctx.fillStyle="#000000";
	    }
	}
    };

    $.fn.mooscan = function( method ) {

	// Create some globals in the name space for touch actions
	startX = 0;
	startY = 0;
	startGX = 0;
	startGY = 0;
	touchX1 = 0;
	touchY1 = 0;
	touchX2 = 0;
	touchY2 = 0;
	touchendtime = 0;
	clickendtime = 0;
	now = 0;
	cancelTap = 0;
	cancelClick = 0;
        keyPressed = 0;

	// Method calling logic
	if ( methods[method] ) {
	    return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
	    return methods.init.apply( this, arguments );
	} else {
	    $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
	} 
	
	return this.each(function() {
	});
    };

}) (jQuery);