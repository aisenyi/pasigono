erpnext.PointOfSale.StripeTerminal = function(){
	var connectiontoken = "";
	var terminal;
	var loading_dialog, connecting_dialog, message_dilaog, confirm_dialog;
	var payment_object,is_online;
	var me = this;

	this.assign_stripe_connection_token = function(payment, is_online) {
		payment_object = payment;
		is_online = is_online;
		show_loading_modal('Connecting to Stripe Terminal', 'Please Wait<br>Connecting to Stripe Terminal');
		frappe.call({
			method: "pasigono.pasigono.api.get_stripe_terminal_token",
			freeze: true,
			headers: {
				"X-Requested-With": "XMLHttpRequest"
			},
			callback: function (r) {
				if (r.message) {
					connectiontoken = r.message.secret;
					terminal = StripeTerminal.create({
						onFetchConnectionToken: fetchConnectionToken,
						onUnexpectedReaderDisconnect: unexpectedDisconnect,

					});

					connect_to_stripe_terminal(payment, is_online);
				} else {
					show_error_dialog('Please configure the stripe settings.');
				}
			}
		});
	}

	function fetchConnectionToken() {
		return connectiontoken;

	}

	function show_loading_modal(title, message) {
		loading_dialog = new frappe.ui.Dialog({
			title: title,
			fields: [{
					label: '',
					fieldname: 'show_dialog',
					fieldtype: 'HTML'

				},

			],

		});
		var html = '<div style="min-height:200px;position: relative;text-align: center;padding-top: 75px;line-height: 25px;font-size: 15px;">';
		html += '<div style="">' + message + '</div>';
		html += '</div>';
		loading_dialog.fields_dict.show_dialog.$wrapper.html(html);
		loading_dialog.show();
	}

	function unexpectedDisconnect() {
		frappe.msgprint("Error: Stripe terminal unexpectedly disconnected. Please reload page")
	}

	function connect_to_stripe_terminal(payment, is_online) {
		frappe.call({
			method: "pasigono.pasigono.api.get_stripe_terminal_settings",
			freeze: true,
			headers: {
				"X-Requested-With": "XMLHttpRequest"
			},
			callback: function (r) {
				var isSimulated = false;
				var testCardNumber = "";
				var testCardtype = "";
				if (r.message != undefined) {
					if (r.message.enable_test_mode == 1) {
						isSimulated = true;
						testCardNumber = r.message.card_number;
						testCardtype = r.message.card_type;

					}

				}

				var config = {
					simulated: isSimulated
				};
				terminal.discoverReaders(config).then(function (discoverResult) {
					if (discoverResult.error) {
						connecting_dialog.hide();
						show_error_dialog('No Stripe readers found.');
					} else if (discoverResult.discoveredReaders.length === 0) {
						connecting_dialog.hide();
						show_error_dialog('No Stripe readers found.');

					} else {
						// Just select the first reader here.
						var selectedReader = discoverResult.discoveredReaders[0];
						terminal.connectReader(selectedReader).then(function (connectResult) {
							if (connectResult.error) {
								connecting_dialog.hide();
								show_error_dialog('Failed to connect.' + connectResult.error.message);

							} else {
								if (r.message.enable_test_mode == 1 && testCardNumber != "" && testCardtype != "") {
									terminal.setSimulatorConfiguration({
										'testCardNumber': testCardNumber,
										'testPaymentMethod': testCardtype
									});
								}
								loading_dialog.hide();
								//connecting_dialog.hide();
								//display_details(payment);
								//collecting_payments(payment, is_online);
							}
						});
					}
				});
			}
		});
	}
	
	
	this.display_details = async function(payment){
		var frm = payment.frm.doc;
		var items = [];
		var taxes = Math.round(payment.frm.doc.total_taxes_and_charges.toFixed(2)*100);
		var total = Math.round(payment.frm.doc.grand_total.toFixed(2)*100);
		var currency = payment.frm.doc.currency;
		frm.items.forEach(function(row){
			var amount = row.amount.toFixed(2)*100;
			var item = {
				"description": row.item_name,
				"quantity": Math.round(row.qty),
				"amount": Math.round(amount)
			};
			items.push(item);
		});
		await terminal.clearReaderDisplay();
		terminal.setReaderDisplay({
			type: 'cart',
			cart: {
				line_items: items,
				tax: taxes,
				total: total,
				currency: currency
			}
		});
	}

	this.collecting_payments = function(payment, is_online) {
		if(payment.frm.doc.is_return == 1){
			refund_payment(payment, is_online);
		}
		else{
			create_payment(payment, is_online);
		}
	}
	
	
	function refund_payment(payment, is_online){
		show_loading_modal('Refunding Payments', 'Please Wait<br>Refunding Payments');
		var payments = payment.frm.doc.payments;
		payments.forEach(function(row){
			if(row.mode_of_payment == "Stripe"){
				frappe.call({
					method: "pasigono.pasigono.api.refund_payment",
					freeze: true,
					args: {
						"payment_intent_id": row.card_payment_intent,
						"amount": row.base_amount * -1
					},
					headers: {
						"X-Requested-With": "XMLHttpRequest"
					},
					callback: function(result){
						console.log({"refund_result": result});
						loading_dialog.hide();
						if (is_online) {
							payment.frm.savesubmit()
								.then((sales_invoice) => {
									if (sales_invoice && sales_invoice.doc) {
										payment.frm.doc.docstatus = sales_invoice.doc.docstatus;
										frappe.show_alert({
											indicator: 'green',
											message: __(`POS invoice ${sales_invoice.doc.name} created succesfully`)
										});
										payment.toggle_components(false);
										payment.order_summary.toggle_component(true);
										payment.order_summary.load_summary_of(payment.frm.doc, true);
									}
								});

						} else {
							payment.submit_invoice();
						}
					}
				});
			}
		});
	}
	
	
	function create_payment(payment, is_online){
		show_loading_modal('Collecting Payments', 'Please Wait<br>Collecting Payments');
		frappe.call({
			method: "pasigono.pasigono.api.payment_intent_creation",
			freeze: true,
			args: {
				"sales_invoice": payment.frm.doc
			},
			headers: {
				"X-Requested-With": "XMLHttpRequest"
			},
			callback: function (r) {
				terminal.collectPaymentMethod(r.message.client_secret).then(function (result) {
					if (result.error) {
						loading_dialog.hide();
						show_payment_error_dialog(result.error.message);
					} else {
						terminal.processPayment(result.paymentIntent).then(function (result) {
							if (result.error) {
								loading_dialog.hide();
								show_payment_error_dialog(result.error.message);
							} else if (result.paymentIntent) {
								loading_dialog.hide();
								confirm_dialog = new frappe.ui.Dialog({
									title: 'Confirm Stripe Payment',
									fields: [{
											label: '',
											fieldname: 'show_dialog',
											fieldtype: 'HTML'
										},
									],
									primary_action_label: "Confirm",
									primary_action(values) {
										capture_payment(payment, is_online, result.paymentIntent);
									},
									secondary_action_label: "Cancel",
									secondary_action(values) {
										cancel_payment(payment, is_online, result.paymentIntent);
									}
								});
								var html = '<div style="text-align: center;">Please confirm. Payment of ' + result.paymentIntent.currency.toUpperCase() + ' ';
								html += result.paymentIntent.amount/100 + ' through stripe.</div>';
								confirm_dialog.fields_dict.show_dialog.$wrapper.html(html);
								confirm_dialog.show();
								console.log({"result": result});
								
							}
						});
					}
				});

			}
		})
	}
	
	
	function cancel_payment(payment, is_online, payment_intent){
		confirm_dialog.hide();
		
		var canceling_dialog = new frappe.ui.Dialog({
			title: 'Canceling Stripe Terminal',
			fields: [{
					label: '',
					fieldname: 'show_dialog',
					fieldtype: 'HTML'
				},
			],
		});
		var html = '<div style="min-height:200px;position: relative;text-align: center;padding-top: 75px;line-height: 25px;font-size: 15px;">';
		html += '<div style="">Please Wait<br>Canceling Stripe Terminal</div>';
		html += '</div>';
		canceling_dialog.fields_dict.show_dialog.$wrapper.html(html);
		canceling_dialog.show();
		
		frappe.call({
			method: "pasigono.pasigono.api.cancel_payment_intent",
			freeze: true,
			args: {
				"payment_intent_id": payment_intent.id,
				"sales_invoice_id": payment.frm.doc.name
			},
			headers: {
				"X-Requested-With": "XMLHttpRequest"
			},
			callback: function (intent_result) {
				console.log({"canceled_intent": intent_result});
				canceling_dialog.hide();
				frappe.msgprint("Stripe payment cancelled.");
			}
		})
	}
	
	
	function capture_payment(payment, is_online, payment_intent){
		confirm_dialog.hide();
		show_loading_modal('COllecting Payments', 'Please Wait<br>Collecting Payments');
		frappe.call({
			method: "pasigono.pasigono.api.capture_payment_intent",
			freeze: true,
			args: {
				"payment_intent_id": payment_intent.id,
				"sales_invoice_id": payment.frm.doc.name
			},
			headers: {
				"X-Requested-With": "XMLHttpRequest"
			},
			callback: function (intent_result) {
				console.log({"intent": intent_result});
				loading_dialog.hide();
				var payments = payment.frm.doc.payments;
				payments.forEach(function(row){
					if(row.mode_of_payment == "Stripe"){
						var card_info = intent_result.message.charges.data[0].payment_method_details.card_present;
						row.card_brand = card_info.brand;
						row.card_last4 = card_info.last4;
						row.card_account_type = card_info.receipt.account_type;
						row.card_application_preferred_name = card_info.receipt.application_preferred_name;
						row.card_dedicated_file_name = card_info.receipt.dedicated_file_name;
						row.card_authorization_response_code = card_info.receipt.authorization_response_code;
						row.card_application_cryptogram = card_info.receipt.application_cryptogram;
						row.card_terminal_verification_results = card_info.receipt.terminal_verification_results;
						row.card_transaction_status_information = card_info.receipt.transaction_status_information;
						row.card_authorization_code = card_info.receipt.authorization_code;
						row.card_charge_id = intent_result.message.charges.data[0].id;
						row.card_payment_intent = intent_result.message.charges.data[0].payment_intent;
					}
				});
				console.log({"frm": payment.frm});

				if (is_online) {
					payment.frm.savesubmit()
						.then((sales_invoice) => {
							//For raw printing
							if(window.open_cash_drawer_automatically == 1){
								this.open_cash_drawer();
							}
							
							if(window.automatically_print == 1){
								this.raw_print(this.frm);							
							}
							
							if (sales_invoice && sales_invoice.doc) {
								payment.frm.doc.docstatus = sales_invoice.doc.docstatus;
								frappe.show_alert({
									indicator: 'green',
									message: __(`POS invoice ${sales_invoice.doc.name} created succesfully`)
								});
								frappe.call({
									method: "pasigono.pasigono.api.update_payment_intent",
									freeze: true,
									args: {
										"payment_intent_id": payment_intent.id,
										"sales_invoice_id": sales_invoice.doc.name
									},
									headers: {
										"X-Requested-With": "XMLHttpRequest"
									},
									callback: function (intent_result) {
										console.log({"intent_result": intent_result});
										payment.toggle_components(false);
										payment.order_summary.toggle_component(true);
										payment.order_summary.load_summary_of(payment.frm.doc, true);
									}
								});
							}
						});

				} else {
					payment.submit_invoice();
				}
			}
		})
	}
	
	function retry_stripe_terminal(me)
	{
		message_dilaog.hide();
		//assign_stripe_connection_token
		me.assign_stripe_connection_token(payment_object, is_online);
	}
	function change_payment_method()
	{
		message_dilaog.hide();
		$(".num-col.brand-primary").click();
		
	}
	
	function show_error_dialog(message) {
		message_dilaog = new frappe.ui.Dialog({
			title: 'Message',
			fields: [{
					label: '',
					fieldname: 'show_dialog',
					fieldtype: 'HTML'

				},

			],
			primary_action_label: "Retry",
			primary_action(values) {
				retry_stripe_terminal(me);
			}
		});
		var html = "<p>" + message + "</p>";
		message_dilaog.fields_dict.show_dialog.$wrapper.html(html);
		message_dilaog.show();
	}
	
	function show_payment_error_dialog(message) {
		message_dilaog = new frappe.ui.Dialog({
			title: 'Message',
			fields: [{
					label: '',
					fieldname: 'show_dialog',
					fieldtype: 'HTML'

				},

			],
			primary_action_label: "Retry",
			secondary_action_label: "Change Payment Mode",
			primary_action(values) {
				//retry_stripe_terminal(me);
				me.collecting_payments(payment_object, is_online);
			},
			secondary_action(values) {
				change_payment_method();
			}
		});
		var html = "<p>" + message + "</p>";
		message_dilaog.fields_dict.show_dialog.$wrapper.html(html);
		message_dilaog.show();
	}
}
