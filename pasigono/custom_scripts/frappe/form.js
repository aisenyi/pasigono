frappe.ui.form.Form = class extends frappe.ui.form.Form{
	savesubmit(btn, callback, on_error) {
		var me = this;
		return new Promise(resolve => {
			this.validate_form_action("Submit");
			if(this.doctype == 'POS Invoice'){
				me.submit_confirmed(btn, callback, on_error, resolve);
			}
			else{
				frappe.confirm(__("Permanently Submit {0}?", [this.docname]), function() {
					me.submit_confirmed(btn, callback, on_error);
				}, function(){
					me.handle_save_fail(btn, on_error, resolve);
				});
			}
		});
	}
	
	submit_confirmed(btn, callback, on_error, resolve){
		var me = this;
		frappe.validated = true;
		me.script_manager.trigger("before_submit").then(function() {
			if(!frappe.validated) {
				return me.handle_save_fail(btn, on_error);
			}

			me.save('Submit', function(r) {
				if(r.exc) {
					me.handle_save_fail(btn, on_error);
				} else {
					frappe.utils.play_sound("submit");
					callback && callback();
					me.script_manager.trigger("on_submit")
						.then(() => resolve(me))
						.then(() => {
							if (frappe.route_hooks.after_submit) {
								let route_callback = frappe.route_hooks.after_submit;
								delete frappe.route_hooks.after_submit;
								route_callback(me);
							}
						});
				}
			}, btn, () => me.handle_save_fail(btn, on_error), resolve);
		});
	}
}
