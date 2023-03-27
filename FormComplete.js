(function() {

	// Form Class.
	class ZI_Form {

		constructor() {

			let self = this;

			// Store properties.
			this.consoleErrorStyle	= 'color:#FF0000;font-size:14px;line-height:24px;';
			this.consoleInfoStyle	= 'color:#AAAAAA;font-size:14px;line-height:24px;';
			this.configurations = window.ZIConfigurations || {
				formIframe: '',
				eventForm: false,
				formContainer: '',
				formSelector: '',
				fieldContainer: ''
			};

			console.log(`%cZI - Initializing...\n${JSON.stringify(this.configurations)}`, this.consoleInfoStyle);
			
			// Initialize FormComplete Global.
			window._zi_fc = {};

			// Check endpoint.
			this.checkEndpoint();

			// Wait for document / iframe to complete loading.
			document.addEventListener('DOMContentLoaded', function() {
	
				// Is eventForm enabled?
				if (self.configurations.eventForm && self.configurations.eventForm == true) {self.observer();}
				else {self.ready();}

			// Remove listener after running once.
			}, { once:true, capture:true });

		}

		observer() {
			
			console.log("%cZI - Waiting for form...", this.consoleInfoStyle);

			let self = this;

			// Define mutation observer 
			const formWatch = function(mutationsList, observer) {
				const formSelection = document.querySelector(window.ZIConfigurations.formContainer + ' ' + window.ZIConfigurations.formSelector);
				// IF form is found, initialize it and stop observer.
				if (formSelection) {
					self.ready();
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
				console.log("%cZI - Form container ("+ window.ZIConfigurations.formContainer +") not found. Please ensure container exists on load.\n", self.consoleErrorStyle);
			}

		}
		
		ready() {
			
			let self = this;

			// Load zi-tag.
			var zi = document.createElement('script');
			(zi.type = 'text/javascript'),
			(zi.async = true),
			(zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
			(zi.addEventListener('error', function(event) {
				window.ZI_FormAF.destroy();
				console.log("%cZI - An unexpected error occured.", this.consoleErrorStyle);
			})),
			document.body.appendChild(zi);

			// Add ready form event.
			window._zi_fc.onReady = function(data) {self.readyForm( data, this.formShorteningEnabled, this.formIframeWrapperSelector );}

			// Add update form event.
			window._zi_fc.onMatch = function(data) {self.updateForm(data);}

		}
		
		// Check endpoint. If any issues occur, remove Antiflicker.
		async checkEndpoint() {
			
			const ZI_TAG_BACKEND_URL=window.ZITagEnv==="dev"?"https://js-staging.zi-scripts.com/unified/v1/master/getSubscriptions":"https://js.zi-scripts.com/unified/v1/master/getSubscriptions";
			var errors = '';
			
			try {
				
				let response=await fetch(ZI_TAG_BACKEND_URL,{method:"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+window.ZIProjectKey}});

				if ( response.status!==200){errors += "Response Status: " + response.status + "\n";}
				const data=await response.json();
				if (!data){errors += "Data not set.\n";}
				if (!data.subscriptions){errors += "Subscriptions not set/valid. Ensure ZIProjectKey is correct and subscription is active.\n";}
				if (data.err === true){errors += "Error received: " + data.errMessage + "\n";}

			} catch(e) {errors += "Error received: " + e + "\n";}
			
			if ( errors != '' ) {
				window.ZI_FormAF.destroy();
				console.log("%cZI - An unexpected error occured.\n" + errors.replace(/\n$/, ''), this.consoleErrorStyle);
			}

		}

		// Get context for form.
		getContext() {

			// Note: Using contentWindow.document instead of contentDocument for more browser compatibility.

			if (this.formSelector && this.formSelector.length > 0) {
				if ( this.configurations.formIframe && this.configurations.formIframe.length > 0) {
					var iframe = document.querySelector( this.configurations.formIframe );
					if (iframe) {
						var iframeForm = iframe.contentWindow.document.querySelector(this.formSelector);
						if (iframeForm) {return iframe.contentWindow.document;}
					}
				}

				if ( this.formIframeWrapperSelector && this.formIframeWrapperSelector.length > 0 ) {
					var iframes = document.querySelectorAll(this.formIframeWrapperSelector);
					for (var i=0; i < iframes.length; i++) {
						var iframe = iframes[i];
						var iframeForm = iframe.contentWindow.document.querySelector(this.formSelector);
						if (iframeForm) {return iframe.contentWindow.document;}
					}
				}
			}

			return document;

		}

		// Find the field containing element.
		findContainer(e) {
			
			// If field container not specified in configurations, hide only field.
			if (!this.configurations.fieldContainer || this.configurations.fieldContainer.length == 0) {return e;}
			
			// Attempt to locate field container.
			const fieldContainer = e.closest(this.configurations.fieldContainer);
			
			// If container found, return it.
			if (fieldContainer) {return fieldContainer;}
			
			// Container not found, return field.
			return e;

		}

		// Ready form.
		readyForm( data, formShorteningEnabled, formIframeWrapperSelector ) {

			console.log("%cZI - Readying form...", this.consoleInfoStyle);
			
			// Store properties.
			this.formShorteningEnabled = formShorteningEnabled;
			this.formIframeWrapperSelector = formIframeWrapperSelector;
			this.formFields = [];
			this.formSelector = this.configurations.formSelector?.trim() ?? data.formSelector;
			this.context = this.getContext();

			try {

				// Is form shortening enabled?
				if (formShorteningEnabled) {

					// Ready each field found using mapped selectors.
					data.inputs.forEach((input) => {
						const field = this.context === document ? this.context.querySelector(this.formSelector+' '+input) : this.context.querySelector(input);
						if (!field) {console.log(`%cZI - Unable to find field.\n${this.formSelector}\n${input}`, this.consoleErrorStyle);}
						else {this.readyField( field, input );}
					});

				}
			
			} catch (err) {
				window.ZI_FormAF.destroy();
				console.log(`%cZI - An error occured.\n${err}`, this.consoleErrorStyle);
			}

			// All fields ready, now remove Antiflicker.
			window.ZI_FormAF.destroy();
			
			console.log("%cZI - Ready!", this.consoleInfoStyle);
			
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
				const input = this.formFields.find(obj => obj.hasOwnProperty(fieldID));
				if (input) {
					
					// Get field container.
					const fieldContainer = input[fieldID].fieldContainer;
					if (!fieldContainer) {console.log(`%cZI - Unable to find field container. Field ID: ${fieldID}`, this.consoleErrorStyle);return;}
			
					// Update field.
					this.updateField(fieldContainer);

				}
				
			}

		}

		// Hide mapped field that is not email nor an excluded field in configurations.
		readyField( field, input ) {
			
			// Find container of field.
			const fieldContainer = this.findContainer(field);
			
			// Hide field & any containers if field does not have zi_alwaysShow class.
			if (!field.classList.contains('zi_alwaysShow')) {fieldContainer.style.display = 'none';}

			// Store field details.
			const fieldID = input.match(/name=['"]([\w/.-]+)['"]/)[1];
			this.formFields.push({[fieldID]:{ selector:input, fieldContainer:fieldContainer }});

		}
		
		// Update mapped field that is not email nor an excluded field in configurations. If an element is hidden by end-user and is excluded, we will not unhide element spite it being hidden + unpopulated with data, end-user will need to unhide with their own logic if excluded. 
		updateField(e) {

			// If field/field container is displayed, ignore.
			if ( e.style.display != 'none' ){return;}

			// Display field.
			e.style.display = '';

		}
		
	}

	// Antiflicker Class.
	class ZI_FormAF {
		
		constructor() {
			
			let self = this;

			// Begin creation of AF style element.
			const af = document.createElement('style');
			af.id = 'ZI_AF';

			// Is formIframe defined?
			if ( window.ZIConfigurations.formIframe && window.ZIConfigurations.formIframe.length > 0) {
				
				// Make iFrame invisble for a moment.
				af.innerHTML = `${window.ZIConfigurations.formIframe} {visibility:hidden !important;transition:height 0.25s ease;}`;

			} else {
			
				// Make all fields and their containers invisble + do not display all fields except the first and any with class zi_alwaysShow () these will still be invisable while AF style active.
				af.innerHTML = `
					${window.ZIConfigurations.formSelector} ${window.ZIConfigurations.fieldContainer} {visibility:hidden !important;}
					${window.ZIConfigurations.formSelector} ${window.ZIConfigurations.fieldContainer}:not(:first-of-type):not(:has(.zi_alwaysShow)) {display:none !important;}`;
				
			}

			document.head.appendChild(af);

		}
		
		destroy() {
			
			const ZI_AF = document.getElementById('ZI_AF');
			if (ZI_AF){ZI_AF.remove();}
			
		}
		
	}

	// Add Antiflicker.
	window.ZI_FormAF = new ZI_FormAF();

	// Initialize Form.
	window.ZI_Form = new ZI_Form();

})();