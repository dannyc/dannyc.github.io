function slideUp(elem){
	elem.style.height = '100%';
	var nav = document.getElementById("nav");				
	nav.style.top = 0;
	nav.style.height = '100%';
	setTimeout(function(){
		var writings = document.getElementById("writings");
		writings.style.display = 'none';
	}, 300);
}