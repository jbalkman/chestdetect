$(function(){
    var dropbox = $('#dropbox'),
    message = $('.message', dropbox);
    curr_file = []; // set global variable to null and flag error if process button is pressed prior to uploading a mammogram

    dropbox.filedrop({
	paramname: 'file',
	maxfiles: 200,
    	maxfilesize: 30,
	url: '/upload',
	uploadFinished:function(i, file, response) { // i = index (from filedrop), which I think represents the file # out of a stack
	    $.data(file).addClass('done');
	    /*alert("Upload finished: "+response.file);
	    var img = new Image();
	    img.src = "/serve_img?file="+response.file;
	    img.onload = function () {
		alert("Image source: "+img.src);
		context.drawImage(img, 0, 0, 100, 100);
		alert("Context: "+context);
	    }*/
	    
	    curr_file = response.file;
	    
	    //alert("My curr file = "+curr_file);
	},
	
    	error: function(err, file) {
	    switch(err) {
	    case 'BrowserNotSupported':
		showMessage('Your browser does not support HTML5 file uploads!');
		break;
	    case 'TooManyFiles':
		alert('Too many files! Please select ' + this.maxfiles + ' at most!');
		break;
	    case 'FileTooLarge':
		alert(file.name + ' is too large! The size is limited to ' + this.maxfilesize + 'MB.');
		break;
	    default:
		break;
	    }
	},
	
	beforeEach: function(file){
	    if(!(file.type.match(/^image\//) || file.type.match(/dicom/))){
		alert('Only images are allowed!');
		return false;
	    }
	},
	
	// len = is the total number of files
	// file = the object file
	// i = the current file index, starting from (len - 1) and counting down to zero
	uploadStarted:function(i, file, len){ // consider i > 1, then don't create a new image, or just change the picture of the current preview
	    //alert("Index: "+i+" File: "+file+" Len: "+len);
	    if (i < len-1) {
		appendImage(file); // used for a stack, in which case don't create another preview image
	    } else {
		createImage(file);
	    }
	},
	
	progressUpdated: function(i, file, progress) {
	    $.data(file).find('.progress').width(progress);
	}
    });
    
    var template = '<div class="preview">'+
	'<span class="imageHolder">'+
	'<img />'+
	'<span class="uploaded"></span>'+
	'</span>'+
	'<div class="progressHolder">'+
	'<div class="progress"></div>'+
	'</div>'+
	'</div>';
    
    function createImage(file){
	
	var preview = $(template), 
	image = $('img', preview);
	
	var reader = new FileReader();
	
        image.width = 100;
	image.height = 100;
	
	reader.onload = function(e){
	    image.attr('src',e.target.result);
	};
	
	reader.readAsDataURL(file);
	
	message.hide();
	preview.appendTo(dropbox);
	
	$.data(file,preview);
    }
    
    function appendImage(file){
	
	image = $('img', dropbox); // fix later to make more specific as this could refer to any image within the dropbox
	//alert("Image object: "+image);
	var reader = new FileReader();
	
	reader.onload = function(e){
	    image.attr('src',e.target.result);
	};
	
	reader.readAsDataURL(file);
	
	message.hide();
    }

    function showMessage(msg){
	message.html(msg);
    }
    
});