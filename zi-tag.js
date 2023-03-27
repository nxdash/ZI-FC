if(!window.zi){window.zi={}}

const consoleTagStyle	= 'color:#0000FF;font-size:14px;line-height:24px;';
const SCHEDULE_BACKEND_URL=window.ZITagEnv==="dev"?"https://schedule-staging.zoominfo.com/zischedule.js":"https://schedule.zoominfo.com/zischedule.js";
const FORMCOMPLETE_BACKEND_URL=window.ZITagEnv==="dev"?"https://ws-assets-staging.zoominfo.com/formcomplete.js":"https://ws-assets.zoominfo.com/formcomplete.js";
const ZI_TAG_BACKEND_URL=window.ZITagEnv==="dev"?"https://js-staging.zi-scripts.com/unified/v1/master/getSubscriptions":"https://js.zi-scripts.com/unified/v1/master/getSubscriptions";
const isScheduleScriptAlreadyLoaded=()=>{

	if(window.zischedule)
		return true;
	else 
		return false

};
const isChatScriptAlreadyLoaded=()=>{
	if(window.insentCompanyDomain&&window.insentProjectName&&window.insentProjectKey)
		return true;
	else 
		return false
};
const isFormCompleteScriptAlreadyLoaded=()=>{

	if(window._zi_fc && ( window._zi_fc.formId || window._zi_fc.projectKey ))
		return true;
	else 
		return false

};
const InsertChatScript=keys=>{
	
	if(window.isChatDisabled===true)
		return;
	if(window.ZIWhiteList&&Array.isArray(window.ZIWhiteList)&&window.ZIWhiteList.indexOf("chat")===-1)
		return;
	if(isChatScriptAlreadyLoaded()){
		console.log("%cZI - Chat Script already present. Skipping", consoleTagStyle);
		return
	}

	window.insentCompanyDomain="insent.ai";
	window.insentProjectName="insentdev";
	window.insentProjectKey="qXbam3pKWv5SucaA7mPA";

	var t=window.insent||{};

	t.queue=[];

	t.SCRIPT_VERSION="0.1.3",t.methods=["widget","listener","setVisitor"],t.factory=function(e){

		return function(){
			var n=Array.prototype.slice.call(arguments);
			return n.unshift(e),t.queue.push(n),t
		}

	},
	t.methods.forEach(function(e){
		t[e]=t.factory(e)
	});

	insent=t;

	var s=document.createElement("script");

	s.type = "text/javascript", 
	s.charset="utf-8",
	s.defer=!0,
	s.src="https://insentdev.widget.insent.ai/insent",
	document.readyState==="complete"?document.body.appendChild(s):window.addEventListener("load",function(n){
		document.body.appendChild(s)
	});

	console.log("%cZI - Chat Script Loaded!", consoleTagStyle)

};
const InsertFormCompleteLegacyScript=keys=>{
	
	if(window.isFormCompleteDisabled===true)
		return;

	if( window.ZIWhiteList && Array.isArray(window.ZIWhiteList) && window.ZIWhiteList.indexOf("formcomplete") === -1 )
		return;

	if( isFormCompleteScriptAlreadyLoaded() ){
		console.log("%cZI - FormComplete Script already present. Skipping", consoleTagStyle);
		return
	}

	window._zi={formId:"9a4b5c4c-fdba-41f7-87c9-bfbf714f9c04",formLoadTimeout:4e3};

	var zi=document.createElement("script");

	zi.type="text/javascript";

	zi.async=true;

	zi.src="https://ws-assets-staging.zoominfo.com/formcomplete.js";

	var s=document.getElementsByTagName("script")[0];

	s.parentNode.insertBefore(zi,s);

	console.log("%cZI - FormComplete Legacy Script Loaded!", consoleTagStyle)
	
};
const InsertFormCompleteScript=keys=>{
		
	if(!keys.projectKey)
		return;

	if( window.isFormCompleteDisabled === true)
		return;

	if( window.ZIWhiteList && Array.isArray(window.ZIWhiteList) && window.ZIWhiteList.indexOf("formcomplete") === -1)
		return;

	if(isFormCompleteScriptAlreadyLoaded()){
		console.log("%cZI - FormComplete Script already present. Skipping", consoleTagStyle);
		return
	}

	let FormcompleteParameters={projectKey:keys.projectKey};

	if(window.FCpostSubmissionEvent)
		FormcompleteParameters.postSubmissionEvent=true;

	window._zi_fc={...window._zi_fc,...FormcompleteParameters};

	var zi=document.createElement("script");
	zi.type="text/javascript";
	zi.async=true;
	zi.src=FORMCOMPLETE_BACKEND_URL;

	var s=document.getElementsByTagName("script")[0];
	s.parentNode.insertBefore(zi,s);

	console.log("%cZI - FormComplete Script Loaded!", consoleTagStyle)

};
const InsertScheduleScript=keys=>{
	
	if(window.isScheduleDisabled===true)
		return;

	if(window.ZIWhiteList&&Array.isArray(window.ZIWhiteList)&&window.ZIWhiteList.indexOf("schedule")===-1)
		return;

	let tx=window.zischedule||{};

	tx.queue=[];

	tx.SCRIPT_VERSION="0.1.3",tx.methods=["triggerSchedule"],tx.factory=function(e){

		return function(){
			const n=Array.prototype.slice.call(arguments);
			return n.unshift(e),
				tx.queue.push(n),
				tx
		}
		
	},
	tx.methods.forEach(function(e){tx[e]=tx.factory(e)});

	window.zischedule=tx;

	const s=document.createElement("script");

	s.type="text/javascript",s.charset="utf-8",s.defer=!0,s.src=SCHEDULE_BACKEND_URL,document.readyState==="complete"?document.body.appendChild(s):window.addEventListener("load",function(n){
		document.body.appendChild(s)
	});

	console.log("%cZI - Schedule Script Loaded!", consoleTagStyle)
	
};
const GetListOfEntitlements=async()=>{
		
	try{

		let response = await fetch(ZI_TAG_BACKEND_URL, {method:"GET",headers:{"Content-Type":"application/json", Authorization:"Bearer " + window.ZIProjectKey}});

		const data=await response.json();

		if( response.status === 200 && data && data.subscriptions ){
		
			let subscriptions=data?.subscriptions;

			if(subscriptions.length===0){console.log("%cZI - No ZI subscriptions found", consoleTagStyle)}
			if(subscriptions.sch){InsertScheduleScript(subscriptions.sch)}
			if(subscriptions.chat){InsertChatScript(subscriptions.chat)}

		} else {console.log("ZI - An error occured in response", response.body);}
		
	} catch(e) {console.error("ZI - An error occured", e);}
	
};

GetListOfEntitlements();

class ZI_Form {

	constructor() {

		let self = this;

		// Store properties.
		this.consoleErrorStyle	= 'color:#FF0000;font-size:14px;line-height:24px;';
		this.consoleInfoStyle	= 'color:#AAAAAA;font-size:14px;line-height:24px;';
		this.configurations = window.ZIConfigurations || {
			formIframe: '',
			eventForm: false,
			eventFormContainer: '',
			formSelector: '',
			fieldContainer: ''
		};

		console.log(`%cZI - Initializing...\n${JSON.stringify(this.configurations)}`, this.consoleInfoStyle);

		// Wait for document / iframe to complete loading.
		document.addEventListener('load', function() {

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
			const formSelection = document.querySelector(window.ZIConfigurations.eventFormContainer + ' ' + window.ZIConfigurations.formSelector);
			// IF form is found, initialize it and stop observer.
			if (formSelection) {
				self.ready();
				observer.disconnect();
			}
		};
		
		// Define form container to watch.
		const watchContainer = document.querySelector(window.ZIConfigurations.eventFormContainer);

		// If container is found then create observer with formWatch callback and watch for mutations.
		if (watchContainer) {
			const observer = new MutationObserver(formWatch);
			observer.observe(watchContainer, {childList:true});
		} else {
			console.log("%cZI - Form container ("+ window.ZIConfigurations.eventFormContainer +") not found. Please ensure container exists on load.\n", self.consoleErrorStyle);
		}

	}
	
	ready() {

		let self = this;
		
		// Initialize FormComplete Global.
		if(!window._zi_fc){window._zi_fc={}}

		// Add ready form event.
		window._zi_fc.onReady = function(data) {self.readyForm( data, this.formShorteningEnabled, this.formIframeWrapperSelector );}

		// Add update form event.
		window._zi_fc.onMatch = function(data) {self.updateForm(data);}

		// Check endpoint.
		this.checkEntitlement();

	}

	async checkEntitlement() {
		
		var errors = '';
		
		try {
			
			let response=await fetch( ZI_TAG_BACKEND_URL, { method:"GET", headers:{ "Content-Type":"application/json", Authorization:"Bearer " + window.ZIProjectKey } } );
			if ( response.status!==200){errors += "Response Status: " + response.status + "\n";}

			const data=await response.json();
			if (!data){errors += "Data not set.\n";}
			if (data.err === true){errors += "Error received: " + data.errMessage + "\n";}
			if (!data.subscriptions){
				if (!window.ZIProjectKey) {errors += "Subscriptions not set.\n";}
				else {errors += "Subscriptions not valid.\n";}
				errors += "Ensure ZIProjectKey is correct and subscription is active.\n\nIf subscription is no longer active, you may remove the Zoominfo Snippet.\n";
			} else {
				let subscriptions=data?.subscriptions;
				if(subscriptions.fc){InsertFormCompleteScript(subscriptions.fc)}
			}

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
					if (!field) {
						
						
						console.log(`%cZI - Unable to find field.\n${this.formSelector}\n${input}`, this.consoleErrorStyle);}
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
class ZI_FormAF {
	
	constructor() {
		
		let self = this;

		// Store properties.
		this.configurations = window.ZIConfigurations || '';

		// Begin creation of AF style element.
		const af = document.createElement('style');
		af.id = 'ZI_AF';

		// Is formIframe defined?
		if ( this.configurations.formIframe && this.configurations.formIframe.length ) {
			
			// Make iFrame invisble for a moment.
			af.innerHTML = `${window.ZIConfigurations.formIframe} {visibility:hidden !important;transition:height 0.25s ease;}`;
			document.head.appendChild(af);

		} else
		if ( this.configurations.formSelector && this.configurations.formSelector.length && this.configurations.fieldContainer && this.configurations.fieldContainer.length ){
		
			// Make all fields and their containers invisble + do not display all fields except the first and any with class zi_alwaysShow () these will still be invisable while AF style active.
			af.innerHTML = `
				${this.configurations.formSelector} ${this.configurations.fieldContainer} {visibility:hidden !important;}
				${this.configurations.formSelector} ${this.configurations.fieldContainer}:not(:first-of-type):not(:has(.zi_alwaysShow)) {display:none !important;}`;
			document.head.appendChild(af);
			
		}

	}
	
	destroy() {
		
		const ZI_AF = document.getElementById('ZI_AF');
		if (ZI_AF){ZI_AF.remove();}
		
	}
	
}

window.ZI_FormAF = new ZI_FormAF();
window.ZI_Form = new ZI_Form();
