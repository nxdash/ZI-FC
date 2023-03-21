(function() {
	
	/** Configurations
	 *  
	 *   formSelector
	 *		query selector value, example #FormID, .FormClass, Form[Attribute=Value]; This is used to locate the form within a document.
	 *		This value must be populated if form flicker is occuring.
	 *  
	 *   dynamicForm
	 *		boolean; Does the form not exist when the page initially loads? If true, we can apply our logic automatically when the form appears within the formContainer element.
	 *  
	 *   formContainer
	 *		query selector value, example #FormContainerID, .FormContainerClass, FormContainer[Attribute=Value]; Only used if dynamicForm is true. We will observe this element until the desired form has loaded.
	 *  
	 *   excludedFields
	 *		text value(s); specify 1 or more fields to exclude from form shortenting logic. By default all input and select fields except for email will be hidden, and all hidden fields that are not populated on email match will be unhidden.
	 *   
	 */
	window.ZIConfigurations = {
		dynamicForm: false,  // set to true if form does not exist imediatly in document.
		formSelector: '#example1',
		formContainer: 'body',
		fieldContainer: '',
		excludedFields: ['name2', 'notreal']  // id, name or class
	}
	
	// Project key. Get this value from FormComplete.
	window.ZIProjectKey = "0281657f921669107410"; 


	// Form Class.
	class ZI_Form {
		
		constructor( data, configurations, formShorteningEnabled ) {

			console.log('ZI - Initializing...', data, configurations, formShorteningEnabled );
			
			// Store configurations.
			this.configurations = configurations;

			// Store context where form resides. This searches sourceless iframes as well.
			this.context = this.getContext(data.formSelector);
			
			// Dynamic enabled?
			if (this.configurations.dynamicForm) {
				
				// Define Mutation Observer 
				const formWatch = function(mutationsList, observer) {
					for(const mutation of mutationsList) {
						if (mutation.type === 'childList') {
							for (const e of mutation.addedNodes) {
								if (e.tagName.toLowerCase() === 'form') {
									
									console.log('ZI - Form added to ' + this.configurations.formContainer + '.');

									// Maybe check here... data.formSelector == e.id || ...
									this.readyForm( data, formShorteningEnabled );
									
									// Stop observer.
									observer.disconnect();

								}
							}
						}
					}
				};
				
				const watchContainer = this.context.querySelector(this.configurations.formContainer);// using form context... hope things play nice...
				if ( watchContainer !== null ) {

					// Create observer instance linked to formWatch callback
					const observer = new MutationObserver(formWatch);

					// Start observing formContainer for mutations.
					observer.observe( watchContainer, {childList:true} );

				} else {

					console.warn('ZI - Form container ('+ this.configurations.formContainer +') not found. Recommended default: body');

				}

			}
			else {
			
				// Ready form.
				this.readyForm( data, formShorteningEnabled );
			
			}

		}

		// Get context for form.
		getContext(selector) {
			
			// formIframeWrapperSelector "iframe.hs-form-iframe"
			
			var iframes = document.getElementsByClassName('hs-form-iframe');
			if(iframes) {
				for( var i=0; i < iframes.length; i+=1 ) {
					if( iframes[i].contentDocument.querySelector(selector) )
						return iframes[i].contentDocument;
				}
			}
			
			return document;
			
		}

		// Find the field containing element.
		findContainer(e) {
			
			const fieldContainer = window.ZIConfigurations.fieldContainer;
			const p = e.parentElement;

			// If parent is null, findContainer reached top of DOM, do not use as container.
			if (!p) {return false;}

			// Was fieldContainer configuration set?
			if (fieldContainer.length !== 0) {

				if (
					(fieldContainerExact && ['id', 'name', 'class'].some(identifier => p[identifier] === fieldContainer || p.getAttribute('class').toString().trim() == fieldContainer)) || // Check if fieldContainer value matches the ID, Name or Class. 
					(!fieldContainerExact && ['id', 'name', 'class'].some(identifier => p.hasOwnProperty(identifier) && p[identifier] && p[identifier].includes(fieldContainer) || p.classList.contains(fieldContainer))) // Check if fieldContainer value is present in ID, Name or Class.
				) {return p;}

				return this.findContainer(p);

			} else {
				
				// Hide the furthest parent node from the field with a single child element, excluding label.
				const c = p.children, n = c.length;
				if (n == 1 || (n == 2 && c[0].tagName.toLowerCase() == 'label')) {return this.findContainer(p);}
				return e;
			}
			
		}

		// Ready form when form is loaded.
		readyForm( data, formShorteningEnabled ) {
			
			console.log('ZI - Readying Form.');
			
			// Is formShorteningEnabled true? If so, continue, otherwise just remove Antiflicker.
			if (formShorteningEnabled) {

				data.inputs.forEach((input) => {
					const field = this.context.querySelector( data.formSelector + ' '+ input );
					if (!field) {console.warn('Unable to find field', data.formSelector, input);return;}
					this.readyField( field, input, data );
				});
			}

			// Remove Antiflicker.
			this.context.getElementById('ZI_AF').remove();
			
		}
		
		// Update form when a match is found by ZI API.
		updateForm( data, formShorteningEnabled ) {
			
			console.log('ZI - Updating form...', data, formShorteningEnabled );

			if (!formShorteningEnabled) {return;}

			data.inputs.forEach((input) => {
				const field = this.context.querySelector(data.formSelector+' '+input);
				if (!field) {console.warn('Unable to find field', data.formSelector, input);return;}
				this.updateField( field, input, data );
				
			});

		}

		// Hide mapped field that is not email nor an excluded field in configurations.
		readyField( field, input, data ) {
			
			console.log('ZI - Readying Field.', field, input, data );
			
			// Analyze field.
			const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
			const ignoredType = field.hasAttribute('type') && [ 'reset', 'button', 'submit', 'hidden', 'radio' ].includes(field.getAttribute('type').toLowerCase());//! should radio be excluded?
			const isEmail = ['id', 'name', 'class'].some(identifier => field[identifier] && field[identifier].includes('email') || field.classList.contains('email'));
			const isExcluded = this.configurations.excludedFields.includes(field.id) || this.configurations.excludedFields.includes(field.name) || field.classList.contains(this.configurations.excludedFields);

			if (isField && !ignoredType && !isEmail && !isExcluded) {
				const fieldContainer = this.findContainer(field);
				if (fieldContainer) {fieldContainer.style.display = 'none';}
				else {console.warn('ZI - Field Container not found.', field);}
			}
			
		}
		
		// Update mapped field that is not email nor an excluded field in configurations. If an element is hidden by end-user and is excluded, we will not unhide element spite it being hidden + unpopulated with data, end-user will need to unhide with their own logic if excluded. 
		updateField( field, input, data ) {
			
			console.log('ZI - Updating Field.', field, input, data );

			// If field populated, ignore.
			if ( data[input] != undefined ) {return;}

			// Find field container.
			const fieldContainer = this.findContainer(field);
			if (!fieldContainer) {
				console.warn('ZI - Field Container not found.', field);
				return;
			}

			// If field is displayed, ignore.
			if ( fieldContainer.style.display != 'none' ){return;}

			// Analyze field.
			const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
			const ignoredType = field.hasAttribute('type') && [ 'reset', 'button', 'submit', 'hidden', 'radio' ].includes(field.getAttribute('type').toLowerCase());//! should radio be excluded?
			const isExcluded = this.configurations.excludedFields.includes(field.id) || this.configurations.excludedFields.includes(field.name) || field.classList.contains(this.configurations.excludedFields);

			// Field was not populated and is not excluded, display it.
			if ( isField && !ignoredType && !isExcluded ) {fieldContainer.style.display = '';}

		}
		
	}

    // Initialize FormComplete Global.
    window._zi_fc = {};
	
	// Initialize when ready.
	window._zi_fc.onReady = function(data) {window.ZI_Form = new ZI_Form( data, window.ZIConfigurations, this.formShorteningEnabled, this.isDevelopmentMode );}
	
	// Listen for ZI API matches.
	window._zi_fc.onMatch = function(data) {window.ZI_Form.updateForm( data, this.formShorteningEnabled );}

	// Antiflicker.
	const s = document.createElement('style');
	(s.id = 'ZI_AF'),
	(s.innerHTML = `${window.ZIConfigurations.formSelector} {opacity:0 !important;}`),
	document.head.appendChild(s);
	
	
	// Wait for content to complete loading.
	document.addEventListener('DOMContentLoaded', function() {

		// Load FormComplete logic.
		var zi = document.createElement('script');
		(zi.type = 'text/javascript'),
		(zi.async = true),
		(zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
		document.body.appendChild(zi);

		// Remove Antiflicker - Fallback.
		setTimeout( function(){
			const ZI_AF = document.getElementById('ZI_AF');
			if (ZI_AF){ZI_AF.remove();}
		}, 1500 );

	}, { once:true, capture:true });
	
	console.log('ZI - FormComplete snippet loaded.');
	
})();
