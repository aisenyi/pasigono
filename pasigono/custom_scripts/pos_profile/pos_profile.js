frappe.ui.form.on('POS Profile', {
	refresh: function(frm) {
		frm.trigger('toggle_raw_display');
	},
	
	toggle_raw_display: function(frm){
		frm.toggle_display('automatically_print', frm.doc.enable_raw_printing);
		frm.toggle_display('open_cash_drawer_automatically', frm.doc.enable_raw_printing);
	},
	
	enable_raw_printing: function(frm){
		frm.trigger('toggle_raw_display');
	}
});
