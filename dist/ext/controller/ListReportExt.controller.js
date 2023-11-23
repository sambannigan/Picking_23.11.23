sap.ui.define(["sap/m/MessageToast"],function(e){"use strict";return{onListNavigationExtension:function(e){var r=e.getSource().getBindingContext();var a=r.getObject();var t=r.getModel();var o;var n=r.getPath();var i=this.extensionAPI;console.log(a.mixedSlocFlag);if(a.transportOrder!=null&&a.transportOrder!=""&&(a.shipping_type=="Z01"||a.shipping_type=="z01")&&(a.bakeryPickingType=="BULK"||a.bakeryPickingType=="")){o="to_Bakery";var s=new Array;var l=new Array;var u=new sap.ui.model.Filter({path:"transportOrder",operator:sap.ui.model.FilterOperator.EQ,value1:a.transportOrder});s.push(u);var u=new sap.ui.model.Filter({path:"bakeryPickingType",operator:sap.ui.model.FilterOperator.EQ,value1:"BULK"});l.push(u);var u=new sap.ui.model.Filter({path:"bakeryPickingType",operator:sap.ui.model.FilterOperator.EQ,value1:""});l.push(u);var p=new sap.ui.model.Filter(l,false);s.push(p);t.read("/ZSCM_C_PICKINGAPP",{filters:s,success:function(e,r){var n="Picking storage location for the following deliveries needs to be manually changed to a non-HU managed storage location: ";var s=0;for(let r=0;r<e.results.length;r++){if(e.results[r].HU_flag==true||e.results[r].mixedSlocFlag=="X"){n+=e.results[r].outboundDelivery+" ";s=1}}if(s==1){sap.m.MessageBox.error(n);return true}else{if(o){var l=i.getNavigationController();var u=a.transportOrder;var p=a.custtype;var d=a.outboundDelivery;var g="/ZSCM_I_Bakery_L2(transportOrder='"+u+"',outboundDelivery='"+d+"')";var v=new sap.ui.model.Context(t,g);l.navigateInternal(v);var c=new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");c.callFunction("/updateSequence",{method:"POST",urlParameters:{transportorder:u}});return true}return false}}})}else if(a.mixedSlocFlag=="X"){sap.m.MessageBox.error("Picking storage location for the delivery needs to be manually changed");return true}else{return false}return true}}});
//# sourceMappingURL=ListReportExt.controller.js.map