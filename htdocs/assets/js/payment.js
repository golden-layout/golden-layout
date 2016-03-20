$(function(){

	var isSingleDomainLicense;

	/**
	 * Validate the forms input fields
	 *
	 * @param   {jQuery Element} form
	 *
	 * @returns {Boolean}
	 */
	var isValid = function( form ) {
		var inputGroups = form.find( '.inputGroup' ), 
			isValid = true,
			inputGroup, 
			i;

		for( i = 0; i < inputGroups.length; i++ ) {
			inputGroup = $( inputGroups[ i ] );
			
			if( $.trim( inputGroup.find( 'input' ).val() ).length === 0 ) {
				inputGroup.addClass( 'error' );
				isValid = false;
			} else {
				inputGroup.removeClass( 'error' );
			}
		}

		return isValid;
	};

	var makePayment = function() {
		var data;

		if( isSingleDomainLicense ) {
			data = {
				description: 'GoldenLayout Single Domain License',
				amount: 9900
			};
		} else {
			data = {
				description: 'GoldenLayout Multi Domain License',
				amount: 39900
			};
		}

		handler.open( data );
	};


	var sendPayment = function( token ) {
		modal
			.setContent( '' )
			.setTitle( 'Processing Payment...' )
			.setLoading( true )
			.show();

		var url, data = {};

		if( document.location.href.indexOf('localhost') === -1 ) {
			url = 'https://frozen-anchorage-5911.herokuapp.com/purchase/';
		} else {
			url = 'http://localhost:5000/purchase/';
		}
		
		if( isSingleDomainLicense ) {
			url += '07f3459c-639d-41af-9a59-f05299b27180';
			data.customerName = $.trim( $( '#singleDomainLicense [name="company"]' ).val() );
			data.websiteUrl = $.trim( $( '#singleDomainLicense [name="websiteUrl"]' ).val() );
		} else {
			url += 'f1b32607-7615-407a-b242-cc26216da54b';
			data.customerName = $.trim( $( '#multiDomainLicense [name="company"]' ).val() );
		}

		data.stripeToken = token.id;
		data.created = token.created;
		data.email = token.email;

		$.ajax({
			method: 'POST',
			url: url,
			data: data,
			success: onLicenseResponse,
			error: onRequestError
		});

	};

	var onLicenseResponse = function( responseText ) {

		modal.setTitle( 'loading license...' );

		var data = JSON.parse( responseText ),
			element = $( '.templateContainer .purchaseSuccess' ).clone(),
			link = $( 'a[data-licenseId=' + data.product.id + ']' );

		element.find( '.email' ).html( data.license.email );
		element.find( '.licenseType' ).html( link.attr( 'title' ) );
		element.find( '.licenseKey' ).html( data.license.key );
		element.find( '.licenseUrl' ).html( data.license.url );
		element.find( '.downloadLink' ).attr( 'href', link.attr( 'href' ) );

		element.find( '.closeModal' ).click(function( e ){
			e.preventDefault();
			modal.close();
		});

		$.get( link.attr( 'href' ), function( licenseText ){
			element.find( '.yourLicense' ).html( licenseText );

			modal
				.setContent( element )
				.setTitle( 'Purchase successful' )
				.setLoading( false );
		});
	};

	var onRequestError = function( xhr, type, message ) {

		var error, template;

		try{
			error = JSON.parse( xhr.responseText );
		} catch( e ) {
			error = {
				token: 'none',
				charged: false,
				message: xhr.responseText
			};
		}

		if( error.charged === true ) {
			template = $( '.templateContainer .purchaseErrorCharged' ).clone();
		} else {
			template = $( '.templateContainer .purchaseErrorNotCharged' ).clone();
		}

		template.find( '.stripeToken' ).text( error.token );
		template.find( '.errorMessage' ).text( error.message );
		
		modal
			.setContent( template )
			.setTitle( 'Error' )
			.setLoading( false );
	};


	var handler = StripeCheckout.configure({
		key: 'pk_live_4OUzQGqD6brsKJhD1CKNj3dS', //'pk_test_4OUzlBtu1YsKrRACe8jOjzfX',
		image: $( '#stripeImage' ).attr( 'src' ),
		name: 'Golden Layout',
		allowRememberMe: false,
		token: sendPayment,
		currency: 'GBP'
	});

	$( 'form' ).submit(function( e ){
		e.preventDefault();
		
		if( isValid( $( this ) ) ) {
			isSingleDomainLicense = $(this).attr( 'id' ) === 'singleDomainLicense';
			makePayment();
		}
	});


	/**
	 * Read License
	 */
	$( 'a.readLicense' ).click(function( e ){
		e.preventDefault();

		modal
			.setLoading( true )
			.setTitle( $(this).attr( 'title' ) )
			.show();

		$.get( $(this).attr( 'href' ), function( result ){
			modal
				.setLoading( false )
				.setContent( '<pre class="licenseText">' + result + '</pre>' );
		});
	});
});
