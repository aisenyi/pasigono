erpnext.PointOfSale.PastOrderSummary = class extends erpnext.PointOfSale.PastOrderSummary{
	bind_events() {
		this.$summary_container.on('click', '.return-btn', () => {
			this.events.process_return(this.doc.name);
			this.toggle_component(false);
			this.$component.find('.no-summary-placeholder').css('display', 'flex');
			this.$summary_wrapper.css('display', 'none');
		});

		this.$summary_container.on('click', '.edit-btn', () => {
			this.events.edit_order(this.doc.name);
			this.toggle_component(false);
			this.$component.find('.no-summary-placeholder').css('display', 'flex');
			this.$summary_wrapper.css('display', 'none');
		});

		this.$summary_container.on('click', '.delete-btn', () => {
			this.events.delete_order(this.doc.name);
			this.show_summary_placeholder();
		});

		this.$summary_container.on('click', '.delete-btn', () => {
			this.events.delete_order(this.doc.name);
			this.show_summary_placeholder();
			// this.toggle_component(false);
			// this.$component.find('.no-summary-placeholder').removeClass('d-none');
			// this.$summary_wrapper.addClass('d-none');
		});

		this.$summary_container.on('click', '.new-btn', () => {
			this.events.new_order();
			this.toggle_component(false);
			this.$component.find('.no-summary-placeholder').css('display', 'flex');
			this.$summary_wrapper.css('display', 'none');
		});

		this.$summary_container.on('click', '.email-btn', () => {
			this.email_dialog.fields_dict.email_id.set_value(this.customer_email);
			this.email_dialog.show();
		});

		this.$summary_container.on('click', '.print-btn', () => {
			this.print_receipt();
		});
		
		//For raw print
		this.$summary_container.on('click', '.direct-print-btn', () => {
			this.events.raw_print();
		});
		
		this.$summary_container.on('click', '.cash-drawer-btn', () => {
			this.events.open_cash_drawer();
		});
	}
	
	prepare_dom() {
		this.wrapper.append(
			`<section class="past-order-summary">
				<div class="no-summary-placeholder">
					${__('Select an invoice to load summary data')}
				</div>
				<div class="invoice-summary-wrapper">
					<div class="abs-container">
						<div class="upper-section"></div>
						<div class="label">${__('Items')}</div>
						<div class="items-container summary-container"></div>
						<div class="label">${__('Totals')}</div>
						<div class="totals-container summary-container"></div>
						<div class="label">${__('Payments')}</div>
						<div class="payments-container summary-container"></div>
						<div class="summary-btns"></div>
						<div class="raw-btns summary-container"></div>
					</div>
				</div>
			</section>`
		);

		this.$component = this.wrapper.find('.past-order-summary');
		this.$summary_wrapper = this.$component.find('.invoice-summary-wrapper');
		this.$summary_container = this.$component.find('.abs-container');
		this.$upper_section = this.$summary_container.find('.upper-section');
		this.$items_container = this.$summary_container.find('.items-container');
		this.$totals_container = this.$summary_container.find('.totals-container');
		this.$payment_container = this.$summary_container.find('.payments-container');
		this.$summary_btns = this.$summary_container.find('.summary-btns');
		this.$raw_btns = this.$summary_container.find('.raw-btns');
	}
	
	load_summary_of(doc, after_submission=false) {
		after_submission ?
			this.$component.css('grid-column', 'span 10 / span 10') :
			this.$component.css('grid-column', 'span 6 / span 6');

		this.toggle_summary_placeholder(false);

		this.doc = doc;

		this.attach_document_info(doc);

		this.attach_items_info(doc);

		this.attach_totals_info(doc);

		this.attach_payments_info(doc);

		const condition_btns_map = this.get_condition_btn_map(after_submission);

		this.add_summary_btns(condition_btns_map);
		this.add_raw_btns();
	}
	
	add_raw_btns(){
		this.$raw_btns.html('');
		if(window.enable_raw_print == 1 && window.raw_printer){
			this.$raw_btns.append(
				`<div class="summary-btn btn btn-default direct-print-btn">Direct Print</div>
				<div style="margin-top: 10px;" class="summary-btn btn btn-default cash-drawer-btn">Open Cash Drawer</div>`
			);
		}
		this.$raw_btns.children().last().removeClass('mr-4');
	}
};
