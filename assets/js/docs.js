$(function(){
	var resizeSubNav = function() {
		$('#subnav').height( $(window).height() - 80 );
	};

	$(window).resize( resizeSubNav );
	resizeSubNav();
	
	$('#content a[name]').each(function(){
		$(this).attr( 'name', '_' + $(this).attr( 'name' ) );
	});

	$('.overview a').click(function( e ){
		scrollTo( $(this).attr( 'href' ) );
	});

	var scrollTo = function( href ) {
		var target = $( 'a[name="_' + href.substr( 1 ) + '"]' );

		$('.target').removeClass( 'target' );
		$('a.active').removeClass( 'active' );
		$('a[href="' + href + '"]' ).addClass('active');
		target.parents( '.section' ).addClass( 'target' );
		
		$('body, html').animate({
			scrollTop: target.offset().top - 30
		}, 500 );
	};

	if( document.location.hash ) {
		scrollTo( document.location.hash );
	}
});

