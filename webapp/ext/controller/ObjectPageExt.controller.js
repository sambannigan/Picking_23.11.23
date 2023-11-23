sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    'sap/m/Text'
],

    function (MessageToast, MessageBox, Text) {
        'use strict';

        return {

            onInit: function(oEvent) {
               // var id = this.getSource().getValue()
                //var test = this.getOwnerComponent().getModel().getData()
               // var trOrder = sap.ui.getCore().byId(id);
                //console.log(test)
            },

            onBeforeRendering: function(oEvent) {
                //console.log(this.getView().getModel().getObejct())
                // var oModel = this.getView().getModel()
                // var sPath = this.getView().getBindingContext().getPath()//.getPath()//.getModel())
                // var oTarget = new sap.ui.model.Context(oModel, sPath);
                // console.log(oModel.getProperty(sPath))
                // var path1 = ""
                // var bindingContext = this.getView().getBindingContext();
                // var path = bindingContext.getPath();
                // var path1 = ""
                // var object = bindingContext.getModel();
                // console.log(path)
                // console.log(oEvent.getSource().getModel())
                // console.log(oEvent.getSource().getBindingContext().getModel().getProperty('/ZSCM_I_Bakery_L2'))
                // var oTarget = new sap.ui.model.Context(object, path);
                // console.log(oTarget)
                // oModel.read("/ZSCM_C_PICKINGAPP", {
                //     filters: filtersTranspOrder,
                //     success: function (oData, oResponse) {
                //         var message = "The following Deliveries have HU managed items, please edit before picking: "
                //         var error = 0
                //         console.log("lfkjdkj")
                //         for (let i=0; i<oData.results.length; i++) {
                //             console.log(oData.results[i].huFlag)
                //             if (oData.results[i].huFlag == true) {
                //                 message += oData.results[i].outboundDelivery + " "
                //                 error = 1
                //             }
                //         }
                //         if (error == 1) {
                //             console.log("hereeeee")
                //             sap.m.MessageBox.error(message)
                //         }
                //     }
                // })

            },


            scanHU: function (oEvent) {
                //get user selected data and add leading zeroes where necessary
                var outboundDelivery = "000000000" + oEvent.getSource().getParent().getParent().getBindingContext().getObject().outboundDelivery;
                var shipTo = oEvent.getSource().getParent().getParent().getBindingContext().getObject().shipTo;
                var item = "0000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDeliveryItem;
                var packInst = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().packInst;
                var material = "000000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().material;
                var uom = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().uom;
                material = material.substr(material.length - 18);
                item = item.substr(item.length - 6);
                outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
                var exists = 0;
                var finalHU
                var extensionAPI = this.extensionAPI

                //create "enter HU" dialog
                var oButton2 = new sap.m.Button("Cancel", {
                    text: "Cancel"
                });

                var oButton1 = new sap.m.Button("OK", {
                    text: "OK"
                });

                var oDialog = new sap.m.Dialog("Dialog1", {
                    title: "Enter HU",
                    contentWidth: "20%",
                    closeOnNavigation: true,
                    buttons: [oButton1, oButton2],
                    content: [
                        new sap.m.Label({ text: "HU:", required: true }),
                        new sap.m.Input({ maxLength: 20, id: "HUBarcode", type: "Text" }),
                    ]
                });

                // When user presses enter on keyboard, get HU and add to delivery
                sap.ui.getCore().byId("HUBarcode").onsapenter = function (e) {
                    if (((sap.ui.getCore().byId("HUBarcode").getValue()).substr(0, 4)) == '(00)') {
                        var cutHU = (sap.ui.getCore().byId("HUBarcode").getValue()).substr(4, (sap.ui.getCore().byId("HUBarcode").getValue()).length - 1)
                        var HUleadingZeroes = "00000000000" + cutHU;
                        finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
                    } else {
                        var HUleadingZeroes = "00000000000" + sap.ui.getCore().byId("HUBarcode").getValue();
                        finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
                    }

                    //validate HU
                    var oHUCheck = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");
                    oHUCheck.callFunction("/validateHU", {
                        method: "POST",
                        urlParameters: {
                            HandlingUnit: finalHU,
                            PackInstructions: packInst,
                            Customer: shipTo,
                            Delivery: outboundDelivery,
                            DeliveryItem: item,
                            DeliveryUOM: uom,
                        },
                        success: function (oData, oResponse) {
                            //if a warning is found in validation step, alert user and allow them to continue
                            if (oData.Type == 'W') {
                                MessageBox.warning(oData.Message, {
                                    actions: ["OK", MessageBox.Action.CLOSE],
                                    emphasizedAction: "OK",
                                    onClose: function (sAction) {
                                        if (sAction == "OK") {
                                            onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI)
                                        }
                                    }
                                });
                            } else if (oData.Type == 'E') {
                                sap.m.MessageBox.error(oData.Message);
                            } else {
                                onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI)
                            }
                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error(oError.response.body);
                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        }
                    })
                }

                //Press cancel, destroy dialog
                oButton2.attachPress(function (evt) {
                    oDialog.close();
                    oDialog.destroy();
                    oDialog = null;
                })

                //Press OK, pick HU
                oButton1.attachPress(function (evt) {
                    //get entered hu and format
                    if (((sap.ui.getCore().byId("HUBarcode").getValue()).substr(0, 4)) == '(00)') {
                        var cutHU = (sap.ui.getCore().byId("HUBarcode").getValue()).substr(4, (sap.ui.getCore().byId("HUBarcode").getValue()).length - 1)
                        var HUleadingZeroes = "00000000000" + cutHU;
                        finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
                    } else {
                        var HUleadingZeroes = "00000000000" + sap.ui.getCore().byId("HUBarcode").getValue();
                        finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
                    }

                    //validate HU
                    var oHUCheck = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

                    oHUCheck.callFunction("/validateHU", {
                        method: "POST",
                        urlParameters: {
                            HandlingUnit: finalHU,
                            PackInstructions: packInst,
                            Customer: shipTo,
                            Delivery: outboundDelivery,
                            DeliveryItem: item,
                            DeliveryUOM: uom,
                        },
                        success: function (oData, oResponse) {
                            //if a warning is found in validation step, alert user and allow them to continue
                            if (oData.Type == 'W') {
                                MessageBox.warning(oData.Message, {
                                    actions: ["OK", MessageBox.Action.CLOSE],
                                    emphasizedAction: "OK",
                                    onClose: function (sAction) {
                                        if (sAction == "OK") {
                                            onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI)
                                        }
                                    }
                                });
                            } else if (oData.Type == 'E') {
                                sap.m.MessageBox.error(oData.Message);
                            } else {
                                onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI)
                            }

                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        },
                        error: function (oError) {
                            console.log(oError)
                            sap.m.MessageBox.error(oError.response.body);
                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        }
                    })

                })

                oDialog.addStyleClass("sapUiContentPadding");
                oDialog.open();

            },

            updateSeal: function (oEvent) {
                //get user selected data
                var material = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
                var hu = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().HUNum;
                var HUleadingZeroes = "00000000000" + hu;
                var finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
                var extensionAPI = this.extensionAPI

                //create buttons for dialog
                var oButton2 = new sap.m.Button("Cancel", {
                    text: "Cancel"
                });

                var oButton1 = new sap.m.Button("OK", {
                    text: "OK"
                });

                //if ok is pressed update seal
                oButton1.attachPress(function (evt) {
                    var seal = sap.ui.getCore().byId("Seal").getValue()
                    var oUpdateSeal = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

                    oUpdateSeal.callFunction("/updateSealNumber", {
                        method: "POST",
                        urlParameters: {
                            HUNumber: finalHU,
                            sealNumber: seal
                        },
                        success: function (oData, oResponse) {
                            console.log(oData)
                            var message = oData.Message
                            var messageType = oData.Type
                            if (messageType == 'S') {
                                console.log(message)
                                sap.m.MessageToast.show(message);
                            } else {
                                sap.m.MessageBox.error(message);
                            }
                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        },
                        error: function (oError) {
                            console.log(oError)
                            sap.m.MessageBox.error(oError);
                            oDialog.close();
                            oDialog.destroy();
                            oDialog = null;
                        },
                    })

                });

                //if cancel is pressed destroy dialog
                oButton2.attachPress(function (evt) {
                    oDialog.close();
                    oDialog.destroy();
                    oDialog = null;
                });


                var oDialog = new sap.m.Dialog("Dialog1", {
                    title: "Update Seal Number",
                    contentWidth: "20%",
                    closeOnNavigation: true,
                    buttons: [oButton1, oButton2],
                    content: [
                        new sap.m.Label({ text: "Seal:" }),
                        new sap.m.Input({ maxLength: 20, id: "Seal" })
                    ]
                });
                oDialog.addStyleClass("sapUiContentPadding");
                oDialog.open()
            },

            addBatch: function (oEvent) {

                //get user selected data and add leading zeroes where necessary
                var material = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().material;
                var item = "0000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDeliveryItem;
                var delivery = "000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDelivery;
                var plant = oEvent.getSource().getParent().getParent().getBindingContext().getObject().plant;
                delivery = delivery.substr(delivery.length - 10);
                item = item.substr(item.length - 6);
                var uom = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().uom;
                var validBatch = 0
                var pickAmount = 0
                var exists = 0
                var extensionAPI = this.extensionAPI
                var storLoc = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().storageLocation;

                //get current picked value accross all batch splits on delivery item
                var oPickedAmount = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                var filtersPickedAmount = new Array()
                var filterPickedAmount = new sap.ui.model.Filter({
                    path: "outboundDelivery",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: delivery}
                );
                filtersPickedAmount.push(filterPickedAmount)
                filterPickedAmount = new sap.ui.model.Filter(
                    {path: "outboundDeliveryItem",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: item}
                );
                filtersPickedAmount.push(filterPickedAmount)
                oPickedAmount.read("/ZSCM_BulkProd_L1", { //?$filter=outboundDelivery eq \'" + delivery + "\' and outboundDeliveryItem eq \'" + item + "\'", {
                    filters: filtersPickedAmount,
                    success: function (oData, oResponse) {
                        console.log(oData.results.length)
                        for (let i = 0; i < (oData.results.length); i++) {
                            pickAmount += parseFloat(oData.results[i].plannedQuant, 10)
                            if (parseInt(mResult.text, 10) == parseInt(oData.results[i].plannedQuant, 10)) {
                                exists = 1
                            }
                        }
                    }
                })


                var oButton2 = new sap.m.Button("Cancel", {
                    text: "Cancel"
                });

                var oButton1 = new sap.m.Button("OK", {
                    text: "OK"
                });

                oButton1.attachPress(function (evt) {
                    //open busy dialog
                    var busy = new sap.m.BusyDialog();
                    busy.open()
                    //get entered values
                    var batch = sap.ui.getCore().byId("Batch").getValue()
                    var qty = sap.ui.getCore().byId("Qty").getValue()
                    //validate entered values
                    if (batch == "") {
                        sap.m.MessageToast.show("Please Enter Batch");
                        busy.close()
                    } else if (qty == "" || qty <= 0) {
                        sap.m.MessageToast.show("Please Enter Qty");
                        busy.close()
                    } else if (Number.isInteger(parseFloat(qty, 2)) == false) {
                        sap.m.MessageToast.show("Cannot pick a decimal");
                        busy.close()
                    }
                    else {
                        //validate batch
                        var obatchCheck = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                        var filtersBatchCheck = new Array()
                        var filterBatchCheck = new sap.ui.model.Filter({
                            path: "Matnr",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: material}
                        );
                        filtersBatchCheck.push(filterBatchCheck)
                        filterBatchCheck = new sap.ui.model.Filter(
                            {path: "Werks",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: plant}
                        );
                        filtersBatchCheck.push(filterBatchCheck)
                        filterBatchCheck = new sap.ui.model.Filter(
                            {path: "Charg",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: batch}
                        );
                        filtersBatchCheck.push(filterBatchCheck)
                        filterBatchCheck = new sap.ui.model.Filter(
                            {path: "lgort",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: storLoc}
                        );
                        filtersBatchCheck.push(filterBatchCheck)
                        obatchCheck.read("/ZSCM_I_ValidBatch", { //?$filter=Matnr eq \'" + material + "\' and Werks eq \'" + plant + "\' and Charg eq \'" + batch + "\' and lgort eq \'" +storLoc + "\'", {
                            filters: filtersBatchCheck,
                            success: function (oData, oResponse) {
                                if (oData.results.length > 0) {
                                    console.log(oData.results[0].lgort)
                                    // if (parseInt(qty, 10) > oData.results[0].stock) {
                                    //     console.log(">")
                                    //     sap.m.MessageBox.error("Insufficient inventory for the nominated batch.");
                                    //     // oDialog4.open();
                                    //     oDialog.close();
                                    //     oDialog.destroy();
                                    //     oDialog = null;
                                    //     busy.close()
                                    // } else 
                                    if (oData.results[0].lgort != storLoc) {
                                        sap.m.MessageBox.error("Batch does not have stock in the picking storage location.");
                                        // oDialog4.open();
                                        oDialog.close();
                                        oDialog.destroy();
                                        oDialog = null;
                                        busy.close()
                                    } else {
                                        var totalPick = pickAmount + parseFloat(qty)
                                        //assign batch to delivery using function import addBatchToDelivery
                                        var oAssignBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")

                                        oAssignBatch.callFunction("/addBatchToDelivery", {
                                            method: "POST",
                                            urlParameters: {
                                                batch: batch,
                                                deliveryItem: item,
                                                deliveryNumber: delivery,
                                                uom: uom,
                                                pickAmount: qty,
                                                qty: qty,
                                                bakeryFlag: false
                                            },
                                            success: function (oData, oResponse) {
                                                console.log(oData)
                                                if (oData.Type == 'E') {
                                                    sap.m.MessageBox.error(oData.Message);
                                                } else {
                                                    sap.m.MessageToast.show("Batch " + batch + " added to delivery " + delivery, {
                                                        duration: 3000,                  // default
                                                        width: "15em",                   // default
                                                        my: "center bottom",             // default
                                                        at: "center bottom",             // default
                                                        of: window,                      // default
                                                        offset: "0 0",                   // default
                                                        collision: "fit fit",            // default
                                                        onClose: null,                   // default
                                                        autoClose: true,                 // default
                                                        animationTimingFunction: "ease", // default
                                                        animationDuration: 1000,         // default
                                                        closeOnBrowserNavigation: true   // default
                                                    });
                                                    //refresh table
                                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_C_PICKINGAPP--ScenarioNoHU::Table")
                                                    if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S2_L1--BulkProd::Table") != undefined) {
                                                        sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S2_L1--BulkProd::Table").getModel().refresh(true);
                                                    }
                                                }

                                                oDialog.close();
                                                oDialog.destroy();
                                                oDialog = null;
                                                busy.close()

                                            },
                                            error: function (oError) {
                                                busy.close()
                                                console.log(oError)
                                                sap.m.MessageBox.error(oError);
                                                oDialog.close();
                                                oDialog.destroy();
                                                oDialog = null;
                                            }

                                        })


                                    }

                                } else {
                                    var sMsg = 'Invalid Batch.'
                                    busy.close()
                                    sap.m.MessageBox.error(sMsg);
                                    oDialog.close();
                                    oDialog.destroy();
                                    oDialog = null;
                                }
                            },
                            error: function (data) {
                                busy.close()
                                console.log(data)
                            }
                        });

                    }


                });

                oButton2.attachPress(function (evt) {
                    oDialog.close();
                    oDialog.destroy();
                    oDialog = null;
                });


                //create batch selection dialog
                var oDialog = new sap.m.Dialog("Dialog1", {
                    title: "Add Batch",
                    contentWidth: "20%",
                    closeOnNavigation: true,
                    draggable: true,
                    buttons: [oButton1, oButton2],
                    content: [
                        new sap.m.Label({ text: "Batch:", required: true }),
                        new sap.m.Input({
                            maxLength: 20, id: "Batch", type: "Text",
                            liveChange: function (oEvent) {
                                var input = oEvent.getSource();
                                input.setValue(input.getValue().toUpperCase());
                            }
                        }),
                        new sap.m.Label({ text: "Qty:", required: true }),
                        new sap.m.Input({ maxLength: 20, id: "Qty", type: "Number" })
                    ]
                });

                oDialog.addStyleClass("sapUiContentPadding");
                oDialog.open()

            },

            removeBatch: function (oEvent) {
                //get user selected data and add leading zeroes where necessary
                var outboundDelivery1 = "000000000" + oEvent.getSource().getParent().getParent().getBindingContext().getObject().outboundDelivery;
                var deliveryNumber = outboundDelivery1.substr(outboundDelivery1.length - 10);
                var batchItem = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDeliveryItem;
                var batchQty = parseFloat(oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().plannedQuant);
                var totalPicked = 0
                var exists = 0
                var extensionAPI = this.extensionAPI
                //open busy dialog
                var busy = new sap.m.BusyDialog();
                busy.open()

                //remove batch using function import removeBatchFromDelivery
                var oRemoveBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

                oRemoveBatch.callFunction("/removeBatchFromDelivery", {
                    method: "POST",
                    urlParameters: {
                        deliveryNumber: deliveryNumber,
                        batchItem: batchItem,
                    },
                    success: function (oData, oResponse) {
                        busy.close()
                        if (oData.Type == 'E') {
                            sap.m.MessageBox.error(oData.Message);
                        } else {
                            sap.m.MessageToast.show("Batch removed", {
                                duration: 3000,                  // default
                                width: "15em",                   // default
                                my: "center bottom",             // default
                                at: "center bottom",             // default
                                of: window,                      // default
                                offset: "0 0",                   // default
                                collision: "fit fit",            // default
                                onClose: null,                   // default
                                autoClose: true,                 // default
                                animationTimingFunction: "ease", // default
                                animationDuration: 1000,         // default
                                closeOnBrowserNavigation: true   // default
                            });
                        }
                        //refresh table
                        extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S2_L1--BulkProd::Table");
                        //if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_C_PICKINGAPP--ScenarioNoHU::Table") != undefined) {
                        //    console.log("refresh")
                        //    sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_C_PICKINGAPP--ScenarioNoHU::Table").getModel().refresh(true);
                        //}
                        extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_C_PICKINGAPP--ScenarioNoHU::Table");
                    },
                    error: function (oError) {
                        var sMsg = 'Unable to remove Batch.'
                        sap.m.MessageToast.show(sMsg);
                        busy.close()
                    },
                })
            },

            // removeHUCont: function (oEvent) {
            //     var hu = "00000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().HUNum;
            //     var outboundDelivery = "000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDelivery;
            //     var item = "0000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDeliveryItem;
            //     hu = hu.substr(hu.length - 20);
            //     item = item.substr(item.length - 6);
            //     outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
            //     var extensionAPI = this.extensionAPI

            //     var oRemoveHU = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

            //     oRemoveHU.callFunction("/unassignHUFromDelivery", {
            //         method: "POST",
            //         urlParameters: {
            //             deliveryNumber: outboundDelivery,
            //             deliveryItem: item,
            //             HU_EXID: hu
            //         },
            //         success: function (oData, oResponse) {
            //             sap.m.MessageToast.show("HU removed", {
            //                 duration: 3000,                  // default
            //                 width: "15em",                   // default
            //                 my: "center bottom",             // default
            //                 at: "center bottom",             // default
            //                 of: window,                      // default
            //                 offset: "0 0",                   // default
            //                 collision: "fit fit",            // default
            //                 onClose: null,                   // default
            //                 autoClose: true,                 // default
            //                 animationTimingFunction: "ease", // default
            //                 animationDuration: 1000,         // default
            //                 closeOnBrowserNavigation: true   // default
            //             });
            //             extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Container::responsiveTable-listUl");

            //         },
            //         error: function (oError) {
            //             var sMsg = 'Unable to remove HU.';
            //             sap.m.MessageToast.show(sMsg);
            //         },
            //     })
            //     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Container::responsiveTable-listUl");
            // },

            // removeHUPallet: function (oEvent) {
            //     var hu = "00000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().HUNum;
            //     var outboundDelivery = "000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDelivery;
            //     var item = "0000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDeliveryItem;
            //     hu = hu.substr(hu.length - 20);
            //     item = item.substr(item.length - 6);
            //     outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
            //     var extensionAPI = this.extensionAPI

            //     var oRemoveHU = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

            //     oRemoveHU.callFunction("/unassignHUFromDelivery", {
            //         method: "POST",
            //         urlParameters: {
            //             deliveryNumber: outboundDelivery,
            //             deliveryItem: item,
            //             HU_EXID: hu
            //         },
            //         success: function (oData, oResponse) {
            //             sap.m.MessageToast.show("HU removed", {
            //                 duration: 3000,                  // default
            //                 width: "15em",                   // default
            //                 my: "center bottom",             // default
            //                 at: "center bottom",             // default
            //                 of: window,                      // default
            //                 offset: "0 0",                   // default
            //                 collision: "fit fit",            // default
            //                 onClose: null,                   // default
            //                 autoClose: true,                 // default
            //                 animationTimingFunction: "ease", // default
            //                 animationDuration: 1000,         // default
            //                 closeOnBrowserNavigation: true   // default
            //             });
            //             extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Pallet::responsiveTable-listUl");

            //         },
            //         error: function (oError) {
            //             var sMsg = 'Unable to remove HU.';
            //             sap.m.MessageToast.show(sMsg);
            //         },
            //     })
            //     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Pallet::responsiveTable-listUl");
            // },

            // updateSerialCont: function (oEvent) {
            //     //get user selected data and add leading zeroes where necessary
            //     var stat6 = oEvent.getSource().getParent().getParent().getBindingContext().getObject().stat6
            //     var stat7 = oEvent.getSource().getParent().getParent().getBindingContext().getObject().stat7
            //     var stat8 = oEvent.getSource().getParent().getParent().getBindingContext().getObject().stat8
            //     var stat9 = oEvent.getSource().getParent().getParent().getBindingContext().getObject().stat9
            //     var carrier = oEvent.getSource().getParent().getParent().getBindingContext().getObject().carrier
            //     var packMaterial = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().packMat;
            //     var plant = oEvent.getSource().getParent().getParent().getBindingContext().getObject().plant;
            //     var serialNumberList = []
            //     var hu = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().HUNum;
            //     var HUleadingZeroes = "00000000000" + hu;
            //     var finalHU = HUleadingZeroes.substr(HUleadingZeroes.length - 20);
            //     var oModelContainer = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_CONTAINER_EMPTY_SRV");
            //     var extensionAPI = this.extensionAPI

            //     //build container vh
            //     oModelContainer.read("/ZSCM_CONTAINER_L4/?$filter=materialNumber eq \'" + packMaterial + "\'and manufacturer eq \'" + carrier + "\'and plant eq \'" + plant + "\'", {
            //         success: function (oData, oResponse) {
            //             console.log(oData.results)
            //             var payload = "{\"items\":["
            //             for (let i = 0; i < (oData.results.length); i++) {
            //                 var serial = oData.results[i].serialNumber;
            //                 if (serialNumberList.includes(serial) == false) {
            //                     serialNumberList.push(serial)
            //                 }
            //             }
            //             var count = 0
            //             var count = 0
            //             for (let i = 0; i < serialNumberList.length; i++) {
            //                 var addToList = 0
            //                 var statComp = 0
            //                 var unuFlag = 0
            //                 var materialText = oData.results[i].materialText
            //                 var serialNumber = oData.results[i].serialNumber
            //                 var materialNumber = oData.results[i].materialNumber
            //                 var dayOwned = oData.results[i].dayOwned
            //                 var lastRecievedDate = oData.results[i].lastRecievedDate
            //                 var userStatustext = oData.results[i].userStatustext
            //                 var totalUserStat = ""

            //                 //check status of container matches customer status
            //                 if (stat6 != '' && stat6 != null && stat6 != 'FUM') {
            //                     statComp += 1
            //                 } else if (stat7 != '' && stat7 != null && stat7 != 'FUM') {
            //                     statComp += 1
            //                 } else if (stat8 != '' && stat8 != null && stat8 != 'FUM') {
            //                     statComp += 1
            //                 } else if (stat9 != '' && stat9 != null && stat9 != 'FUM') {
            //                     statComp += 1
            //                 }

            //                 if (userStatustext != undefined) {
            //                     userStatustext = userStatustext.nodeValue
            //                 } else {
            //                     userStatustext = ""
            //                 }
            //                 serial = serialNumberList[i]
            //                 for (let j = 0; j < (oData.results.length); j++) {
            //                     if ((serial == oData.results[j].serialNumber && oData.results[j].userStatustext != undefined)) {
            //                         totalUserStat += oData.results[i].userStatustext + " "
            //                     }
            //                 }
            //                 for (let j = 0; j < 4; j++) {
            //                     for (let k = 0; k < (oData.results.length); k++) {
            //                         if (serial == oData.results[k].serialNumber) {
            //                             var userStat = oData.results[k].userStatCode
            //                             console.log("userStat:" + userStat)
            //                             console.log("serial:" + serial)
            //                             if (userStat != undefined) {
            //                                 userStat = userStat.nodeValue
            //                             } else {
            //                                 userStat = ''
            //                             }
            //                             if (userStat == 'UNU') {
            //                                 unuFlag = 1
            //                             }
            //                             if (j == 0 && stat6 != '' && stat6 != null && stat6 != 'FUM') {
            //                                 if (stat6 == userStat) {
            //                                     addToList += 1
            //                                 }
            //                             } else if (j == 1 && stat7 != '' && stat7 != null && stat7 != 'FUM') {
            //                                 if (stat7 == userStat) {
            //                                     addToList += 1
            //                                 }
            //                             } else if (j == 2 && stat8 != '' && stat8 != null && stat8 != 'FUM') {
            //                                 if (stat8 == userStat) {
            //                                     addToList += 1
            //                                 }
            //                             } else if (j == 3 && stat9 != '' && stat9 != null && stat9 != 'FUM') {
            //                                 if (stat9 == userStat) {
            //                                     addToList += 1
            //                                 }
            //                             }
            //                         }
            //                     }
            //                 }
            //                 if (stat6 == '' && stat7 == '' && stat8 == '' && stat9 == '') {
            //                     addToList = 1
            //                     statComp = 1
            //                 }
            //                 if (statComp == addToList && unuFlag != 1) {
            //                     if (count >= 1) {
            //                         payload += ","
            //                     }
            //                     payload += "{\"materialText\":\"" + materialText + "\",\"serialNumber\":\"" + serial + "\",\"materialNumber\":\"" + materialNumber +
            //                         "\",\"dayOwned\":\"" + dayOwned + "\",\"lastRecievedDate\":\"" + lastRecievedDate + "\",\"userStatustext\":\"" +
            //                         totalUserStat + "\"}"
            //                     count += 1
            //                 }
            //             }
            //             payload += "]}"
            //             var fnDoSearch = function (oEvent, bProductSearch) {
            //                 var aFilters = [],
            //                     sSearchValue = oEvent.getParameter("value"),
            //                     itemsBinding = oEvent.getParameter("itemsBinding");

            //                 // create the local filter to apply
            //                 if (sSearchValue !== undefined && sSearchValue.length > 0) {
            //                     if (bProductSearch) {
            //                         // create multi-field filter to allow search over all attributes
            //                         aFilters.push(new sap.ui.model.Filter("ProductId", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         // apply the filter to the bound items, and the Select Dialog will update
            //                         itemsBinding.filter(aFilters, "Application");
            //                     } else {
            //                         // create multi-field filter to allow search over all attributes
            //                         aFilters.push(new sap.ui.model.Filter("materialNumber", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         aFilters.push(new sap.ui.model.Filter("materialText", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         aFilters.push(new sap.ui.model.Filter("serialNumber", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         aFilters.push(new sap.ui.model.Filter("userStatustext", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         aFilters.push(new sap.ui.model.Filter("lastRecievedDate", sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                         aFilters.push(new sap.ui.model.Filter("dayOwned", sap.ui.model.FilterOperator.Contains, sSearchValue));

            //                         // apply the filter to the bound items, and the Select Dialog will update
            //                         itemsBinding.filter(new sap.ui.model.Filter(aFilters, false), "Application"); // filters connected with OR
            //                     }
            //                 } else {
            //                     // filter with empty array to reset filters
            //                     itemsBinding.filter(aFilters, "Application");
            //                 }
            //             };

            //             // filter function for the product search
            //             var fnDoProductSearch = function (oEvent) {
            //                 fnDoSearch(oEvent, true);
            //             };

            //             // filter function to align the binding with the search term
            //             var fnCreatePrefilter = function (sSearchValue, bProductSearch) {
            //                 var aFilters = [];

            //                 // create the local filter to apply
            //                 if (sSearchValue !== undefined) {
            //                     aFilters.push(new sap.ui.model.Filter((bProductSearch ? "ProductId" : "serialNumber"), sap.ui.model.FilterOperator.Contains, sSearchValue));
            //                 }
            //                 return aFilters;
            //             };

            //             var fnPrefilterDialog = function (sSearchValue) {
            //                 // create an array to hold the filters we create
            //                 var aFilters = fnCreatePrefilter(sSearchValue),
            //                     itemsBinding = oTableSelectDialog1.getBinding("items");

            //                 itemsBinding.filter(aFilters, "Application");
            //             };

            //             /* dialog data */
            //             var oDialogData = {
            //                 title: "Please Select a Container",
            //                 noDataMessage: "Sorry, No Containers Available"
            //             };

            //             var oModelDialog = new sap.ui.model.json.JSONModel();
            //             oModelDialog.setData(oDialogData);

            //             // create the data to be shown in the table
            //             var oProductData1 = JSON.parse(payload)
            //             console.log(oProductData1)
            //             // create the model to hold the data
            //             var oModel1 = new sap.ui.model.json.JSONModel();
            //             oModel1.setDefaultBindingMode("OneWay");
            //             oModel1.setData(oProductData1);

            //             var fnCreateSimpleDialogColumns = function () {
            //                 return [
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         header: new sap.m.Label({
            //                             text: "Packaging Material",
            //                             wrapping: true
            //                         })
            //                     }),
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         popinDisplay: "Inline",
            //                         header: new sap.m.Label({
            //                             text: "Container Description",
            //                             wrapping: true
            //                         }),
            //                         minScreenWidth: "Tablet",
            //                         demandPopin: true
            //                     }),
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         popinDisplay: "Inline",
            //                         header: new sap.m.Label({
            //                             text: "Serial Number",
            //                             wrapping: true
            //                         }),
            //                         minScreenWidth: "Tablet",
            //                         demandPopin: true
            //                     }),
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         header: new sap.m.Label({
            //                             text: "User Status",
            //                             wrapping: true
            //                         }),
            //                         minScreenWidth: "Tablet",
            //                         demandPopin: true
            //                     }),
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         popinDisplay: "Inline",
            //                         header: new sap.m.Label({
            //                             text: "Container Latest Received date",
            //                             wrapping: true
            //                         }),
            //                         minScreenWidth: "Tablet",
            //                         demandPopin: true
            //                     }),
            //                     new sap.m.Column({
            //                         hAlign: "Begin",
            //                         header: new sap.m.Label({
            //                             text: "Amount of day in Manildra ownership",
            //                             wrapping: true
            //                         }),
            //                         minScreenWidth: "Tablet",
            //                         demandPopin: true
            //                     })]
            //             };

            //             // create our new Table Select Dialog
            //             var oTableSelectDialog1 = new sap.m.TableSelectDialog("TableSelectDialog1", {
            //                 title: "{dialog>/title}",
            //                 noDataText: "{dialog>/noDataMessage}",
            //                 search: fnDoSearch,
            //                 liveChange: fnDoSearch,
            //                 columns: [
            //                     fnCreateSimpleDialogColumns()
            //                 ]
            //             });

            //             // create the template for the items binding
            //             var oItemTemplate1 = new sap.m.ColumnListItem({
            //                 type: "Active",
            //                 unread: false,
            //                 cells: [
            //                     new sap.m.Label({
            //                         text: "{materialNumber}",
            //                         wrapping: true
            //                     }), new sap.m.Label({
            //                         text: "{materialText}",
            //                         wrapping: true
            //                     }), new sap.m.Label({
            //                         text: "{serialNumber}",
            //                         wrapping: true
            //                     }), new sap.m.Label({
            //                         text: "{userStatustext}",
            //                         wrapping: true
            //                     }), new sap.m.Label({
            //                         text: "{lastRecievedDate}",
            //                         wrapping: true
            //                     }), new sap.m.Label({
            //                         text: "{dayOwned}",
            //                         wrapping: true
            //                     })
            //                 ]
            //             });

            //             // attach confirm listener
            //             oTableSelectDialog1.attachCancel(function (evt) {
            //                 //oTableSelectDialog1.destroy();
            //                 cancel = 1

            //             });
            //             var input1 = new sap.m.Input("Input1", {
            //                 maxLength: 20,
            //                 showValueHelp: true,
            //                 id: "Container"
            //             });

            //             var oButton3 = new sap.m.Button("Cancel", {
            //                 text: "Cancel"
            //             });

            //             var oButton2 = new sap.m.Button("OK", {
            //                 text: "OK"
            //             });

            //             oButton3.attachPress(function (evt) {
            //                 oDialog.close();
            //                 oDialog.destroy();
            //                 oTableSelectDialog1.destroy();
            //             });

            //             oButton2.attachPress(function (evt) {
            //                 var serial = sap.ui.getCore().byId("Input1").getValue()
            //                 console.log(serial)
            //                 if (serial != '') {
            //                     var oUpdateSerialNum = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

            //                     oUpdateSerialNum.callFunction("/updateSerialNumber", {
            //                         method: "POST",
            //                         urlParameters: {
            //                             serialNumber: serial,
            //                             HU_EXID: finalHU
            //                         },
            //                         success: function (oData, oResponse) {
            //                             console.log(oData)
            //                             extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Container::Table");
            //                             sap.m.MessageToast.show("Serial Updated");
            //                             oDialog.close();
            //                             oDialog.destroy();
            //                             oTableSelectDialog1.destroy();
            //                         },
            //                         error: function (oError) {
            //                             sap.m.MessageToast.show('Unable to Update Serial');
            //                             oDialog.close();
            //                             oDialog.destroy();
            //                             oTableSelectDialog1.destroy();
            //                         }
            //                     })
            //                 } else {
            //                     oDialog.close();
            //                     oDialog.destroy();
            //                     oTableSelectDialog1.destroy();
            //                 }
            //             })

            //             var oDialog = new sap.m.Dialog("Dialog1", {
            //                 title: "Select Container Details",
            //                 contentWidth: "40%",
            //                 closeOnNavigation: true,
            //                 buttons: [oButton2, oButton3],
            //                 content: [
            //                     new sap.m.Label({ text: "Select Container" }),
            //                     input1,
            //                 ]
            //             });

            //             oDialog.addStyleClass("sapUiContentPadding");

            //             input1.attachValueHelpRequest(function (evt) {
            //                 oTableSelectDialog1.open();
            //                 oTableSelectDialog1.bindAggregation("items", "/items", oItemTemplate1);
            //                 oTableSelectDialog1.setModel(oModel1);
            //             });

            //             oTableSelectDialog1.attachConfirm(function (evt) {

            //                 var selectedItem = evt.getParameter("selectedItem");
            //                 if (selectedItem) {
            //                     //Get all the cells and pull back the first one which will be the name content
            //                     var oCells = selectedItem.getCells();
            //                     var oCell = oCells[2];
            //                     //Now update the input with the value
            //                     serialNumber = oCell.getText()
            //                     //oTableSelectDialog1.destroy();
            //                     sap.ui.getCore().byId("Input1").setValue(oCell.getText())
            //                     console.log(sap.ui.getCore().byId("Input1"))
            //                 }
            //             });

            //             oDialog.open();
            //         },
            //         error: function (oError) {
            //             sap.m.MessageToast.show('Unable to Update Serial');
            //         }
            //     });

            // },

            addBatchBakery: function (oEvent) {

                //get user selected data and add leading zeroes where necessary

                var transportOrder = "00000000000000000000" + oEvent.getSource().getParent().getParent().getBindingContext().getObject().transportOrder;
                transportOrder = transportOrder.substr(transportOrder.length - 20);
                var material = "000000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().material;
                material = material.substr(material.length - 18);
                var totalQauntMixed = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().quant
                var plant = oEvent.getSource().getParent().getParent().getBindingContext().getObject().plant;
                var Odelivery = "0000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDelivery;
                Odelivery = Odelivery.substr(Odelivery.length - 10);
                var mixtype = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().mixtype;
                var batch;
                var qty;
                var extensionAPI = this.extensionAPI
                var storLoc = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().storLoc
                var totalQaunt = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().TotalQuant
                var busy = new sap.m.BusyDialog();
                busy.open()


                if (sap.ui.getCore().byId("OK") === undefined) {
                    var oButton1 = new sap.m.Button("OK", {
                        text: "OK"
                    });
                }
                else if (sap.ui.getCore().byId("OK") != undefined) {
                    var oButton1 = sap.ui.getCore().byId("OK");
                }

                if (sap.ui.getCore().byId("Continue") === undefined) {
                    var oButton4 = new sap.m.Button("Continue", {
                        text: "Continue"
                    });
                }
                else if (sap.ui.getCore().byId("Continue") != undefined) {
                    var oButton4 = sap.ui.getCore().byId("Continue");
                }

                if (sap.ui.getCore().byId("Cancel") === undefined) {
                    var oButton2 = new sap.m.Button("Cancel", {
                        text: "Cancel"
                    });
                }
                else if (sap.ui.getCore().byId("Cancel") != undefined) {
                    var oButton2 = sap.ui.getCore().byId("Cancel");
                }
                if (sap.ui.getCore().byId("Cancel2") === undefined) {
                    var oButton3 = new sap.m.Button("Cancel2", {
                        text: "Cancel"
                    });
                }
                else if (sap.ui.getCore().byId("Cancel2") != undefined) {
                    var oButton3 = sap.ui.getCore().byId("Cancel2");
                }
                if (sap.ui.getCore().byId("Cancel3") === undefined) {
                    var oButton5 = new sap.m.Button("Cancel3", {
                        text: "Cancel"
                    });
                }
                else if (sap.ui.getCore().byId("Cancel3") != undefined) {
                    var oButton5 = sap.ui.getCore().byId("Cancel3");
                }
                //if cancel destroy dialog
                // oButton3.attachPress(function (evt) {
                //     busy.close()
                //     if (sap.ui.getCore().byId("Dialog1") != undefined) {
                //         sap.ui.getCore().byId("Dialog1").close();
                //         sap.ui.getCore().byId("Dialog1").destroy();
                //     }

                //     if (sap.ui.getCore().byId("Dialog2") != undefined) {
                //         sap.ui.getCore().byId("Dialog2").close();
                //         sap.ui.getCore().byId("Dialog2").destroy();
                //     }
                //     // sap.ui.getCore().byId("Dialog2").close();
                //     // sap.ui.getCore().byId("Dialog2").destroy();
                //     // sap.ui.getCore().byId("Dialog1").close();
                //     // sap.ui.getCore().byId("Dialog1").destroy();
                // });

                //if cancel destroy dialog
                // oButton5.attachPress(function (evt) {
                //     busy.close()
                //     if (sap.ui.getCore().byId("Dialog1") != undefined) {
                //         sap.ui.getCore().byId("Dialog1").close();
                //         sap.ui.getCore().byId("Dialog1").destroy();
                //     }

                //     if (sap.ui.getCore().byId("Dialog2") != undefined) {
                //         sap.ui.getCore().byId("Dialog2").close();
                //         sap.ui.getCore().byId("Dialog2").destroy();
                //     }

                //     if (sap.ui.getCore().byId("Dialog3") != undefined) {
                //         sap.ui.getCore().byId("Dialog3").close();
                //         sap.ui.getCore().byId("Dialog3").destroy();
                //     }

                //     if (sap.ui.getCore().byId("Dialog4") != undefined) {
                //         sap.ui.getCore().byId("Dialog4").close();
                //         sap.ui.getCore().byId("Dialog4").destroy();
                //     }
                // });

                // oButton4.attachPress(function (evt) {
                //     var returnMessage = ""
                //     //get data for picking from cds ZSCM_I_Bakery_PickList_L2
                //     var oBakeryList = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");

                //     oBakeryList.read("/ZSCM_I_Bakery_PickList_L2?$filter=transportOrder eq \'" + transportOrder + "\' and material eq \'" + material + "\'", {
                //         success: function (oData, oResponse) {
                //             var stopFlag = qty;
                //             for (let i = 0; i < (oData.results.length); i++) {
                //                 if (Odelivery == oData.results[i].outboundDelivery) {
                //                     var outboundDelivery = "000000000" + oData.results[i].outboundDelivery
                //                     outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
                //                     var item = "0000" + oData.results[i].item
                //                     item = item.substr(item.length - 6);
                //                     var uom = oData.results[i].uom
                //                     var quant = parseInt(oData.results[i].quant)
                //                     var pickQaunt = parseInt(oData.results[i].quant)
                //                     // var leftToPick = quant-pickQaunt; After batch split the line returns remaining values only not the whole quantity
                //                     var leftToPick = quant;
                //                     var setPick = 0
                //                     var setQuant = 0
                //                     var temp = parseInt(stopFlag, 10);
                //                     if (leftToPick < temp) {
                //                         setQuant = leftToPick
                //                     } else {
                //                         setQuant = temp
                //                     }
                //                     stopFlag = parseInt(stopFlag, 10) - quant;
                //                     if (stopFlag <= 0) {
                //                         // var setPick = pickQaunt + setQuant;
                //                         var setPick = setQuant;

                //                         var oAssignBatch = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")
                //                         oAssignBatch.callFunction("/addBatchToDelivery", {
                //                             method: "POST",
                //                             urlParameters: {
                //                                 batch: batch,
                //                                 deliveryItem: item,
                //                                 deliveryNumber: outboundDelivery,
                //                                 uom: uom,
                //                                 pickAmount: setPick,
                //                                 qty: setPick,
                //                                 bakeryFlag: true
                //                             },

                //                             success: function (oData, oResponse) {
                //                                 if (oData.Type == 'E') {
                //                                     sap.m.MessageBox.error(oData.Message);
                //                                 } else {
                //                                     // returnMessage = returnMessage + " delivery " + outboundDelivery + " was short picked. Please select another batch. "
                //                                     sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                //                                         duration: 3000,                  // default
                //                                         width: "15em",                   // default
                //                                         my: "center bottom",             // default
                //                                         at: "center bottom",             // default
                //                                         of: window,                      // default
                //                                         offset: "0 0",                   // default
                //                                         collision: "fit fit",            // default
                //                                         onClose: null,                   // default
                //                                         autoClose: true,                 // default
                //                                         animationTimingFunction: "ease", // default
                //                                         animationDuration: 1000,         // default
                //                                         closeOnBrowserNavigation: true   // default
                //                                     });
                //                                     //refresh table
                //                                     if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                //                                         sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                //                                     }
                //                                     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                //                                     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                //                                 }
                //                             },
                //                             error: function () {
                //                                 var sMsg = 'Unable to assign Batch.'
                //                                 sap.m.MessageToast.show(sMsg);
                //                             }
                //                         })
                //                         break;
                //                     } else {
                //                         var setPick = pickQaunt + quant;
                //                         var oAssignBatch = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")

                //                         oAssignBatch.callFunction("/addBatchToDelivery", {
                //                             method: "POST",
                //                             urlParameters: {
                //                                 batch: batch,
                //                                 deliveryItem: item,
                //                                 deliveryNumber: outboundDelivery,
                //                                 uom: uom,
                //                                 pickAmount: setPick,
                //                                 qty: setPick,
                //                                 bakeryFlag: true
                //                             },

                //                             success: function (oData, oResponse) {
                //                                 if (oData.Type == 'E') {
                //                                     sap.m.MessageBox.error(oData.Message);
                //                                 } else {
                //                                     sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                //                                         duration: 3000,                  // default
                //                                         width: "15em",                   // default
                //                                         my: "center bottom",             // default
                //                                         at: "center bottom",             // default
                //                                         of: window,                      // default
                //                                         offset: "0 0",                   // default
                //                                         collision: "fit fit",            // default
                //                                         onClose: null,                   // default
                //                                         autoClose: true,                 // default
                //                                         animationTimingFunction: "ease", // default
                //                                         animationDuration: 1000,         // default
                //                                         closeOnBrowserNavigation: true   // default
                //                                     });
                //                                     //refresh table
                //                                     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                //                                     extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                //                                     if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                //                                         console.log("14")
                //                                         sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                //                                     }
                //                                 }
                //                             },
                //                             error: function () {
                //                                 var sMsg = 'Unable to assign Batch.'
                //                                 sap.m.MessageToast.show(sMsg);
                //                             }
                //                         })

                //                     }
                //                 }

                //             }
                //             busy.close()
                //         },
                //         error: function (oError) {
                //             console.log(oError)
                //             sap.m.MessageBox.error(oError);
                //             busy.close()
                //         },

                //     })
                //     if (sap.ui.getCore().byId("Dialog1") != undefined) {
                //         sap.ui.getCore().byId("Dialog1").close();
                //         sap.ui.getCore().byId("Dialog1").destroy();
                //         busy.close()
                //     }

                //     if (sap.ui.getCore().byId("Dialog2") != undefined) {
                //         sap.ui.getCore().byId("Dialog2").close();
                //         sap.ui.getCore().byId("Dialog2").destroy();
                //         busy.close()
                //     }
                // });

                oButton2.attachPress(function (evt) {
                    busy.close()
                    if (sap.ui.getCore().byId("Dialog1") != undefined) {
                        sap.ui.getCore().byId("Dialog1").close();
                        sap.ui.getCore().byId("Dialog1").destroy();
                    }

                    if (sap.ui.getCore().byId("Dialog2") != undefined) {
                        sap.ui.getCore().byId("Dialog2").close();
                        sap.ui.getCore().byId("Dialog2").destroy();
                    }
                });

                oButton1.attachPress(function (evt) {
                    qty = sap.ui.getCore().byId("Qty").getValue()
                    batch = sap.ui.getCore().byId("Batch").getValue()
                    ///?$filter=Matnr eq \'" + material + "\' and Werks eq \'" + plant + "\' and Charg eq \'" + batch + "\'"
                    // var filters = new Array()
                    // var filter = new sap.ui.model.Filter({
                    //     path: "Matnr",
                    //     operator: sap.ui.model.FilterOperator.EQ,
                    //     value1: material},
                    // {   path: "Werks",
                    //     operator: sap.ui.model.FilterOperator.EQ,
                    //     value1: plant},
                    // {   path: "Charg",
                    //     operator: sap.ui.model.FilterOperator.EQ,
                    //     value1: batch}
                    // );
                    ;
                    var obatchCheck = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                    var filtersBatchCheck = new Array()
                    var filterBatchCheck = new sap.ui.model.Filter({
                        path: "Matnr",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: material}
                    );
                    filtersBatchCheck.push(filterBatchCheck)
                    filterBatchCheck = new sap.ui.model.Filter(
                        {path: "Werks",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: plant}
                    );
                    filtersBatchCheck.push(filterBatchCheck)
                    filterBatchCheck = new sap.ui.model.Filter(
                        {path: "Charg",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: batch}
                    );
                    filtersBatchCheck.push(filterBatchCheck)
                    obatchCheck.read("/ZSCM_I_ValidBatch", {
                    //?$filter=Matnr eq \'" + material + "\' and Werks eq \'" + plant + "\' and Charg eq \'" + batch + "\'", {
                       // filters: filters,
                       filters: filtersBatchCheck,
                        success: function (oData, oResponse) {
                            if (oData.results.length > 0) {
                                if (qty == "" || qty <= 0) {
                                    sap.m.MessageToast.show("Please Enter Qty");
                                    //busy.close()
                                } else if (Number.isInteger(parseFloat(qty, 2)) == false) {
                                    sap.m.MessageToast.show("Cannot pick a decimal");
                                } else if (oData.results[0].lgort != storLoc) {

                                    // oDialog4.open();
                                    if (sap.ui.getCore().byId("Dialog1") != undefined) {
                                        sap.ui.getCore().byId("Dialog1").close();
                                        sap.ui.getCore().byId("Dialog1").destroy();
                                    }

                                    if (sap.ui.getCore().byId("Dialog2") != undefined) {
                                        sap.ui.getCore().byId("Dialog2").close();
                                        sap.ui.getCore().byId("Dialog2").destroy();
                                    }
                                    if (sap.ui.getCore().byId("Dialog2") == undefined) {
                                        //console.log("here")
                                        sap.m.MessageBox.error("Batch does not have stock in the picking storage location.");
                                    }
                                    //busy.close()
                                
                                // else if (parseInt(qty, 10) > oData.results[0].stock) {
                                //     console.log(">=")
                                //     if (sap.ui.getCore().byId("Dialog1") != undefined) {
                                //         sap.ui.getCore().byId("Dialog1").close();
                                //         sap.ui.getCore().byId("Dialog1").destroy();
                                //     }

                                //     if (sap.ui.getCore().byId("Dialog2") != undefined) {
                                //         sap.ui.getCore().byId("Dialog2").close();
                                //         sap.ui.getCore().byId("Dialog2").destroy();
                                //     }

                                //     if (sap.ui.getCore().byId("Dialog2") == undefined) {
                                //         sap.m.MessageBox.error("Insufficient inventory for the nominated batch.");
                                //     }


                                // }
                                } else { //} if (parseInt(qty, 10) <= oData.results[0].stock) {

                                    if (sap.ui.getCore().byId("Dialog1") != undefined) {
                                        sap.ui.getCore().byId("Dialog1").close();
                                        sap.ui.getCore().byId("Dialog1").destroy();
                                    }

                                    if (sap.ui.getCore().byId("Dialog2") != undefined) {
                                        sap.ui.getCore().byId("Dialog2").close();
                                        sap.ui.getCore().byId("Dialog2").destroy();
                                    }

                                    if ((parseInt(qty, 10) < parseInt(totalQauntMixed, 10)) && (mixtype == "Mixed")) {
                                        // var oDialog2 = new sap.m.Dialog("Dialog2", {
                                        //     title: "Warning",
                                        //     //state: sap.ui.core.ValueState.Warning,
                                        //     content: [
                                        //         new sap.m.Text({ text: "You have short picked the material. If you plan to split batch continue otherwise cancel and amend delivery." })
                                        //     ],
                                        //     contentWidth: "20%",
                                        //     closeOnNavigation: true,
                                        //     buttons: [oButton3, oButton4]
                                        // });
                                        // oDialog2.open();
                                        console.log("here rebind")
                                        MessageBox.warning("You have short picked the material. If you plan to split batch continue otherwise cancel and amend delivery.", {
                                            actions: ["Continue", MessageBox.Action.CLOSE],
                                            emphasizedAction: "Continue",
                                            onClose: function (sAction) {
                                                if (sAction == "Continue") {
                                                    //onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI)
                                                    var returnMessage = ""
                                                    //get data for picking from cds ZSCM_I_Bakery_PickList_L2
                                                    var oBakeryList = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                                                    var filtersBakeryList= new Array()
                                                    var filterBakeryList = new sap.ui.model.Filter({
                                                        path: "transportOrder",
                                                        operator: sap.ui.model.FilterOperator.EQ,
                                                        value1: transportOrder}
                                                    );
                                                    filtersBakeryList.push(filterBakeryList)
                                                    filterBakeryList = new sap.ui.model.Filter(
                                                        {path: "material",
                                                        operator: sap.ui.model.FilterOperator.EQ,
                                                        value1: material}
                                                    );
                                                    filtersBakeryList.push(filterBakeryList)
                                                    oBakeryList.read("/ZSCM_I_Bakery_PickList_L2", { //?$filter=transportOrder eq \'" + transportOrder + "\' and material eq \'" + material + "\'", {
                                                        filters: filtersBakeryList,
                                                        success: function (oData, oResponse) {
                                                            var stopFlag = qty;
                                                            for (let i = 0; i < (oData.results.length); i++) {
                                                                if (Odelivery == oData.results[i].outboundDelivery) {
                                                                    var outboundDelivery = "000000000" + oData.results[i].outboundDelivery
                                                                    outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
                                                                    var item = "0000" + oData.results[i].item
                                                                    item = item.substr(item.length - 6);
                                                                    var uom = oData.results[i].uom
                                                                    var quant = parseInt(oData.results[i].quant)
                                                                    var pickQaunt = parseInt(oData.results[i].quant)
                                                                    // var leftToPick = quant-pickQaunt; After batch split the line returns remaining values only not the whole quantity
                                                                    var leftToPick = quant;
                                                                    var setPick = 0
                                                                    var setQuant = 0
                                                                    var temp = parseInt(stopFlag, 10);
                                                                    if (leftToPick < temp) {
                                                                        setQuant = leftToPick
                                                                    } else {
                                                                        setQuant = temp
                                                                    }
                                                                    stopFlag = parseInt(stopFlag, 10) - quant;
                                                                    if (stopFlag <= 0) {
                                                                        // var setPick = pickQaunt + setQuant;
                                                                        var setPick = setQuant;
                                
                                                                        var oAssignBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")
                                                                        oAssignBatch.callFunction("/addBatchToDelivery", {
                                                                            method: "POST",
                                                                            urlParameters: {
                                                                                batch: batch,
                                                                                deliveryItem: item,
                                                                                deliveryNumber: outboundDelivery,
                                                                                uom: uom,
                                                                                pickAmount: setPick,
                                                                                qty: setPick,
                                                                                bakeryFlag: true
                                                                            },
                                
                                                                            success: function (oData, oResponse) {
                                                                                if (oData.Type == 'E') {
                                                                                    sap.m.MessageBox.error(oData.Message);
                                                                                } else {
                                                                                    // returnMessage = returnMessage + " delivery " + outboundDelivery + " was short picked. Please select another batch. "
                                                                                    sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                                                                                        duration: 3000,                  // default
                                                                                        width: "15em",                   // default
                                                                                        my: "center bottom",             // default
                                                                                        at: "center bottom",             // default
                                                                                        of: window,                      // default
                                                                                        offset: "0 0",                   // default
                                                                                        collision: "fit fit",            // default
                                                                                        onClose: null,                   // default
                                                                                        autoClose: true,                 // default
                                                                                        animationTimingFunction: "ease", // default
                                                                                        animationDuration: 1000,         // default
                                                                                        closeOnBrowserNavigation: true   // default
                                                                                    });
                                                                                    //refresh table
                                                                                    if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                                                                                        sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                                                                                    }
                                                                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                                                                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                                                                                }
                                                                            },
                                                                            error: function () {
                                                                                var sMsg = 'Unable to assign Batch.'
                                                                                sap.m.MessageToast.show(sMsg);
                                                                            }
                                                                        })
                                                                        break;
                                                                    } else {
                                                                        var setPick = pickQaunt + quant;
                                                                        var oAssignBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")
                                
                                                                        oAssignBatch.callFunction("/addBatchToDelivery", {
                                                                            method: "POST",
                                                                            urlParameters: {
                                                                                batch: batch,
                                                                                deliveryItem: item,
                                                                                deliveryNumber: outboundDelivery,
                                                                                uom: uom,
                                                                                pickAmount: setPick,
                                                                                qty: setPick,
                                                                                bakeryFlag: true
                                                                            },
                                
                                                                            success: function (oData, oResponse) {
                                                                                if (oData.Type == 'E') {
                                                                                    sap.m.MessageBox.error(oData.Message);
                                                                                } else {
                                                                                    sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                                                                                        duration: 3000,                  // default
                                                                                        width: "15em",                   // default
                                                                                        my: "center bottom",             // default
                                                                                        at: "center bottom",             // default
                                                                                        of: window,                      // default
                                                                                        offset: "0 0",                   // default
                                                                                        collision: "fit fit",            // default
                                                                                        onClose: null,                   // default
                                                                                        autoClose: true,                 // default
                                                                                        animationTimingFunction: "ease", // default
                                                                                        animationDuration: 1000,         // default
                                                                                        closeOnBrowserNavigation: true   // default
                                                                                    });
                                                                                    //refresh table
                                                                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                                                                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                                                                                    if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                                                                                        console.log("14")
                                                                                        sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                                                                                    }
                                                                                }
                                                                            },
                                                                            error: function () {
                                                                                var sMsg = 'Unable to assign Batch.'
                                                                                sap.m.MessageToast.show(sMsg);
                                                                            }
                                                                        })
                                
                                                                    }
                                                                }
                                
                                                            }
                                                            busy.close()
                                                        },
                                                        error: function (oError) {
                                                            console.log(oError)
                                                            sap.m.MessageBox.error(oError);
                                                            busy.close()
                                                        },
                                
                                                    })
                                                    if (sap.ui.getCore().byId("Dialog1") != undefined) {
                                                        sap.ui.getCore().byId("Dialog1").close();
                                                        sap.ui.getCore().byId("Dialog1").destroy();
                                                        busy.close()
                                                    }
                                
                                                    if (sap.ui.getCore().byId("Dialog2") != undefined) {
                                                        sap.ui.getCore().byId("Dialog2").close();
                                                        sap.ui.getCore().byId("Dialog2").destroy();
                                                        busy.close()
                                                    }

                                                }
                                            }
                                        });
                                    // } else if ((parseInt(qty, 10) < parseInt(totalQauntMixed, 10)) && (mixtype != "Mixed")) {

                                    //     var oDialog2 = new sap.m.Dialog("Dialog2", {
                                    //         title: "Warning",
                                    //         state: sap.ui.core.ValueState.Warning,
                                    //         content: [
                                    //             new sap.m.Text({ text: "You have short picked the material. If you plan to split batch continue otherwise cancel and amend delivery." })
                                    //         ],
                                    //         contentWidth: "20%",
                                    //         closeOnNavigation: true,
                                    //         buttons: [oButton3, oButton4]
                                    //     });
                                    //     oDialog2.open();
                                    // // }
                                    } 
                                    
                                    else if ((parseInt(qty, 10) > parseInt(totalQauntMixed, 10)) && (mixtype == "Mixed")) {
                                        sap.m.MessageBox.error("Overpicked than the requested quantity in delivery.");

                                    } 
                                    
                                    else if ((parseInt(qty, 10) > parseInt(totalQauntMixed, 10)) && mixtype != "Mixed")
                                    //((parseInt(qty, 10) >= parseInt(totalQaunt, 10)) && (mixtype != "Mixed"))
                                    // Condition incase of overpicked
                                    {
                                        console.log("here1")

                                        // Condition for overflow of quantity - split the quantity for the same material for two different deliveries
                                        // Total to be picked - totalQuant
                                        // qty - from screen input
                                        var oBakeryList = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                                        var filtersBakeryList= new Array()
                                        var filterBakeryList = new sap.ui.model.Filter({
                                            path: "transportOrder",
                                            operator: sap.ui.model.FilterOperator.EQ,
                                            value1: transportOrder}
                                        );
                                        filtersBakeryList.push(filterBakeryList)
                                        filterBakeryList = new sap.ui.model.Filter(
                                            {path: "material",
                                            operator: sap.ui.model.FilterOperator.EQ,
                                            value1: material}
                                        );
                                        filtersBakeryList.push(filterBakeryList)
                                        filterBakeryList = new sap.ui.model.Filter(
                                            {path: "mixtype",
                                            operator: sap.ui.model.FilterOperator.EQ,
                                            value1: "Unmixed"}
                                        );
                                        filtersBakeryList.push(filterBakeryList)
                                        //var oBakeryList = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                                        oBakeryList.read("/ZSCM_I_Bakery_PickList_L2", { //?$filter=transportOrder eq \'" + transportOrder + "\' and mixtype eq \'Unmixed\' and material eq \'" + material + "\'", {
                                            filters: filtersBakeryList,
                                            success: function (oData, oResponse) {
                                                console.log(oData)
                                                var toBePicked = 0
                                                for (let i = 0; i < (oData.results.length); i++) {
                                                    toBePicked += parseInt(oData.results[i].quant, 10)
                                                }
                                                if (parseInt(qty, 10) <= toBePicked) {
                                                    var filtersBakeryList= new Array()
                                                    var filterBakeryList = new sap.ui.model.Filter({
                                                        path: "transportOrder",
                                                        operator: sap.ui.model.FilterOperator.EQ,
                                                        value1: transportOrder}
                                                    );
                                                    filtersBakeryList.push(filterBakeryList)
                                                    filterBakeryList = new sap.ui.model.Filter(
                                                        {path: "material",
                                                        operator: sap.ui.model.FilterOperator.EQ,
                                                        value1: material}
                                                    );
                                                    filtersBakeryList.push(filterBakeryList)
                                                    oBakeryList.read("/ZSCM_I_Bakery_PickList_L2", { //?$filter=transportOrder eq \'" + transportOrder + "\' and material eq \'" + material + "\'", {
                                                        filters: filtersBakeryList,
                                                        success: function (oData, oResponse) {
                                                            var tobepicked = parseInt(qty, 10);
                                                            for (let i = 0; i < (oData.results.length); i++) {
                                                                // iteration to assign the max allowed quantity for the selected delivery
                                                                //debugger
                                                                if (Odelivery == oData.results[i].outboundDelivery) {
                                                                    var outboundDelivery = "000000000" + oData.results[i].outboundDelivery
                                                                    outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
                                                                    var item = "0000" + oData.results[i].item
                                                                    item = item.substr(item.length - 6);
                                                                    var uom = oData.results[i].uom
                                                                    var quant = parseInt(oData.results[i].quant, 10);
                                                                    // Use the to be picked for next iteration
                                                                    tobepicked = tobepicked - quant;


                                                                    console.log(oData)
                                                                    console.log(oResponse.headers.etag)

                                                                    var oAssignBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")

                                                                    oAssignBatch.callFunction("/addBatchToDelivery", {
                                                                        method: "POST",
                                                                        urlParameters: {
                                                                            batch: batch,
                                                                            deliveryItem: item,
                                                                            deliveryNumber: outboundDelivery,
                                                                            uom: uom,
                                                                            pickAmount: quant,
                                                                            qty: quant,
                                                                            bakeryFlag: true
                                                                        },

                                                                        success: function (oData, oResponse) {
                                                                            if (oData.Type == 'E') {
                                                                                sap.m.MessageBox.error(oData.Message);
                                                                            } else {
                                                                                //console.log(data);
                                                                                sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                                                                                    duration: 3000,                  // default
                                                                                    width: "15em",                   // default
                                                                                    my: "center bottom",             // default
                                                                                    at: "center bottom",             // default
                                                                                    of: window,                      // default
                                                                                    offset: "0 0",                   // default
                                                                                    collision: "fit fit",            // default
                                                                                    onClose: null,                   // default
                                                                                    autoClose: true,                 // default
                                                                                    animationTimingFunction: "ease", // default
                                                                                    animationDuration: 1000,         // default
                                                                                    closeOnBrowserNavigation: true   // default
                                                                                });
                                                                                extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                                                                                console.log("10")

                                                                                if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                                                                                    console.log("11")
                                                                                    sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                                                                                }
                                                                                extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                                                                            }
                                                                        }.bind(this),
                                                                        error: function () {
                                                                            //console.log(data)
                                                                            var sMsg = 'Unable to assign Batch.'
                                                                            // sap.m.MessageBox.error(sMsg);
                                                                            sap.m.MessageToast.show(sMsg);
                                                                        }
                                                                    })



                                                                }
                                                            }
                                                            // Second Iteration
                                                            if (tobepicked > 0) {
                                                                for (let i = 0; i < (oData.results.length); i++) {
                                                                    // iteration to assign the max allowed quantity for the selected delivery
                                                                    if (tobepicked > 0) {
                                                                        if (Odelivery != oData.results[i].outboundDelivery) {
                                                                            var outboundDelivery1 = "000000000" + oData.results[i].outboundDelivery
                                                                            outboundDelivery1 = outboundDelivery1.substr(outboundDelivery1.length - 10);
                                                                            var item1 = "0000" + oData.results[i].item
                                                                            item1 = item1.substr(item1.length - 6);
                                                                            var uom1 = oData.results[i].uom
                                                                            var quant1 = parseInt(oData.results[i].quant, 10);
                                                                            if (quant1 > tobepicked) {
                                                                                //  // to be picked = 0 as there's no next iteration & load the current with available quantity
                                                                                quant1 = tobepicked;
                                                                                tobepicked = 0;

                                                                            }
                                                                            else if (quant1 == tobepicked) {
                                                                                // to be picked = 0 as there's no next iteration & full load the current
                                                                                tobepicked = 0;

                                                                            }
                                                                            else if (quant1 < tobepicked) {
                                                                                // Use the to be picked for next iteration & full load the current
                                                                                tobepicked = tobepicked - quant1;

                                                                            } else if (quant1 == 0) {
                                                                                // exit loop
                                                                                break;

                                                                            }
                                                                            var oRemoveHU = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

                                                                            oRemoveHU.callFunction("/addBatchToDelivery", {
                                                                                method: "POST",
                                                                                urlParameters: {
                                                                                    batch: batch,
                                                                                    deliveryItem: item1,
                                                                                    deliveryNumber: outboundDelivery1,
                                                                                    uom: uom1,
                                                                                    pickAmount: quant1,
                                                                                    qty: quant1,
                                                                                    bakeryFlag: true
                                                                                }
                                                                                
                                                                            })
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            // Second Iteration - End
                                                        }.bind(this),
                                                        error: function (oError) {
                                                            console.log(oError)
                                                        }
                                                    })
                                                } else {
                                                    sap.m.MessageBox.error("Overpicked than the requested quantity in delivery.");
                                                }
                                            }
                                        })
                                    } 
                                    
                                    else {
                                        // If picked quant & to be picked are of same quantity
                                        //get rid of redundent stufff
                                        var oBakeryList = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                                        var filtersBakeryList= new Array()
                                        var filterBakeryList = new sap.ui.model.Filter({
                                            path: "transportOrder",
                                            operator: sap.ui.model.FilterOperator.EQ,
                                            value1: transportOrder}
                                        );
                                        filtersBakeryList.push(filterBakeryList)
                                        filterBakeryList = new sap.ui.model.Filter(
                                            {path: "material",
                                            operator: sap.ui.model.FilterOperator.EQ,
                                            value1: material}
                                        );
                                        filtersBakeryList.push(filterBakeryList)
                                       // var oBakeryList = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGAPP_SRV");
                                        console.log("here3")
                                        oBakeryList.read("/ZSCM_I_Bakery_PickList_L2", { //?$filter=transportOrder eq \'" + transportOrder + "\' and material eq \'" + material + "\'", {
                                            filters: filtersBakeryList,
                                            success: function (oData, oResponse) {

                                                for (let i = 0; i < (oData.results.length); i++) {
                                                    console.log(oData.results[i].outboundDelivery)
                                                    console.log(Odelivery)
                                                    if (Odelivery == oData.results[i].outboundDelivery) {

                                                        var outboundDelivery = "000000000" + oData.results[i].outboundDelivery
                                                        outboundDelivery = outboundDelivery.substr(outboundDelivery.length - 10);
                                                        var item = "0000" + oData.results[i].item
                                                        item = item.substr(item.length - 6);
                                                        var uom = oData.results[i].uom
                                                        var quant = parseInt(oData.results[i].quant, 10);
                                                        if (parseInt(qty, 10) < parseInt(quant, 10)) {
                                                            quant = qty;
                                                        }

                                                        var oAssignBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV")

                                                        oAssignBatch.callFunction("/addBatchToDelivery", {
                                                            method: "POST",
                                                            urlParameters: {
                                                                batch: batch,
                                                                deliveryItem: item,
                                                                deliveryNumber: outboundDelivery,
                                                                uom: uom,
                                                                pickAmount: quant,
                                                                qty: quant,
                                                                bakeryFlag: true
                                                            },
                                                            success: function (oData, oResponse) {
                                                                if (oData.Type == 'E') {
                                                                    sap.m.MessageBox.error(oData.Message);
                                                                } else {
                                                                    sap.m.MessageToast.show("Batch " + batch + " added to delivery " + outboundDelivery, {
                                                                        duration: 3000,                  // default
                                                                        width: "15em",                   // default
                                                                        my: "center bottom",             // default
                                                                        at: "center bottom",             // default
                                                                        of: window,                      // default
                                                                        offset: "0 0",                   // default
                                                                        collision: "fit fit",            // default
                                                                        onClose: null,                   // default
                                                                        autoClose: true,                 // default
                                                                        animationTimingFunction: "ease", // default
                                                                        animationDuration: 1000,         // default
                                                                        closeOnBrowserNavigation: true   // default
                                                                    });
                                                                    //refresh table
                                                                    extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                                                                    extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                                                                    if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                                                                        console.log("12")
                                                                        sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                                                                    }
                                                                }
                                                            }.bind(this),
                                                            error: function (oError) {
                                                                var sMsg = 'Unable to assign Batch.'
                                                                sap.m.MessageToast.show(sMsg);
                                                                console.log(oError)
                                                            }
                                                        })
                                                    }
                                                }
                                            },
                                            error: function (oError) {
                                                console.log(oError)
                                            }
                                        })
                                    }
                                    //refresh table
                                    extensionAPI.rebind("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                                    if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table") != undefined) {
                                        sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table").getModel().refresh(true);
                                    }
                                }
                            } else {
                                var sMsg = 'Invalid Batch.'
                                sap.m.MessageBox.error(sMsg);
                                if (sap.ui.getCore().byId("Dialog1") != undefined) {
                                    sap.ui.getCore().byId("Dialog1").close();
                                    sap.ui.getCore().byId("Dialog1").destroy();
                                }
                            }
                            busy.close()
                        }.bind(this),
                        error: function (data) {
                            console.log(data)
                            busy.close()
                        }
                    });
                });

                //dialog for batch picking
                var oDialog = new sap.m.Dialog("Dialog1", {
                    title: "Scan Batch and Enter Quantity",
                    contentWidth: "20%",
                    closeOnNavigation: true,
                    buttons: [oButton1, oButton2],
                    content: [
                        new sap.m.Label({ text: "Batch:", required: true }),
                        new sap.m.Input({
                            maxLength: 20, id: "Batch",
                            liveChange: function (oEvent) {
                                var input = oEvent.getSource();
                                input.setValue(input.getValue().toUpperCase());
                            }
                        }),
                        new sap.m.Label({ text: "Qty:", required: true }),
                        new sap.m.Input({ maxLength: 20, id: "Qty", type: "Number" })
                    ]
                });

                oDialog.addStyleClass("sapUiContentPadding");
                oDialog.open()

            },
            
            removeBatchBakery: function (oEvent) {
                //get user selected data and add leading zeroes where necessary
                var outboundDelivery1 = "000000000" + oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().outboundDelivery;
                console.log(oEvent.getSource().getParent().getParent().getBindingContext().getObject().outboundDelivery)
                var deliveryNumber = outboundDelivery1.substr(outboundDelivery1.length - 10);
                var batchItem = oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().item;
                var batchQty = parseFloat(oEvent.getSource().getParent().getParent().getSelectedContexts()[0].getObject().plannedQuant);
                var totalPicked = 0
                var exists = 0
                var extensionAPI = this.extensionAPI
                //open busy dialog
                var busy = new sap.m.BusyDialog();
                busy.open()

                //remove batch via function import removeBatchFromDelivery
                var oRemoveBatch = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

                oRemoveBatch.callFunction("/removeBatchFromDelivery", {
                    method: "POST",
                    urlParameters: {
                        deliveryNumber: deliveryNumber,
                        batchItem: batchItem,
                    },
                    success: function (oData, oResponse) {
                        if (oData.Type == 'E') {
                            sap.m.MessageBox.error(oData.Message);
                            busy.close()
                        } else {
                            sap.m.MessageToast.show("Batch removed", {
                                duration: 3000,                  // default
                                width: "15em",                   // default
                                my: "center bottom",             // default
                                at: "center bottom",             // default
                                of: window,                      // default
                                offset: "0 0",                   // default
                                collision: "fit fit",            // default
                                onClose: null,                   // default
                                autoClose: true,                 // default
                                animationTimingFunction: "ease", // default
                                animationDuration: 1000,         // default
                                closeOnBrowserNavigation: true   // default
                            });

                            //close busy dialog and refresh tables
                            busy.close()
                            extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_PickList_L2--PickList::Table");
                            if (sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table") != undefined) {
                                sap.ui.getCore().byId("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table").getModel().refresh(true);
                            }
                            extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_I_Bakery_L2--PickList::Table");
                        }
                    }.bind(this),
                    error: function (oError) {
                        busy.close()
                        var sMsg = 'Unable to remove Batch.'
                        sap.m.MessageToast.show(sMsg);
                    },
                })
            }
        };
    });

function onContinueAddHU(oEvent, finalHU, item, material, uom, outboundDelivery, extensionAPI) {

    //on continue button from warning dialog add HU via assignHUToDelivery
    var oModelCreateHU = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZSCM_PICKINGACTION_SRV");

    oModelCreateHU.callFunction("/assignHUToDelivery", {
        method: "POST",
        urlParameters: {
            deliveryNumber: outboundDelivery,
            deliveryItem: item,
            HU_EXID: finalHU,
            material: material,
            picked: '0',
            batch: '',
            uom: uom,
        },
        success: function (oData, oResponse) {
            console.log(oData)
            var message = oData.Message
            var messageType = oData.Type
            if (messageType == 'S') {
                console.log(message)
                sap.m.MessageToast.show(message);
                //if success refresh table
                extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_C_PICKINGAPP--ScenarioHU::Table");
                extensionAPI.refresh("pickingapp.pickingapp::sap.suite.ui.generic.template.ObjectPage.view.Details::ZSCM_PickList_S1_L2--Pallet::Table");
            } else {
                sap.m.MessageBox.error(message);
            }
        },
        error: function (oError) {
            console.log(oError.response.body)
            sap.m.MessageBox.error(oError.response.body);
        },
    })
}