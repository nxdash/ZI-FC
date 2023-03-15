(function() {


	/** Configuration
	 *
	 *		formSelector
	 *			This can be any query selector such as #FormID, #FormName, .FormClass1.Class2.Class3, or Form[action="URL"]
	 *
	 *		exclude
	 *			This is to exclude certain input and select fields from being hidden. By default, email never hidden.
	 *			The attributes we support are id, name, and class and we look to see if the value provided it within the attribute value, so an exact match is not required.
	 *
	 *		formContainer
	 *			Only use if form is not populated at load. Useful for dynamically created forms. 
	 *			This can be any query selector value, and the closer the container is to the form that will populate, the less front-end overhead though 'body' should be acceptable.
	 *
	 *		fieldContainer
	 *			Use if the containing element has an ID, Name and or Class.
	 *			The value would be attribute value, excluding periods, hashes, or brackets.
	 *
	 *		fieldContainerExact
	 *			This can be ignored if fieldContainer is empty, otherwise this determines if an exact match is required. Recommended to use false.
	 *
	 */
	const formSelector = '#example4';
	const exclude = ['name2', 'notreal'];
	const formContainer = 'body';
	const fieldContainer = '';
	const fieldContainerExact = false;
	const debug = false;


	// Anti-flicker style element.
	const s = document.createElement('style');
	s.id = 'ZiAF';// Set ID so we can remove after hidding fields.
	s.innerHTML = `${formSelector} {opacity:0 !important;}`;// The CSS to be loaded which dynamically will populate the form selector.
	document.head.appendChild(s);
	
	
	// Find field container.
	function findContainer(e) {
		const p = e.parentElement;
		if (!p) {return false;}
		if (fieldContainer.length !== 0) {// Does fieldContainer have a value assigned?
			if (
				(fieldContainerExact && ['id', 'name', 'class'].some(identifier => p[identifier] === fieldContainer || p.classList.contains(fieldContainer))) || // Check if fieldContainer value matches the ID, Name or Class. 
				(!fieldContainerExact && ['id', 'name', 'class'].some(identifier => p.hasOwnProperty(identifier) && p[identifier] && p[identifier].includes(fieldContainer) || p.classList.contains(fieldContainer))) // Check if fieldContainer value is present in ID, Name or Class.
			) {return p;}
			return findContainer(p);
		} else {// Hide the furthest parent node from the field with a single child element, excluding label.
			const c = p.children, n = c.length;
			if (n == 1 || (n == 2 && c[0].tagName.toLowerCase() == 'label')) {return findContainer(p);}
			return e;
		}
		
	}
	
	
	// Hide fields.
	function hideFields() {
		
		const form = document.querySelector(formSelector);
		if (form) {
			
			console.log('Form object detected:', form);
			
			// Loop through all form elements.
			Array.from(form.elements).forEach( e => {

				const isField = ['INPUT', 'SELECT'].includes(e.nodeName);
				const isButton = e.hasAttribute('type') && ['reset', 'button', 'submit'].includes(e.getAttribute('type').toLowerCase());
				const isEmail = ['id', 'name', 'class'].some(identifier => e[identifier] && e[identifier].includes('email') || e.classList.contains('email'));
				const isExcluded = exclude.includes(e.id) || exclude.includes(e.name) || e.classList.contains(exclude);

				if (isField && !isButton && !isEmail && !isExcluded) {
					const container = findContainer(e);
					if (container) {container.style.display = 'none';}
					else {console.log('Container ('+fieldContainer+') not found.', e);}
				}
				
			});
			
			// Remove temp form style.
			document.getElementById('ZiAF').remove();
			
		} else {
			
			console.log('Form not detected.');
			
		}
	}


	// Find forms.
	document.addEventListener('DOMContentLoaded', function() {

		// Mutation Observer 
		if (formContainer.length !== 0) {

			const callback = function(mutationsList, observer) {
				for(const mutation of mutationsList) {
					if (mutation.type === 'childList') {
						for (const e of mutation.addedNodes) {
							if (e.tagName.toLowerCase() === 'form') {

								console.log('Form added to ' + formContainer + '.');
								hideFields();

							}
						}
					}
				}
			};

			// Create observer instance linked to callback
			const observer = new MutationObserver(callback);

			// Start observing formContainer for mutations.
			observer.observe(document.querySelector(formContainer), {childList:true});
			
		} else {
			
			// All forms are already in DOM. Begin.
			hideFields();
			
		}

	// Remove listener at completion.
	}, {once: true, capture: true});


})();