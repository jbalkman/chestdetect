
// Kick off the jQuery with the document ready function on page load
/*$(document).ready(function(){
    alert("Trigger Image Preview..");
    imagePreview();
});*/

$(function() {
// Configuration of the x and y offsets
    xOffset = -20;
    yOffset = 40;		
		
    $("a.predownload").hover(function(e){
        this.t = this.title;
        this.title = "";	
	var c = (this.t != "") ? "<br/>" + this.t : "";
        $("body").append("<p id='predownload'><img src='"+ this.id +"' width='250' alt='Image preview' />"+ c +"</p>");								 
        $("#predownload").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px").fadeIn("slow");
    },
	
    function(){
        this.title = this.t;
        $("#predownload").remove();

    });	
	
    $("a.predownload").mousemove(function(e){
        $("#predownload").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px");
    });			
});