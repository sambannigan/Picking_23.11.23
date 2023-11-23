sap.ui.define([
    "sap/m/MessageToast"
], function(MessageToast) {
    'use strict';

    return {
        onListNavigationExtension: function(oEvent) {
            //get selected data
            var oBindingContext = oEvent.getSource().getBindingContext();
            var oObject = oBindingContext.getObject();
            var oModel = oBindingContext.getModel();
            var sNavigationProperty;
            var ogPath = oBindingContext.getPath()
            var oExtensionAPI = this.extensionAPI;
            console.log(oObject.mixedSlocFlag)
            // Condiditon addition as customer type 'BK' without transportorder should be visible in regular bag picking screen
            
            // if (oObject.transportOrder != null && oObject.transportOrder != "" ) 
            // {
            //
            if((oObject.transportOrder != null && oObject.transportOrder != "" ) && (oObject.shipping_type == 'Z01' || oObject.shipping_type == 'z01') && (oObject.bakeryPickingType == 'BULK' || oObject.bakeryPickingType == '')) {
                sNavigationProperty = "to_Bakery"
                var filtersTranspOrder = new Array()
                var filtersBakeType = new Array()

                var filterTranspOrder = new sap.ui.model.Filter(
                    {path: "transportOrder",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: oObject.transportOrder}
                );
                filtersTranspOrder.push(filterTranspOrder)
                var filterTranspOrder = new sap.ui.model.Filter(
                    {path: "bakeryPickingType",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: "BULK"}
                );
                filtersBakeType.push(filterTranspOrder)
                var filterTranspOrder = new sap.ui.model.Filter(
                    {path: "bakeryPickingType",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: ""}
                );
                filtersBakeType.push(filterTranspOrder)
                var bakeryTypeFilter = new sap.ui.model.Filter(filtersBakeType, false)
                filtersTranspOrder.push(bakeryTypeFilter)
                oModel.read("/ZSCM_C_PICKINGAPP", {
                    filters: filtersTranspOrder,
                    success: function (oData, oResponse) {
                        var message = "Picking storage location for the following deliveries needs to be manually changed to a non-HU managed storage location: "
                        var error = 0
                        for (let i=0; i<oData.results.length; i++) {
                            if (oData.results[i].HU_flag == true || oData.results[i].mixedSlocFlag == 'X') {
                                message += oData.results[i].outboundDelivery + " "
                                error = 1
                            }
                        }
                        if (error == 1) {
                            sap.m.MessageBox.error(message)
                            return true
                        }
                        else {
                            if (sNavigationProperty) {
                                
                                var oNavigationController = oExtensionAPI.getNavigationController();
                                var transportOrder = oObject.transportOrder;
                                var custtype = oObject.custtype;
                                var outboundDelivery = oObject.outboundDelivery;
                                var sPath = "/ZSCM_I_Bakery_L2(transportOrder='"+transportOrder+"',outboundDelivery='"+outboundDelivery+"')";
                                var oTarget = new sap.ui.model.Context(oModel, sPath);
                                oNavigationController.navigateInternal(oTarget);
                
                                //var sPathDeliverys = "/ZSCM_I_Bakery_PickList_L2(transportOrder='"+transportOrder+"')";
                                //var oTargetDeliverys = new sap.ui.model.Context(oModel, sPathDeliverys);
                                //console.log(oTargetDeliverys.getModel().getData())//.getModel("data");)
                
                                var oupdateSequence = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");
                
                                oupdateSequence.callFunction("/updateSequence", {
                                    method: "POST",
                                    urlParameters: {   
                                        transportorder : transportOrder
                                    } 
                                });
                                return true;
                            }
                            return false;
                        }

                    }
                })
            } else if (oObject.mixedSlocFlag == 'X') {
                sap.m.MessageBox.error("Picking storage location for the delivery needs to be manually changed")
                return true
            } else {
                return false
            }
            return true
//          }
                
        },  
    };
});