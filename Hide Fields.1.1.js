(function() {
	
	// Configurations
	const dynamic = false;// set to true if form does not exist imediatly in document.
	const formSelector = '#example1';
	const formContainer = 'body';
	const excludedFields = ['name2', 'notreal'];// id, name or class


	// Load Antiflicker style.
	const s = document.createElement('style');
	s.id = 'ZiAF';// Set ID so we can remove after hidding fields.
	s.innerHTML = `${formSelector} {opacity:0 !important;}`;// The CSS to be loaded which dynamically will populate the form selector.
	document.head.appendChild(s);


    // Ensure config variable is initialized.
    if(!window._zi_fc){window._zi_fc = {};}


	// Wait until ready.
	document.addEventListener('DOMContentLoaded', function() {
		
		window._zi_fc.onReady = function(data) {
			
			// Does the form not exist in DOM on load?
			if (dynamic) {
				
				// Mutation Observer 
				const callback = function(mutationsList, observer) {
					for(const mutation of mutationsList) {
						if (mutation.type === 'childList') {
							for (const e of mutation.addedNodes) {
								if (e.tagName.toLowerCase() === 'form') {

									console.log('Form added to ' + formContainer + '.');
									readyForm(data);

								}
							}
						}
					}
				};
				
				const watchContainer = document.querySelector(formContainer)
				if ( watchContainer !== null ) {

					// Create observer instance linked to callback
					const observer = new MutationObserver(callback);

					// Start observing formContainer for mutations.
					observer.observe( watchContainer, {childList:true} );

				} else {

					console.log('ZI Form container not found.');

				}

			}
			
			// Form is ready at load.
			else {
				
				readyForm(data);
				
			}
				
		};
		
	// Remove listener after load completes.
	}, {once: true, capture: true});


	// Ready the form on load.
	function readyForm(data) {
		
		// Get context where form resides. This searches sourceless iframes as well.
		const context = getContext(data.formSelector);
		
		data.inputs.forEach(function(input) {
			
			// Find field.
			const field = context.querySelector(data.formSelector+' '+input);
			readyField( field, 'readyForm' );

		});

		// Remove Antiflicker style.
		document.getElementById('ZiAF').remove();
		
	}
	
	
	// Update form when our endpoint populates fields.
	function updateForm(data) {
		
		// Get context where form resides. This searches sourceless iframes as well.
		const context = getContext(data.formSelector);
		
		data.inputs.forEach(function(input) {
			
			// Find field.
			const field = context.querySelector(data.formSelector+' '+input);
			readyField( field, 'show' );

		});
		
	}
	

	function readyField( field, action ) {
		
		// on ready; hide all fields that are mapped except email.
		// on update; unhide any fields that are not populated with a value so the form can be completed by end-user.
		
		
		if ( action == 'readyForm' ) {
			
			
			
		} else {
			
			
			
		}
		
		

		// Analyze field.
		const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
		const ignoredType = field.hasAttribute('type') && ['reset', 'button', 'submit', 'hidden'].includes(field.getAttribute('type').toLowerCase());
		const isEmail = ['id', 'name', 'class'].some(identifier => field[identifier] && field[identifier].includes('email') || field.classList.contains('email'));
		const isExcluded = excludedFields.includes(field.id) || excludedFields.includes(field.name) || field.classList.contains(excludedFields);

		if (action=='hide' && isField && !ignoredType && !isEmail && !isExcluded) {
			const container = findContainer(field);
			if (container) {container.style.display = 'none';}
			else {console.log('ZI Field Container ('+fieldContainer+') not found.', field);}
		}

		if (action!='hide' && isField && !ignoredType && !isEmail && !isExcluded) {
			const container = findContainer(field);
			if (container) {container.style.display = 'none';}
			else {console.log('ZI Field Container ('+fieldContainer+') not found.', field);}
		}

	}
	

    window._zi_fc.onMatch = function(data) {
        //Checks to see if the form is in a HubSpot iFrame
        var doc = getContext(this.selector);

        //Iterates through all of the name attributes (keys) in the callback parameter
        for (var name in data) {
            //Builds a selector that works for both inputs and select elements
            //then use a querySelector to get the element into a var for later use.
            var field = doc.querySelector(this.selector + ' [name="' + name + '"]');

            //Checks to see if field type is hidden, if it is, there's no need to change
            //visibility so we move to the next field
            if (!field || field.getAttribute('type') == 'hidden')
                continue;

            //Passes the field to findEl so we can get the parent element that we want to show/hide
            var el = findEl(field);

            //If the value in the callback parameter for the current record is undefined show the element
            //(If FormComplete didn't return anything for this input display it)
            if (data[name] == undefined || field.getAttribute('data-zi-input-enriched') == 'false')
                el.style.display = '';

            //If the value in the callback parameter isn't undefined make sure the element is hidden
            //(If FormComplete fills the field hide it or keep it hidden)
            else
                el.style.display = 'none';
        }
    };

    //findEl finds the top most element that contains exactly 1 input or select element. This will be used
    //as the element to hide so the label and any elements creating spacing are all hidden instead of just
    //the field.
    function findEl(el) {
        var parent = el.parentElement,
            count = parent.querySelectorAll('input').length + parent.querySelectorAll('select').length;
        if (count > 1)
            return (el);
        return (findEl(parent));
    }

    //Iterates through all HubSpot iframes on the page and determines which one has the element with the
    //passed selector. Returns the document of the iframe if it exists, returns the document of the main 
    //page if it doesn't
    function getContext(selector) {
        var iframes = document.getElementsByClassName('hs-form-iframe');
        if(iframes) {
            for(var i = 0; i < iframes.length; i+=1) {
                if(iframes[i].contentDocument.querySelector(selector))
                    return iframes[i].contentDocument;
            }
        }
        return document;
    }
})();


