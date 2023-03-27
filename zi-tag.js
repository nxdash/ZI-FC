if(!window.zi){window.zi={}}

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
		console.log("Chat Script already present. Skipping");
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

	console.log("Chat Script Loaded!")

};

const InsertFormCompleteLegacyScript=keys=>{
	
	if(window.isFormCompleteDisabled===true)
		return;

	if( window.ZIWhiteList && Array.isArray(window.ZIWhiteList) && window.ZIWhiteList.indexOf("formcomplete") === -1 )
		return;

	if( isFormCompleteScriptAlreadyLoaded() ){
		console.log("FormComplete Script already present. Skipping");
		return
	}

	window._zi={formId:"9a4b5c4c-fdba-41f7-87c9-bfbf714f9c04",formLoadTimeout:4e3};

	var zi=document.createElement("script");

	zi.type="text/javascript";

	zi.async=true;

	zi.src="https://ws-assets-staging.zoominfo.com/formcomplete.js";

	var s=document.getElementsByTagName("script")[0];

	s.parentNode.insertBefore(zi,s);

	console.log("FormComplete Legacy Script Loaded!")
	
};

const InsertFormCompleteScript=keys=>{
		
	if(!keys.projectKey)
		return;

	if( window.isFormCompleteDisabled === true)
		return;

	if( window.ZIWhiteList && Array.isArray(window.ZIWhiteList) && window.ZIWhiteList.indexOf("formcomplete") === -1)
		return;

	if(isFormCompleteScriptAlreadyLoaded()){
		console.log("FormComplete Script already present. Skipping");
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

	console.log("FormComplete Script Loaded!")

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

	console.log("schedule Script Loaded!")
	
};

const GetListOfEntitlements=async()=>{
		
	try{

		let response = await fetch(ZI_TAG_BACKEND_URL, {
			
			method:"GET",headers:{"Content-Type":"application/json", Authorization:"Bearer " + window.ZIProjectKey}
			
		});

		console.log("response",response);

		const data=await response.json();

		console.log("data",data);

		if( response.status === 200 && data && data.subscriptions){
		
			let subscriptions=data?.subscriptions;

			if(subscriptions.length===0){console.log("No ZI subscriptions found")}
			if(subscriptions.sch){InsertScheduleScript(subscriptions.sch)}
			if(subscriptions.fc){InsertFormCompleteScript(subscriptions.fc)}
			if(subscriptions.chat){InsertChatScript(subscriptions.chat)}

		} else {
			
			console.log("error with response",response.body)
			
		}
		
	} catch(e) {
		
		console.error("ZI error", e)
		
	}
	
};

GetListOfEntitlements();
