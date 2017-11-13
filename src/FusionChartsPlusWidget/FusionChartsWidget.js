/**
	Fusion Chart Widget
	========================

	@file      : FusionChartsWidget.js
	@version   : 2.0
	@author    : Roeland Salij / Tobin Hupsel
	@date      : 25-3-2011
	@copyright : Mendix / Mansystems
	@license   : Please contact our sales department.

	Documentation
	=============
	This widget can be used to show differtent types of charts.
	
	Open Issues 
	===========
	
*/ 
 
dojo.provide("FusionChartsPlusWidget.FusionChartsWidget");
dojo.require("FusionChartsPlusWidget.js.FusionCharts");

mxui.widget.declare('FusionChartsPlusWidget.FusionChartsWidget', {
	//DECLARATION
	addons       : [dijit._Contained, mendix.addon._Contextable],
	//templatePath : dojo.moduleUrl('FusionChartsPlusWidget') + "templates/FusionChartsWidget.html",
    
	inputargs: {
			width:500,
			height:400,
			refresh:false,
			refreshInterval:5,
			refreshMicroflow :'',
			drillDownMicroflow:'',
			editNodeMicroflow :'',
			deleteNodeMicroflow :'',
			addNodeMicroflow :'',
			editLinkMicroflow :'',
			deleteLinkMicroflow :'',
			resetChartMicroflow :''
    },
	
	//IMPLEMENTATION
	graphObject : null,
	tries : 0,
	
	chartType : '',
			
	// updates the widget with a new dataobject 
	setDataobject : function(mxObject) {
		
		setTimeout(dojo.hitch(this, function() {
		
			this.graphObject = mxObject;
			logger.debug(this.id + ".setDataobject");
			
			if(this.graphObject.hasAttribute('source'))
			{
				var myChart = FusionCharts( "chartid_"+this.id );
				var chartType = this.graphObject.getAttribute('chartType');
				
				if (myChart == null || this.chartType != chartType ){
				
					this.chartType = chartType;
					var myChart = new FusionCharts("widgets/FusionChartsPlusWidget/Charts/" + this.chartType + '.swf', "chartid_"+this.id, this.width, this.height, "0", "1");
					
					var source = this.graphObject.getAttribute('source');
					myChart.setDataXML(source.replace(/#widgetid#/gi,this.id));
					myChart.render("chartdiv_"+this.id);
				     
					setTimeout(dojo.hitch(this, this.setWidgetID), 1000);
				}else {
					this.renderChart(myChart);
					setTimeout(dojo.hitch(this, this.setWidgetID), 1000);
				}
				
				if(this.refresh == true){
					setTimeout(dojo.hitch(this, this.refreshChart), this.refreshInterval*60000);	
				}
			}
		}), 100);	
	},
	
	renderChart : function (myChart){
		var source = this.graphObject.getAttribute('source');
		myChart.setDataXML(source.replace(/#widgetid#/gi,this.id));
	},
	
	refreshChart : function (){
		this.execaction(this.refreshMicroflow);
	},
	
	addNode: function(NodeID){
		
		this.graphObject.setAttribute("SelectedID", NodeID[0]);
		this.execaction(this.addNodeMicroflow);
	},
	
	editNode: function(NodeID){
		
		this.graphObject.setAttribute("SelectedID", NodeID[0]);
		this.execaction(this.editNodeMicroflow);
	},
	
	deleteNode: function(NodeID){
		
		this.graphObject.setAttribute("SelectedID", NodeID[0]);
		this.execaction(this.deleteNodeMicroflow);
	},
	
	editLink: function(args){
		
		this.graphObject.setAttribute("FromNodeID", args[0]);
		this.graphObject.setAttribute("ToNodeID", args[1]);
		this.execaction(this.editLinkMicroflow);
	},
	
	deleteLink: function(args){
		
		this.graphObject.setAttribute("FromNodeID", args[0]);
		this.graphObject.setAttribute("ToNodeID", args[1]);
		this.execaction(this.deleteLinkMicroflow);
	},
	
	resetChart: function(NodeID){
		
		this.graphObject.setAttribute("SelectedID", NodeID[0]);
		this.execaction(this.resetChartMicroflow);
	},
	
	setWidgetID : function(){
		
		var myChart = FusionCharts( "chartid_"+this.id );
		
		if(myChart !=null && myChart.setWidgetID != null){
			myChart.setWidgetID(this.id);
		} else if(this.tries <3) {
			this.tries +=1;
			setTimeout(dojo.hitch(this, this.setWidgetID), 1500);
		}
	},
	
	drillDown: function(args){
		this.graphObject.setAttribute("SelectedID", args[0]);
		this.execaction(this.drillDownMicroflow);
	},
	
	execaction : function(mf) {
		if (mf)
			mx.processor.xasAction({
				error       : function() {
					logger.error(this.id + "error: XAS error executing microflow");
				},
				actionname  : mf,
				applyto     : 'selection',
				guids       : [this.graphObject.getGUID()]
			});
	},
	
	//reload chart after ChartXML gets an update
	objectUpdateNotification : function(mxObject){
		var guid = dojo.isObject(mxObject) ? mxObject.getGUID() : mxObject;
		
		mx.processor.getObject(guid, dojo.hitch(this, this.setDataobject));
	},

	//summery : stub function, will be used or replaced by the client environment
	onChange : function(){
	},
		
		//readonly?		
	_setDisabledAttr : function(value) {
	},
		
	postCreate : function(){
	
		window.fusionCallback = function (wID, funcName) {
			var widget = dijit.byId(wID);
			if(widget != null){
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				args.shift();
				widget[funcName](args);
			}
		};
		
		setTimeout(dojo.hitch(this, function() { //Thread, solves JS exception issue
			if (this.domNode && this.domNode.parentNode) { //still in tree?
				dojo.empty(this.domNode);
				this.domNode.innerHTML = "<div class=\"FusionChartsPlus\" dojoAttachPoint=\"FCNode\"> <div id=\"chartdiv_"+this.id+"\" /> </div>";
				this.initContext();
				this.actRendered(); 
			}
		}), 1);	
    },
	
	applyContext : function(context, callback){
		//logger.debug(this.id + ".applyContext");

		if (context){
			//Subcribe for getting updates from ChartXML
			this.subscribe({
				guid   : context.getTrackId(),
				callback : dojo.hitch(this, this.objectUpdateNotification)
			});
			mx.processor.getObject(context.getActiveGUID(), dojo.hitch(this, this.setDataobject));
		}else
			logger.warn(this.id + ".applyContext received empty context");
			
		callback && callback();
	},
	
	uninitialize : function(){
		logger.debug(this.id + ".uninitialize");
		var myChart = FusionCharts( "chartid_"+this.id );
		if(myChart!=null){
			FusionCharts( "chartid_"+this.id ).dispose();
		}
		window.fusionCallback =null;
	}
});