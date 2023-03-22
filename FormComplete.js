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
		fieldContainer: 'fieldx',
		excludedFields: ['name2', 'notreal']  // id, name or class
	}
	
	// Project key. Get this value from FormComplete.
	window.ZIProjectKey = "0281657f921669107410"; 

	// Form Class.
	class ZI_Form {
		
		constructor( data, configurations, formShorteningEnabled ) {

			console.log('ZI - Initializing...');
			
			// Store configurations.
			this.configurations = configurations;
			this.formShorteningEnabled = formShorteningEnabled;
			this.formInputs = [];

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
		getContext(e) {
			
			// formIframeWrapperSelector "iframe.hs-form-iframe"
			
			// !!! Will need to update logic to handle any iframes Current logic only for HubSpot iframes.
			var iframes = document.getElementsByClassName('hs-form-iframe');
			if(iframes) {
				for( var i=0; i < iframes.length; i+=1 ) {
					if( iframes[i].contentDocument.querySelector(e) )
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

			// Was fieldContainer set?
			if (fieldContainer.length !== 0) {
				
				// Check if fieldContainer value is present in ID, Name or Class.
				if (['id', 'name', 'class'].some(identifier => p.hasOwnProperty(identifier) && p[identifier] && p[identifier].includes(fieldContainer) || p.classList.contains(fieldContainer))) {return p;}

				// Recursively look for container and return results if found.
				const x = this.findContainer(p);
				if (x){return x;}

			}
			
			// No field container set. Hide field only.
			return e;
			
		}

		// Ready form.
		readyForm(data) {
			
			// Is form shortening enabled?
			if (this.formShorteningEnabled) {

				// Ready each field that can be found using mapped selectors.
				data.inputs.forEach((input) => {
					const field = this.context.querySelector( data.formSelector + ' '+ input );
					if (!field) {console.warn('ZI - Unable to find field', data.formSelector, input);}
					else {this.readyField( field, input );}
				});

			}

			// Remove Antiflicker.
			this.context.getElementById('ZI_AF').remove();
			
			console.log('ZI - Ready.');
			
		}
		
		// Update form when match found.
		updateForm(data) {
			
			// Is form shortening enabled?
			if (!this.formShorteningEnabled) {return;}

			// Loop through each mapped field.
			for (const fieldID in data) {
				
				// Skip fields that are populated.
				if (typeof data[fieldID] !== 'undefined') {continue;}
				
				// Get field object.
				const input = this.formInputs.find(obj => obj.hasOwnProperty(fieldID));
				if (input) {
					
					// Get field container.
					const fieldContainer = input[fieldID].fieldContainer;
					if (!fieldContainer) {console.warn('ZI - Unable to find field container', fieldID);return;}
			
					// Update field.
					this.updateField(fieldContainer);

				}
				
			}

		}

		// Hide mapped field that is not email nor an excluded field in configurations.
		readyField( field, input ) {
			
			// Analyze field.
			const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
			const ignoredType = field.hasAttribute('type') && [ 'reset', 'button', 'submit', 'hidden', 'radio', 'checkbox' ].includes(field.getAttribute('type').toLowerCase());
			const isEmail = ['id', 'name', 'class'].some(identifier => field[identifier] && field[identifier].includes('email') || field.classList.contains('email'));
			const isExcluded = this.configurations.excludedFields.includes(field.id) || this.configurations.excludedFields.includes(field.name) || field.classList.contains(this.configurations.excludedFields);

			// Should field be displayed?
			if (isField && !ignoredType && !isEmail && !isExcluded) {
				
				// Find container of field.
				const fieldContainer = this.findContainer(field);
					
				// Hide field & any containers.
				fieldContainer.style.display = 'none';

				// Store field details.
				const fieldID = input.match(/name='(\w+)'/)[1];
				this.formInputs.push({[fieldID]:{ selector:input, fieldContainer:fieldContainer }});
					
			}
			
		}
		
		// Update mapped field that is not email nor an excluded field in configurations. If an element is hidden by end-user and is excluded, we will not unhide element spite it being hidden + unpopulated with data, end-user will need to unhide with their own logic if excluded. 
		updateField(field) {

			// If field is displayed, ignore.
			if ( field.style.display != 'none' ){return;}

			// Display field.
			field.style.display = '';

		}
		
	}

	// Antiflicker.
	const s = document.createElement('style');
	(s.id = 'ZI_AF'),
	(s.innerHTML = `${window.ZIConfigurations.formSelector} {opacity:0 !important;}`),
	document.head.appendChild(s);

    // Initialize FormComplete Global.
    window._zi_fc = {};
	
	// Initialize when ready.
	window._zi_fc.onReady = function(data) {
		try {window.ZI_Form = new ZI_Form( data, window.ZIConfigurations, this.formShorteningEnabled );}
		catch (err) {
			// If error occurs during instantiation, remove antiflicker.
			const ZI_AF = document.getElementById('ZI_AF');
			if (ZI_AF){ZI_AF.remove();}
			console.warn('ZI - An error occured.', err);
		}
	}

	// Listen for ZI API matches.
	window._zi_fc.onMatch = function(data) {window.ZI_Form.updateForm(data);}

	// Wait for content to complete loading.
	document.addEventListener('DOMContentLoaded', function() {

		// Load FormComplete logic.
		var zi = document.createElement('script');
		(zi.type = 'text/javascript'),
		(zi.async = true),
		(zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
		document.body.appendChild(zi);

	}, { once:true, capture:true });
	
})();
