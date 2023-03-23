(function() {

	// Form Class.
	class ZI_Form {
		
		constructor(configurations) {

			console.log('ZI - Initializing...');
			let self = this;

			// Store configurations.
			this.configurations = configurations;
			
			// Initialize FormComplete Global.
			window._zi_fc = {};

			// Load ZI-TAG. If error occurs, remove Antiflicker.
			var zi = document.createElement('script');
			(zi.type = 'text/javascript'),
			(zi.async = true),
			(zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
			(zi.addEventListener('error', function(event) {
				
				console.warn('ZI - An error occured while loading zi-tag.', event);
				window.ZI_FormAF.destroy();
			
			})),
			document.body.appendChild(zi);

			// Add ready form event.
			window._zi_fc.onReady = function(data) {

				console.log('ZI - onReady event!', data);
				
				try {self.readyForm( data, this.formShorteningEnabled, this.formIframeWrapperSelector );}
				catch (err) {
					
					// If error occurs, remove antiflicker.
					window.ZI_FormAF.destroy();
					console.warn("\nZI - An error occured.\n", err);
					
				}
			}

			// Add update form event.
			window._zi_fc.onMatch = function(data) {self.updateForm(data);}

		}

		// Get context for form.
		getContext(e) {
			
			if ( this.formIframeWrapperSelector && this.formIframeWrapperSelector.length > 0 ) {
				var iframes = document.getElementsByClassName(this.formIframeWrapperSelector);
				if(iframes) {
					for( var i=0; i < iframes.length; i+=1 ) {
						if( iframes[i].contentDocument.querySelector(e) )
							return iframes[i].contentDocument;
					}
				}
			}

			return document;

		}

		// Find the field containing element.
		findContainer(e) {
			
			const fieldContainer = this.configurations.fieldContainer;
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
		readyForm( data, formShorteningEnabled, formIframeWrapperSelector ) {

			// Store properties.
			this.formShorteningEnabled = formShorteningEnabled;
			this.formIframeWrapperSelector = formIframeWrapperSelector;
			this.formInputs = [];

			// Store context where form resides. This searches sourceless iframes as well.
			this.context = this.getContext(data.formSelector);

			// Is form shortening enabled?
			if (formShorteningEnabled) {

				// Ready each field that can be found using mapped selectors.
				data.inputs.forEach((input) => {
					const field = this.context.querySelector( data.formSelector + ' '+ input );
					if (!field) {console.warn('ZI - Unable to find field', data.formSelector, input);}
					else {this.readyField( field, input );}
				});

			}

			// All fields ready, now remove Antiflicker.
			window.ZI_FormAF.destroy();
			
			console.log('ZI - Ready!');
			
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
			
			// Find container of field.
			const fieldContainer = this.findContainer(field);
					
			// Hide field & any containers.
			fieldContainer.style.display = 'none';

			// Store field details.
			const fieldID = input.match(/name=['"']([.\-\w]+)['"']/)[1];
			this.formInputs.push({[fieldID]:{ selector:input, fieldContainer:fieldContainer }});

		}
		
		// Update mapped field that is not email nor an excluded field in configurations. If an element is hidden by end-user and is excluded, we will not unhide element spite it being hidden + unpopulated with data, end-user will need to unhide with their own logic if excluded. 
		updateField(field) {

			// If field is displayed, ignore.
			if ( field.style.display != 'none' ){return;}

			// Display field.
			field.style.display = '';

		}
		
	}

	// Antiflicker Class.
	class ZI_FormAF {
		
		constructor() {
			const af = document.createElement('style');
			(af.id = 'ZI_AF'),
			(af.innerHTML = `${window.ZIConfigurations.formSelector} {visibility:hidden !important;}`),
			document.head.appendChild(af);
		}
		
		destroy() {
			const ZI_AF = document.getElementById('ZI_AF');
			if (ZI_AF){ZI_AF.remove();}
		}
		
	}

	// Add Antiflicker.
	window.ZI_FormAF = new ZI_FormAF();

	// Wait for page to load.
	document.addEventListener('DOMContentLoaded', function() {
		
		// Is dynamicForm enabled?
		if (window.ZIConfigurations.dynamicForm) {

			// Define mutation observer 
			const formWatch = function(mutationsList, observer) {
				const formSelection = document.querySelector(window.ZIConfigurations.formContainer + ' ' + window.ZIConfigurations.formSelector);
				// IF form is found, initialize it and stop observer.
				if (formSelection) {
					window.ZI_Form = new ZI_Form(window.ZIConfigurations);
					observer.disconnect();
				}
			};
			
			// Define form container to watch.
			const watchContainer = document.querySelector(window.ZIConfigurations.formContainer);

			// If container is found then create observer with formWatch callback and watch for mutations.
			if (watchContainer) {
				const observer = new MutationObserver(formWatch);
				observer.observe(watchContainer, {childList:true});
			} else {
				console.warn("\nZI - Form container ("+ window.ZIConfigurations.formContainer +") not found. Please ensure container exists on load.\n");
			}

		} else {
			
			// Initialize Form.
			window.ZI_Form = new ZI_Form(window.ZIConfigurations);
			
		}

	// Remove listener after running once.
	}, { once:true, capture:true });

})();
